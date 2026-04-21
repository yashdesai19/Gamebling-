from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.team import Team
from app.services.cricapi_client import CricAPIClient
from app.services.rapidapi_client import RapidAPIClient
from app.services.bet_settlement import auto_settle_match_bets


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(UTC)
    try:
        # Check if it's a timestamp in milliseconds (RapidAPI)
        if isinstance(value, str) and value.isdigit() and len(value) > 10:
            return datetime.fromtimestamp(int(value) / 1000.0, tz=UTC)
            
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except Exception:
        return datetime.now(UTC)


def _infer_short_name(name: str) -> str:
    parts = [p for p in name.replace("-", " ").split() if p]
    if len(parts) >= 2:
        short = "".join(p[0] for p in parts[:4]).upper()
    else:
        short = name[:4].upper()
    short = "".join(ch for ch in short if ch.isalnum())
    return short[:10] or "TEAM"


def _build_live_score_text(scores: list[dict[str, Any]]) -> tuple[str | None, str | None]:
    if not scores:
        return None, None
    lines: list[str] = []
    latest_over: str | None = None
    for s in scores:
        inning = str(s.get("inning") or "").strip()
        runs = s.get("r")
        wickets = s.get("w")
        overs = s.get("o")
        if overs is not None:
            latest_over = str(overs)
        chunk = f"{runs}/{wickets}"
        if overs is not None:
            chunk += f" ({overs})"
        if inning:
            chunk = f"{inning}: {chunk}"
        lines.append(chunk)
    return " | ".join(lines), latest_over


def _map_status(raw_status: str) -> str:
    s = (raw_status or "").lower()
    if any(k in s for k in ["live", "in progress", "innings break", "stumps"]):
        return "live"
    if any(k in s for k in ["won", "result", "completed", "match ended"]):
        return "completed"
    if any(k in s for k in ["cancel", "abandon", "no result"]):
        return "cancelled"
    if any(k in s for k in ["upcoming", "starts", "scheduled", "toss"]):
        return "open"
    return "scheduled"


class LiveIPLSyncService:
    def __init__(self, db: Session):
        self.db = db
        self.cric_client = CricAPIClient()
        self.rapid_client = RapidAPIClient()

    def _resolve_team(self, name: str) -> Team:
        existing = self.db.scalar(select(Team).where(Team.name == name))
        if existing:
            return existing

        short = _infer_short_name(name)
        base = short
        i = 2
        while self.db.scalar(select(Team).where(Team.short_name == short)):
            short = f"{base[:8]}{i}"
            i += 1

        t = Team(name=name, short_name=short, logo=None)
        self.db.add(t)
        self.db.flush()
        return t

    def _find_team_by_name(self, team_names: list[str], winner_text: str | None) -> Team | None:
        if not winner_text:
            return None
        lower = winner_text.lower()
        for name in team_names:
            if name.lower() in lower:
                return self.db.scalar(select(Team).where(Team.name == name))
        return None

    def sync_ipl(self) -> dict[str, int | str]:
        # Priority 1: RapidAPI for full schedule
        synced = 0
        if self.rapid_client.enabled():
            try:
                synced += self.sync_ipl_rapid()
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"RapidAPI sync failed: {e}")

        # Priority 2: CricAPI for live updates
        if self.cric_client.enabled():
            try:
                res = self.sync_ipl_cricapi()
                synced += res.get("synced", 0)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"CricAPI sync failed: {e}")

        return {"status": "ok", "synced": synced}

    def sync_ipl_rapid(self) -> int:
        data = self.rapid_client.fetch_fixtures()
        if not data:
            return 0
            
        schedules = data.get("response", {}).get("schedules", [])
        synced_count = 0
        
        for day in schedules:
            if not isinstance(day, dict): continue
            match_list = day.get("scheduleAdWrapper", {}).get("matchScheduleList", [])
            if not isinstance(match_list, list): continue
            
            for entry in match_list:
                if not isinstance(entry, dict): continue
                match_infos = entry.get("matchInfo")
                if not isinstance(match_infos, list): continue
                
                for info in match_infos:
                    if not isinstance(info, dict): continue
                    
                    series_name = str(entry.get("seriesName") or info.get("seriesName", "")).lower()
                    if "indian premier league" not in series_name and "ipl" not in series_name:
                        continue
                    
                    team1_name = info.get("team1", {}).get("teamName", "TBD")
                    team2_name = info.get("team2", {}).get("teamName", "TBD")
                    
                    team1 = self._resolve_team(team1_name)
                    team2 = self._resolve_team(team2_name)
                    
                    external_id = str(info.get("matchId") or "")
                    
                    match = self.db.scalar(select(Match).where(Match.external_match_id == external_id))
                    if not match:
                        match = Match(external_match_id=external_id)
                    
                    match.team1_id = team1.id
                    match.team2_id = team2.id
                    match.match_date = _parse_datetime(str(info.get("startDate") or ""))
                    match.venue = f"{info.get('venueInfo', {}).get('ground')}, {info.get('venueInfo', {}).get('city')}"
                    
                    # RapidAPI schedule state might be 'preview' or 'live'
                    state = str(info.get("state") or "").lower()
                    if state == "live":
                        match.match_status = "live"
                    elif state in ["preview", "upcoming"]:
                        match.match_status = "scheduled"
                    
                    match.last_synced_at = datetime.now(UTC)
                    self.db.add(match)
                    synced_count += 1
                
        self.db.commit()
        return synced_count

    def sync_ipl_cricapi(self) -> dict[str, int | str]:
        rows = self.cric_client.fetch_current_matches()
        synced = 0
        skipped = 0

        # Filter for IPL matches
        ipl_rows = []
        for row in rows:
            series = str(row.get("series") or row.get("series_name") or "").lower()
            name = str(row.get("name") or "").lower()
            is_ipl = any(term in text for term in ["indian premier league", "ipl"] for text in [series, name])
            if is_ipl:
                ipl_rows.append(row)
            else:
                skipped += 1

        for row in ipl_rows:
            teams_raw = row.get("teams") or []
            if not isinstance(teams_raw, list) or len(teams_raw) < 2:
                skipped += 1
                continue
            team_names = [str(teams_raw[0]), str(teams_raw[1])]

            team1 = self._resolve_team(team_names[0])
            team2 = self._resolve_team(team_names[1])

            external_id = str(row.get("id") or "").strip() or None
            if not external_id: continue
            
            match = self.db.scalar(select(Match).where(Match.external_match_id == external_id))

            if not match:
                match = Match(external_match_id=external_id)
                match.team1_id = team1.id
                match.team2_id = team2.id
                match.match_date = _parse_datetime(str(row.get("dateTimeGMT") or row.get("date") or ""))
                match.match_status = "scheduled"

            raw_status = str(row.get("status") or "")
            live_score, live_over = _build_live_score_text(row.get("score") if isinstance(row.get("score"), list) else [])
            toss_team = self._find_team_by_name(team_names, str(row.get("tossWinner") or row.get("toss_winner") or ""))
            winner_team = self._find_team_by_name(team_names, str(row.get("matchWinner") or row.get("winner") or ""))

            match.venue = str(row.get("venue") or match.venue or "TBD")
            match.match_status = _map_status(raw_status)
            match.live_score = live_score
            match.live_over = live_over
            match.live_status_text = raw_status or None
            match.last_synced_at = datetime.now(UTC)
            if toss_team:
                match.toss_winner_team_id = toss_team.id
            if winner_team:
                match.match_winner_team_id = winner_team.id

            was_completed = match.id and match.match_status == "completed"

            self.db.add(match)
            self.db.flush() 
            
            if not was_completed and match.match_status == "completed" and match.match_winner_team_id:
                auto_settle_match_bets(self.db, match)

            synced += 1

        self.db.commit()
        return {"status": "ok", "synced": synced, "skipped": skipped}

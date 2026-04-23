from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import and_, or_, select
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


def _extract_live_score_payload(raw: dict[str, Any]) -> tuple[str | None, str | None]:
    score_keys = ("score", "scores", "scoreCard", "scorecard", "liveScore", "live_score")
    for key in score_keys:
        value = raw.get(key)
        if isinstance(value, list):
            text, over = _build_live_score_text([x for x in value if isinstance(x, dict)])
            if text or over:
                return text, over
        if isinstance(value, dict):
            items = value.get("innings") or value.get("cards") or value.get("data")
            if isinstance(items, list):
                text, over = _build_live_score_text([x for x in items if isinstance(x, dict)])
                if text or over:
                    return text, over
            inning = str(value.get("inning") or value.get("team") or value.get("name") or "").strip()
            runs = value.get("r") or value.get("runs")
            wickets = value.get("w") or value.get("wkts") or value.get("wickets")
            overs = value.get("o") or value.get("overs")
            if runs is not None or wickets is not None or overs is not None:
                chunk = f"{runs}/{wickets}"
                if overs is not None:
                    chunk += f" ({overs})"
                if inning:
                    chunk = f"{inning}: {chunk}"
                return chunk, str(overs) if overs is not None else None
    return None, None


def _is_live_status(raw_status: str) -> bool:
    s = (raw_status or "").lower()
    return any(k in s for k in ["live", "in progress", "innings break", "stumps", "rain delay", "play stopped"])


def _parse_datetime_or_none(value: Any) -> datetime | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    try:
        if raw.isdigit() and len(raw) > 10:
            return datetime.fromtimestamp(int(raw) / 1000.0, tz=UTC)
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except Exception:
        return None


def _extract_toss_time(raw: dict[str, Any], match_time: datetime) -> datetime:
    candidate_keys = (
        "tossTime",
        "toss_time",
        "tossDateTime",
        "toss_datetime",
        "tossDateTimeGMT",
        "tossStartTime",
        "tossStartDate",
    )
    for key in candidate_keys:
        parsed = _parse_datetime_or_none(raw.get(key))
        if parsed:
            return parsed
    # Fallback so toss betting still works on feeds that do not expose a dedicated toss timestamp.
    return match_time - timedelta(minutes=30)


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

    def _find_existing_match_by_teams_and_time(
        self,
        team1_id: int,
        team2_id: int,
        match_time: datetime,
    ) -> Match | None:
        # CricAPI and schedule providers can use different external ids.
        # Match by both teams within a broad time window to update the existing fixture.
        window_start = match_time - timedelta(hours=8)
        window_end = match_time + timedelta(hours=8)
        return self.db.scalar(
            select(Match)
            .where(
                and_(
                    or_(
                        and_(Match.team1_id == team1_id, Match.team2_id == team2_id),
                        and_(Match.team1_id == team2_id, Match.team2_id == team1_id),
                    ),
                    Match.match_date >= window_start,
                    Match.match_date <= window_end,
                )
            )
            .order_by(Match.match_date.asc())
        )

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
                    match.toss_time = _extract_toss_time(info, match.match_date)
                    match.venue = f"{info.get('venueInfo', {}).get('ground')}, {info.get('venueInfo', {}).get('city')}"
                    
                    # RapidAPI schedule state might be 'preview' or 'live'
                    state = str(info.get("state") or info.get("status") or "").lower()
                    live_score, live_over = _extract_live_score_payload(info)
                    if state == "live" or live_score or _is_live_status(state):
                        match.match_status = "live"
                        match.live_score = live_score
                        match.live_over = live_over
                        match.live_status_text = str(info.get("status") or info.get("state") or "live")
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

            match_time = _parse_datetime(str(row.get("dateTimeGMT") or row.get("date") or ""))
            match = self.db.scalar(select(Match).where(Match.external_match_id == external_id))
            if not match:
                match = self._find_existing_match_by_teams_and_time(team1.id, team2.id, match_time)

            if not match:
                match = Match(external_match_id=external_id)
                match.team1_id = team1.id
                match.team2_id = team2.id
                match.match_date = match_time
                match.match_status = "scheduled"
            else:
                # Backfill ext id once resolved so future updates are direct lookups.
                if external_id and not match.external_match_id:
                    match.external_match_id = external_id
                previous_gap = abs((match.match_date - match_time).total_seconds())
                if previous_gap > 120:
                    match.match_date = match_time
                match.team1_id = team1.id
                match.team2_id = team2.id

            raw_status = str(row.get("status") or "")
            live_score, live_over = _extract_live_score_payload(row)
            toss_team = self._find_team_by_name(team_names, str(row.get("tossWinner") or row.get("toss_winner") or ""))
            winner_team = self._find_team_by_name(team_names, str(row.get("matchWinner") or row.get("winner") or ""))
            was_completed = match.match_status == "completed"

            match.venue = str(row.get("venue") or match.venue or "TBD")
            match.toss_time = _extract_toss_time(row, match.match_date)
            mapped_status = _map_status(raw_status)
            # Some feeds keep status as "scheduled/open" even while score is flowing.
            if (live_score or _is_live_status(raw_status)) and mapped_status in {"scheduled", "open"}:
                mapped_status = "live"
            match.match_status = mapped_status
            match.live_score = live_score
            match.live_over = live_over
            match.live_status_text = raw_status or ("live" if live_score else None)
            match.last_synced_at = datetime.now(UTC)
            if toss_team:
                match.toss_winner_team_id = toss_team.id
            if winner_team:
                match.match_winner_team_id = winner_team.id

            self.db.add(match)
            self.db.flush() 
            
            if not was_completed and match.match_status == "completed" and match.match_winner_team_id:
                auto_settle_match_bets(self.db, match)

            synced += 1

        self.db.commit()
        return {"status": "ok", "synced": synced, "skipped": skipped}

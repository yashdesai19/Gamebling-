from __future__ import annotations

from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path

from sqlalchemy import select

# Make script runnable directly via:
# python scripts/seed.py
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.session import SessionLocal
from app.models.match import Match
from app.models.team import Team
from app.models.enums import MatchStatus


TEAMS = [
    ("Mumbai Indians", "MI"),
    ("Chennai Super Kings", "CSK"),
    ("Royal Challengers Bengaluru", "RCB"),
    ("Kolkata Knight Riders", "KKR"),
    ("Delhi Capitals", "DC"),
    ("Rajasthan Royals", "RR"),
    ("Sunrisers Hyderabad", "SRH"),
    ("Gujarat Titans", "GT"),
    ("Lucknow Super Giants", "LSG"),
    ("Punjab Kings", "PBKS"),
]


def upsert_team(db, name: str, short_name: str) -> Team:
    team = db.scalar(select(Team).where(Team.short_name == short_name))
    if team:
        team.name = name
        return team
    team = Team(name=name, short_name=short_name, logo=None)
    db.add(team)
    return team


def main() -> None:
    with SessionLocal() as db:
        teams = {}
        # Fetch or create teams
        for name, short in TEAMS:
            team = upsert_team(db, name, short)
            teams[short] = team
        db.commit()

        # Check if already seeded to avoid duplicates
        existing = list(db.scalars(select(Match).limit(1)))
        
        # If there's existing data, we can either return or clear. Let's assume we clear it or just return.
        if existing:
            # We'll clear existing matches for a fresh seed of the new schedule
            db.execute(Match.__table__.delete())
            db.commit()

        now = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0, microsecond=0) # standardize around 7:30 PM IST (14:00 UTC)
        
        venues = [
            "Wankhede Stadium, Mumbai", 
            "M. Chinnaswamy Stadium, Bengaluru", 
            "Eden Gardens, Kolkata", 
            "Arun Jaitley Stadium, Delhi", 
            "Rajiv Gandhi Stadium, Hyderabad",
            "Narendra Modi Stadium, Ahmedabad",
            "M.A. Chidambaram Stadium, Chennai",
            "Sawai Mansingh Stadium, Jaipur"
        ]
        
        team_list = list(teams.values())
        
        import random
        random.seed(42) # For reproducible random matches
        
        # We will generate 74 matches. None in the past since user only wants today / upcoming.
        for match_num in range(74):
            # Spread matches 1 day apart starting from today.
            
            if match_num == 0:
                t1 = teams["LSG"]
                t2 = teams["RCB"]
                venue = "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow"
                dt = now - timedelta(hours=1)
                status = MatchStatus.live.value
                live_score = "172/2 (16.4 Overs)"
                toss_winner = t1
            else:
                t1, t2 = random.sample(team_list, 2)
                venue = random.choice(venues)
                dt = now + timedelta(days=match_num)
                status = MatchStatus.open.value
                live_score = None
                toss_winner = None
                
            db.add(
                Match(
                    team1_id=t1.id,
                    team2_id=t2.id,
                    venue=venue,
                    match_date=dt,
                    match_status=status,
                    live_score=live_score,
                    toss_winner_team_id=toss_winner.id if toss_winner else None
                )
            )
        db.commit()
        print("Successfully seeded 74 matches starting from today.")


if __name__ == "__main__":
    main()


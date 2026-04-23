import sys
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Resolve backend directory relative to this script file
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables before importing app modules
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# Add backend dir to path so 'app' module is importable
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.session import SessionLocal
from app.models.match import Match
from app.models.team import Team
from sqlalchemy import select

def get_or_create_team(db, name):
    existing = db.scalar(select(Team).where(Team.name == name))
    if existing:
        return existing
    
    # Infer short name
    parts = [p for p in name.replace("-", " ").split() if p]
    short = "".join(p[0] for p in parts[:4]).upper() if len(parts) >= 2 else name[:4].upper()
    short = "".join(ch for ch in short if ch.isalnum())[:10]
    
    t = Team(name=name, short_name=short)
    db.add(t)
    db.flush()
    return t

def ist_to_utc(date_str, time_str):
    # Format: 25-APR-26, 7:30 PM
    # IST is UTC + 5:30
    dt_str = f"{date_str} 2026 {time_str}"
    # Parse e.g. "25-APR 2026 7:30 PM"
    dt_obj = datetime.strptime(dt_str, "%d-%b %Y %I:%M %p")
    # Convert to UTC by subtracting 5:30
    utc_obj = dt_obj - timedelta(hours=5, minutes=30)
    return utc_obj.replace(tzinfo=timezone.utc)

def seed_full_season():
    db = SessionLocal()
    try:
        # Matches from Page 2 and missing from Page 1 (starting from Match 36)
        # Note: Match numbers are for internal reference
        fixtures = [
            # Page 2 Starts here (Approx Apr 25 onwards)
            ("25-APR", "7:30 PM", "Rajasthan Royals", "Sunrisers Hyderabad", "Jaipur", "ipl2026_36"),
            ("26-APR", "3:30 PM", "Gujarat Titans", "Chennai Super Kings", "Ahmedabad", "ipl2026_37"),
            ("26-APR", "7:30 PM", "Lucknow Super Giants", "Kolkata Knight Riders", "Lucknow", "ipl2026_38"),
            ("27-APR", "7:30 PM", "Delhi Capitals", "Royal Challengers Bengaluru", "Delhi", "ipl2026_39"),
            ("28-APR", "7:30 PM", "Punjab Kings", "Rajasthan Royals", "New Chandigarh", "ipl2026_40"),
            ("29-APR", "7:30 PM", "Mumbai Indians", "Sunrisers Hyderabad", "Mumbai", "ipl2026_41"),
            ("30-APR", "7:30 PM", "Gujarat Titans", "Royal Challengers Bengaluru", "Ahmedabad", "ipl2026_42"),
            ("01-MAY", "7:30 PM", "Rajasthan Royals", "Delhi Capitals", "Jaipur", "ipl2026_43"),
            ("02-MAY", "7:30 PM", "Chennai Super Kings", "Mumbai Indians", "Chennai", "ipl2026_44"),
            ("03-MAY", "3:30 PM", "Sunrisers Hyderabad", "Kolkata Knight Riders", "Hyderabad", "ipl2026_45"),
            ("03-MAY", "7:30 PM", "Gujarat Titans", "Punjab Kings", "Ahmedabad", "ipl2026_46"),
            ("04-MAY", "7:30 PM", "Mumbai Indians", "Lucknow Super Giants", "Mumbai", "ipl2026_47"),
            ("05-MAY", "7:30 PM", "Delhi Capitals", "Chennai Super Kings", "Delhi", "ipl2026_48"),
            ("06-MAY", "7:30 PM", "Sunrisers Hyderabad", "Punjab Kings", "Hyderabad", "ipl2026_49"),
            ("07-MAY", "7:30 PM", "Lucknow Super Giants", "Royal Challengers Bengaluru", "Lucknow", "ipl2026_50"),
            ("08-MAY", "7:30 PM", "Delhi Capitals", "Kolkata Knight Riders", "Delhi", "ipl2026_51"),
            ("09-MAY", "7:30 PM", "Rajasthan Royals", "Gujarat Titans", "Jaipur", "ipl2026_52"),
            ("10-MAY", "3:30 PM", "Chennai Super Kings", "Lucknow Super Giants", "Chennai", "ipl2026_53"),
            ("10-MAY", "7:30 PM", "Royal Challengers Bengaluru", "Mumbai Indians", "Raipur", "ipl2026_54"),
            ("11-MAY", "7:30 PM", "Punjab Kings", "Delhi Capitals", "Dharamshala", "ipl2026_55"),
            ("12-MAY", "7:30 PM", "Gujarat Titans", "Sunrisers Hyderabad", "Ahmedabad", "ipl2026_56"),
            ("13-MAY", "7:30 PM", "Royal Challengers Bengaluru", "Kolkata Knight Riders", "Raipur", "ipl2026_57"),
            ("14-MAY", "7:30 PM", "Punjab Kings", "Mumbai Indians", "Dharamshala", "ipl2026_58"),
            ("15-MAY", "7:30 PM", "Lucknow Super Giants", "Chennai Super Kings", "Lucknow", "ipl2026_59"),
            ("16-MAY", "7:30 PM", "Kolkata Knight Riders", "Gujarat Titans", "Kolkata", "ipl2026_60"),
            ("17-MAY", "3:30 PM", "Punjab Kings", "Royal Challengers Bengaluru", "Dharamshala", "ipl2026_61"),
            ("17-MAY", "7:30 PM", "Delhi Capitals", "Rajasthan Royals", "Delhi", "ipl2026_62"),
            ("18-MAY", "7:30 PM", "Chennai Super Kings", "Sunrisers Hyderabad", "Chennai", "ipl2026_63"),
            ("19-MAY", "7:30 PM", "Rajasthan Royals", "Lucknow Super Giants", "Jaipur", "ipl2026_64"),
            ("20-MAY", "7:30 PM", "Kolkata Knight Riders", "Mumbai Indians", "Kolkata", "ipl2026_65"),
            ("21-MAY", "7:30 PM", "Chennai Super Kings", "Gujarat Titans", "Chennai", "ipl2026_66"),
            ("22-MAY", "7:30 PM", "Sunrisers Hyderabad", "Royal Challengers Bengaluru", "Hyderabad", "ipl2026_67"),
            ("23-MAY", "7:30 PM", "Lucknow Super Giants", "Punjab Kings", "Lucknow", "ipl2026_68"),
            ("24-MAY", "3:30 PM", "Mumbai Indians", "Rajasthan Royals", "Mumbai", "ipl2026_69"),
            ("24-MAY", "7:30 PM", "Kolkata Knight Riders", "Delhi Capitals", "Kolkata", "ipl2026_70"),
        ]

        print(f"Seeding {len(fixtures)} matches...")
        for date_str, time_str, home, away, venue, ext_id in fixtures:
            team1 = get_or_create_team(db, home)
            team2 = get_or_create_team(db, away)
            
            # Upsert
            match = db.scalar(select(Match).where(Match.external_match_id == ext_id))
            if not match:
                match = Match(external_match_id=ext_id)
            
            match.team1_id = team1.id
            match.team2_id = team2.id
            match.match_date = ist_to_utc(date_str, time_str)
            match.venue = venue
            match.match_status = "scheduled"
            
            db.add(match)
        
        db.commit()
        print("Success: Full IPL 2026 season matches (36-70) seeded.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_full_season()

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.match import Match
from app.models.team import Team
from app.schemas.match import MatchPublic
from app.schemas.team import TeamPublic


router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/teams/", response_model=list[TeamPublic])
def list_teams(db: Session = Depends(get_db)) -> list[Team]:
    return list(db.scalars(select(Team).order_by(Team.name)))


@router.get("/", response_model=list[MatchPublic])
def list_matches(db: Session = Depends(get_db)) -> list[Match]:
    q = (
        select(Match)
        .options(
            joinedload(Match.team1),
            joinedload(Match.team2),
            joinedload(Match.toss_winner),
            joinedload(Match.match_winner),
        )
        .order_by(Match.match_date.asc())
    )
    return list(db.scalars(q))


@router.get("/{match_id}", response_model=MatchPublic)
def get_match(match_id: int, db: Session = Depends(get_db)) -> Match:
    q = (
        select(Match)
        .where(Match.id == match_id)
        .options(
            joinedload(Match.team1),
            joinedload(Match.team2),
            joinedload(Match.toss_winner),
            joinedload(Match.match_winner),
        )
    )
    match = db.scalar(q)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


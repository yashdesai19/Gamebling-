from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.match import Match
from app.models.team import Team
from app.models.user import User
from app.schemas.admin_manage import AdminMatchCreate, AdminMatchUpdate, AdminUserPublic
from app.schemas.match import MatchPublic
from app.services.live_match_sync import LiveIPLSyncService


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/matches", response_model=list[MatchPublic])
def admin_list_matches(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> list[Match]:
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


@router.post("/matches", response_model=MatchPublic)
def admin_create_match(
    payload: AdminMatchCreate,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> Match:
    if payload.team1_id == payload.team2_id:
        raise HTTPException(status_code=400, detail="Teams must be different")
    # ensure teams exist
    t1 = db.scalar(select(Team).where(Team.id == payload.team1_id))
    t2 = db.scalar(select(Team).where(Team.id == payload.team2_id))
    if not t1 or not t2:
        raise HTTPException(status_code=400, detail="Invalid team id")

    m = Match(
        team1_id=payload.team1_id,
        team2_id=payload.team2_id,
        match_date=payload.match_date,
        toss_time=payload.toss_time,
        venue=payload.venue,
        match_status=payload.match_status,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return db.scalar(
        select(Match)
        .where(Match.id == m.id)
        .options(joinedload(Match.team1), joinedload(Match.team2), joinedload(Match.toss_winner), joinedload(Match.match_winner))
    )


@router.put("/matches/{match_id}", response_model=MatchPublic)
def admin_update_match(
    match_id: int,
    payload: AdminMatchUpdate,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> Match:
    m = db.scalar(select(Match).where(Match.id == match_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)

    if m.team1_id == m.team2_id:
        raise HTTPException(status_code=400, detail="Teams must be different")

    db.add(m)
    db.commit()
    return db.scalar(
        select(Match)
        .where(Match.id == match_id)
        .options(joinedload(Match.team1), joinedload(Match.team2), joinedload(Match.toss_winner), joinedload(Match.match_winner))
    )


@router.delete("/matches/{match_id}")
def admin_delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> dict[str, str]:
    m = db.scalar(select(Match).where(Match.id == match_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(m)
    db.commit()
    return {"status": "ok"}


@router.get("/users", response_model=list[AdminUserPublic])
def admin_list_users(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> list[User]:
    q = select(User).order_by(User.created_at.desc())
    return list(db.scalars(q))


@router.post("/sync/ipl-live")
def admin_sync_ipl_live(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> dict[str, int | str]:
    svc = LiveIPLSyncService(db)
    return svc.sync_ipl()


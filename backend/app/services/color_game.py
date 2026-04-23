from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from secrets import choice

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.color import ColorBet, ColorRound
from app.models.enums import TransactionStatus, TransactionType
from app.services.wallet import WalletService

logger = logging.getLogger(__name__)


ROUND_SECONDS = 60
BET_LOCK_SECONDS = 0
RESULT_DISPLAY_SECONDS = 1
COMMISSION_RATE = Decimal("0.05")
VALID_COLORS = ("red", "green", "violet")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _quantize_money(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _new_round_times(started_at: datetime) -> tuple[datetime, datetime]:
    lock_at = started_at + timedelta(seconds=ROUND_SECONDS - BET_LOCK_SECONDS)
    end_at = started_at + timedelta(seconds=ROUND_SECONDS)
    return lock_at, end_at


def _create_round(*, db: Session, round_number: int, started_at: datetime) -> ColorRound:
    lock_at, end_at = _new_round_times(started_at)
    rnd = ColorRound(
        round_number=round_number,
        status="open",
        started_at=started_at,
        lock_at=lock_at,
        end_at=end_at,
    )
    db.add(rnd)
    db.commit()
    db.refresh(rnd)
    return rnd


def _draw_result_color() -> str:
    return choice(VALID_COLORS)


def _settle_round(*, db: Session, rnd: ColorRound) -> None:
    if rnd.result_color not in VALID_COLORS:
        return

    now = _utcnow()
    bets = list(
        db.scalars(
            select(ColorBet)
            .where(ColorBet.round_id == rnd.id, ColorBet.status == "placed")
            .with_for_update()
        )
    )
    wallet = WalletService(db)

    for bet in bets:
        if bet.chosen_color == rnd.result_color:
            multiplier = Decimal("3.00") if bet.chosen_color == "violet" else Decimal("2.00")
            gross = _quantize_money(bet.bet_amount * multiplier)
            commission = _quantize_money(gross * COMMISSION_RATE)
            net = _quantize_money(gross - commission)

            wallet.credit(
                user_id=bet.user_id,
                amount=net,
                transaction_type=TransactionType.bet_payout,
                payment_method="wallet",
                status=TransactionStatus.succeeded,
                reference=f"color:round:{rnd.id}:bet:{bet.id}:payout",
            )
            bet.status = "won"
            bet.actual_payout = net
            bet.commission = commission
        else:
            bet.status = "lost"
            bet.actual_payout = Decimal("0.00")
            bet.commission = Decimal("0.00")
        bet.settled_at = now
        db.add(bet)


class ColorGameService:
    def __init__(self, db: Session):
        self.db = db

    def _latest_round_for_update(self) -> ColorRound | None:
        # Lock only the newest round row; locking the whole result set can deadlock
        # under concurrent scheduler/API requests.
        stmt = (
            select(ColorRound)
            .order_by(ColorRound.round_number.desc())
            .limit(1)
            .with_for_update()
        )
        return self.db.scalar(stmt)

    def _ensure_first_round(self, now: datetime) -> ColorRound:
        if self.db.scalar(select(ColorRound.id).limit(1)) is not None:
            return self._latest_round_for_update()  # type: ignore[return-value]

        epoch = int(now.timestamp())
        aligned_start = datetime.fromtimestamp(epoch - (epoch % ROUND_SECONDS), tz=timezone.utc)
        return _create_round(db=self.db, round_number=1, started_at=aligned_start)

    def ensure_current_round(self) -> ColorRound:
        now = _utcnow()
        latest = self._ensure_first_round(now)

        # Safety limit: don't catch up more than 200 rounds in a single call
        # (prevents infinite loops if server was down for a very long time)
        max_iterations = 200

        for _i in range(max_iterations):
            now = _utcnow()
            latest = self._latest_round_for_update()
            if latest is None:
                latest = self._ensure_first_round(now)
                continue

            if now < latest.lock_at:
                if latest.status != "open":
                    latest.status = "open"
                    self.db.add(latest)
                    self.db.commit()
                    self.db.refresh(latest)
                    logger.info(f"[ColorGame] Round #{latest.round_number} -> OPEN")
                return latest

            if now < latest.end_at:
                if latest.status != "closed":
                    latest.status = "closed"
                    self.db.add(latest)
                    self.db.commit()
                    self.db.refresh(latest)
                    logger.info(f"[ColorGame] Round #{latest.round_number} -> CLOSED (drawing soon)")
                return latest

            if latest.result_color is None:
                latest.result_color = _draw_result_color()
                latest.status = "resulted"
                _settle_round(db=self.db, rnd=latest)
                latest.settled_at = now
                self.db.add(latest)
                self.db.commit()
                self.db.refresh(latest)
                logger.info(f"[ColorGame] Round #{latest.round_number} -> RESULTED: {latest.result_color.upper()}")

            if now < latest.end_at + timedelta(seconds=RESULT_DISPLAY_SECONDS):
                if latest.status != "resulted":
                    latest.status = "resulted"
                    self.db.add(latest)
                    self.db.commit()
                    self.db.refresh(latest)
                return latest

            next_rnd = _create_round(
                db=self.db,
                round_number=latest.round_number + 1,
                started_at=latest.end_at,
            )
            logger.info(f"[ColorGame] Created new Round #{next_rnd.round_number}")

        # If we hit the limit, just return whatever latest round we have
        logger.warning(f"[ColorGame] ensure_current_round hit max_iterations={max_iterations}, returning latest")
        return self._latest_round_for_update() or self._ensure_first_round(_utcnow())

    @staticmethod
    def seconds_remaining(rnd: ColorRound) -> int:
        now = _utcnow()
        if rnd.status == "open":
            return max(0, int((rnd.lock_at - now).total_seconds()))
        if rnd.status == "closed":
            return max(0, int((rnd.end_at - now).total_seconds()))
        return 0

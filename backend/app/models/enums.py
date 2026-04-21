from __future__ import annotations

import enum


class KycStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class MatchStatus(str, enum.Enum):
    scheduled = "scheduled"
    open = "open"
    live = "live"
    completed = "completed"
    cancelled = "cancelled"


class BetType(str, enum.Enum):
    toss = "toss"
    match_winner = "match_winner"


class BetStatus(str, enum.Enum):
    placed = "placed"
    won = "won"
    lost = "lost"
    cancelled = "cancelled"


class TransactionType(str, enum.Enum):
    deposit = "deposit"
    bet_debit = "bet_debit"
    bet_payout = "bet_payout"
    withdrawal_hold = "withdrawal_hold"
    withdrawal_paid = "withdrawal_paid"
    withdrawal_released = "withdrawal_released"
    adjustment = "adjustment"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    reversed = "reversed"


class WithdrawalStatus(str, enum.Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    processed = "processed"
    cancelled = "cancelled"


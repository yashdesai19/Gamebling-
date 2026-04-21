from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


DEFAULT_ODDS = Decimal("1.9800")


def calc_potential_payout(bet_amount: Decimal, odds: Decimal = DEFAULT_ODDS) -> Decimal:
    payout = (bet_amount * odds).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return payout


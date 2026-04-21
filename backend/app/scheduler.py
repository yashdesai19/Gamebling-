import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.db.session import SessionLocal
from app.services.live_match_sync import LiveIPLSyncService
from app.services.color_game import ColorGameService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def sync_live_matches():
    """Background task to sync live IPL matches from CricAPI."""
    try:
        with SessionLocal() as db:
            svc = LiveIPLSyncService(db)
            res = svc.sync_ipl()
            logger.info(f"Live match sync completed: {res}")
    except Exception as e:
        logger.error(f"Error syncing live matches: {e}")


def advance_color_game():
    """Background task to advance Color Game rounds (close, result, create next)."""
    try:
        with SessionLocal() as db:
            svc = ColorGameService(db)
            rnd = svc.ensure_current_round()
            logger.debug(f"[ColorGame] Round #{rnd.round_number} status={rnd.status}")
    except Exception as e:
        logger.error(f"[ColorGame] Error advancing round: {e}")


def start_scheduler():
    # Schedule CricAPI sync every 30 minutes to stay within limits
    scheduler.add_job(
        sync_live_matches,
        trigger=IntervalTrigger(minutes=30),
        id="sync_live_matches_job",
        replace_existing=True,
    )

    # Schedule Color Game advancement every 1 second
    scheduler.add_job(
        advance_color_game,
        trigger=IntervalTrigger(seconds=1),
        id="advance_color_game_job",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Background scheduler stopped.")

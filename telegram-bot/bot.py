"""UstaTop Telegram Bot — main entry point."""

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from config import settings
from handlers import common, customer, master

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


async def on_startup(bot: Bot) -> None:
    me = await bot.get_me()
    logger.info(f"✅ Bot started: @{me.username} (id={me.id})")


async def on_shutdown(bot: Bot) -> None:
    logger.info("🛑 Bot shutting down...")
    await bot.session.close()


async def main() -> None:
    bot = Bot(token=settings.BOT_TOKEN, default=__import__('aiogram.client.default', fromlist=['DefaultBotProperties']).DefaultBotProperties(parse_mode=ParseMode.HTML))

    dp = Dispatcher(storage=MemoryStorage())

    # Register routers (order matters for priority)
    dp.include_router(common.router)
    dp.include_router(customer.router)
    dp.include_router(master.router)

    # Lifecycle hooks
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)

    logger.info("🚀 Starting polling...")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())

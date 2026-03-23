"""Send Telegram notifications to matched masters."""

import logging
from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramBadRequest

from models import Master, ServiceRequest

logger = logging.getLogger(__name__)

URGENCY_LABELS = {
    "LOW": "🟢 Oddiy",
    "MEDIUM": "🟡 O'rta",
    "HIGH": "🟠 Muhim",
    "URGENT": "🔴 Juda shoshilinch",
}


def format_request_message(request: ServiceRequest, category_name: str) -> str:
    urgency = URGENCY_LABELS.get(request.urgency, request.urgency)
    return (
        f"🔔 <b>Yangi so'rov!</b>\n\n"
        f"📂 <b>Kategoriya:</b> {category_name}\n"
        f"📌 <b>Sarlavha:</b> {request.title}\n"
        f"📝 <b>Tavsif:</b> {request.description}\n"
        f"⚡ <b>Shoshilinchlik:</b> {urgency}\n"
        f"📍 <b>Manzil:</b> {request.address or 'Kiritilmagan'}, {request.city}\n"
        f"📞 <b>Mijoz telefoni:</b> {request.customer_phone}\n"
        f"👤 <b>Mijoz ismi:</b> {request.customer_name}\n"
    )


async def notify_masters(
    bot: Bot,
    masters: list[Master],
    request: ServiceRequest,
    category_name: str,
) -> int:
    """
    Send notification to all matching masters who have a telegram_id.
    Returns the count of successfully sent notifications.
    """
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    sent = 0
    message = format_request_message(request, category_name)

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Qabul qilish", callback_data=f"accept_{request.id}"),
            InlineKeyboardButton(text="❌ Rad etish", callback_data=f"reject_{request.id}"),
        ]
    ])

    for master in masters:
        if not master.telegram_id:
            continue
        try:
            await bot.send_message(
                chat_id=master.telegram_id,
                text=message,
                parse_mode="HTML",
                reply_markup=keyboard,
            )
            sent += 1
        except TelegramForbiddenError:
            logger.warning(f"Master {master.id} blocked the bot")
        except TelegramBadRequest as e:
            logger.warning(f"Failed to notify master {master.id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error notifying master {master.id}: {e}")

    logger.info(f"Sent notifications to {sent}/{len(masters)} masters")
    return sent

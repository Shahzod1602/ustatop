"""Common handlers: /start, /help, menu."""

import logging
from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext

from keyboards import main_menu_keyboard
from config import settings

logger = logging.getLogger(__name__)
router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    user_name = message.from_user.first_name if message.from_user else "Foydalanuvchi"

    await message.answer(
        f"👋 Salom, <b>{user_name}</b>!\n\n"
        f"🔧 <b>UstaTop</b> — ishonchli usta topishning eng qulay yo'li.\n\n"
        f"<b>Nima qilish mumkin:</b>\n"
        f"🔧 So'rov yuborish — muammoingizni yozing\n"
        f"📋 So'rovlarim — avvalgi so'rovlarni ko'rish\n"
        f"ℹ️ Yordam — qo'llanma\n\n"
        f"Agar usta bo'lsangiz, /link_account buyrug'i orqali akkauntingizni ulang.",
        parse_mode="HTML",
        reply_markup=main_menu_keyboard(),
    )
    await message.answer(
        "📱 Mini App ichida buyurtma berish uchun tugmani bosing:",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="UstaTop Mini App", web_app=WebAppInfo(url=settings.WEBAPP_URL))]
            ]
        ),
    )


@router.message(Command("help"))
@router.message(F.text == "ℹ️ Yordam")
async def cmd_help(message: Message) -> None:
    await message.answer(
        "📖 <b>Yordam</b>\n\n"
        "<b>Mijozlar uchun:</b>\n"
        "1. «🔧 So'rov yuborish» tugmasini bosing\n"
        "2. Xizmat turini tanlang\n"
        "3. Muammoni tasvirlab bering\n"
        "4. Manzilingizni yuboring\n"
        "5. Telefon raqamingizni yuboring\n"
        "6. So'rovni tasdiqlang — usta topiladi!\n\n"
        "<b>Ustalar uchun:</b>\n"
        "• /link_account — Telegram akkauntingizni ulashtiring\n"
        "• Yangi so'rovlar kelganda xabar olasiz\n"
        "• So'rovni qabul qiling yoki rad eting\n\n"
        "📞 Qo'llab-quvvatlash: @ustatop_support",
        parse_mode="HTML",
    )


@router.message(Command("link_account"))
async def link_account_cmd(message: Message) -> None:
    await message.answer(
        "🔗 <b>Akkauntni ulash</b>\n\n"
        "«🔗 Akkauntni ulash» tugmasini bosing va emailingizni kiriting:",
        parse_mode="HTML",
        reply_markup=__import__('aiogram.types', fromlist=['ReplyKeyboardMarkup']).ReplyKeyboardMarkup(
            keyboard=[[__import__('aiogram.types', fromlist=['KeyboardButton']).KeyboardButton(text="🔗 Akkauntni ulash")]],
            resize_keyboard=True,
        ),
    )


@router.message(F.text == "📋 So'rovlarim")
async def my_requests(message: Message) -> None:
    await message.answer(
        "📋 <b>Sizning so'rovlaringiz</b>\n\nMini App orqali ko'ring:",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="Mening so'rovlarim", web_app=WebAppInfo(url=f"{settings.WEBAPP_URL}/my-requests"))]
            ]
        ),
    )

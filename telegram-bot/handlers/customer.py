"""Customer flow: submit a service request via bot."""

import logging
import uuid
from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, Contact, Location
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from keyboards import (
    categories_keyboard, share_phone_keyboard, share_location_keyboard,
    urgency_keyboard, cancel_keyboard, main_menu_keyboard, remove_keyboard,
)
from models import Category, ServiceRequest, AsyncSessionLocal, UrgencyEnum, RequestStatusEnum
from services import match_request, notify_masters

logger = logging.getLogger(__name__)
router = Router()

URGENCY_MAP = {
    "🟢 Oddiy": UrgencyEnum.LOW,
    "🟡 O'rta": UrgencyEnum.MEDIUM,
    "🟠 Muhim": UrgencyEnum.HIGH,
    "🔴 Juda shoshilinch": UrgencyEnum.URGENT,
}


# ── FSM States ────────────────────────────────────────────────────────────────

class RequestFlow(StatesGroup):
    selecting_category = State()
    entering_title = State()
    entering_description = State()
    selecting_urgency = State()
    sharing_location = State()
    entering_address = State()
    sharing_phone = State()
    confirming = State()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(select(Category).order_by(Category.name))
    return result.scalars().all()


# ── Handlers ──────────────────────────────────────────────────────────────────

@router.message(F.text == "🔧 So'rov yuborish")
async def start_request(message: Message, state: FSMContext) -> None:
    async with AsyncSessionLocal() as session:
        cats = await get_categories(session)

    if not cats:
        await message.answer("⚠️ Hozircha kategoriyalar yo'q. Keyinroq urinib ko'ring.")
        return

    await state.set_state(RequestFlow.selecting_category)
    await message.answer(
        "📂 <b>Xizmat turini tanlang:</b>\n\nQuyidagi kategoriyalardan birini bosing:",
        reply_markup=categories_keyboard(cats),
        parse_mode="HTML",
    )


@router.callback_query(F.data.startswith("cat_"), RequestFlow.selecting_category)
async def category_selected(callback: CallbackQuery, state: FSMContext) -> None:
    category_id = callback.data.removeprefix("cat_")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).filter(Category.id == category_id))
        cat = result.scalar_one_or_none()

    if not cat:
        await callback.answer("Kategoriya topilmadi", show_alert=True)
        return

    await state.update_data(category_id=category_id, category_name=f"{cat.icon} {cat.name_uz}")
    await state.set_state(RequestFlow.entering_title)
    await callback.message.edit_text(
        f"✅ Tanlangan: <b>{cat.icon} {cat.name_uz}</b>\n\n"
        f"✏️ <b>Muammo sarlavhasini kiriting:</b>\n"
        f"(Qisqa va aniq yozing, masalan: «Kran oqmoqda»)",
        parse_mode="HTML",
    )
    await callback.message.answer("Yoki bekor qilish:", reply_markup=cancel_keyboard())
    await callback.answer()


@router.message(F.text == "❌ Bekor qilish")
async def cancel_flow(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("❌ Bekor qilindi.", reply_markup=main_menu_keyboard())


@router.message(RequestFlow.entering_title)
async def title_entered(message: Message, state: FSMContext) -> None:
    if not message.text or len(message.text.strip()) < 5:
        await message.answer("⚠️ Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak.")
        return

    await state.update_data(title=message.text.strip())
    await state.set_state(RequestFlow.entering_description)
    await message.answer(
        "📝 <b>Muammoni batafsil tasvirlab bering:</b>\n\n"
        "• Muammo qachondan beri bor?\n"
        "• Qanday belgilar ko'rinmoqda?\n"
        "• Boshqa muhim ma'lumotlar",
        parse_mode="HTML",
        reply_markup=cancel_keyboard(),
    )


@router.message(RequestFlow.entering_description)
async def description_entered(message: Message, state: FSMContext) -> None:
    if not message.text or len(message.text.strip()) < 20:
        await message.answer("⚠️ Tavsif kamida 20 ta belgidan iborat bo'lishi kerak.")
        return

    await state.update_data(description=message.text.strip())
    await state.set_state(RequestFlow.selecting_urgency)
    await message.answer(
        "⚡ <b>Shoshilinchlik darajasini tanlang:</b>",
        parse_mode="HTML",
        reply_markup=urgency_keyboard(),
    )


@router.message(RequestFlow.selecting_urgency)
async def urgency_selected(message: Message, state: FSMContext) -> None:
    urgency = URGENCY_MAP.get(message.text)
    if not urgency:
        await message.answer("⚠️ Iltimos, quyidagi tugmalardan birini bosing.")
        return

    await state.update_data(urgency=urgency)
    await state.set_state(RequestFlow.sharing_location)
    await message.answer(
        "📍 <b>Manzilingizni yuboring:</b>",
        parse_mode="HTML",
        reply_markup=share_location_keyboard(),
    )


@router.message(F.location, RequestFlow.sharing_location)
async def location_shared(message: Message, state: FSMContext) -> None:
    loc: Location = message.location
    await state.update_data(
        latitude=loc.latitude,
        longitude=loc.longitude,
        address=f"{loc.latitude:.4f}, {loc.longitude:.4f}",
        city="Toshkent",  # Default; could reverse-geocode in production
    )
    await _ask_for_phone(message, state)


@router.message(F.text == "✍️ Manzilni yozib kiritish", RequestFlow.sharing_location)
async def enter_address_manually(message: Message, state: FSMContext) -> None:
    await state.set_state(RequestFlow.entering_address)
    await message.answer(
        "🏠 <b>To'liq manzilni kiriting:</b>\n"
        "(Ko'cha, uy raqami, tuman, shahar)",
        parse_mode="HTML",
        reply_markup=cancel_keyboard(),
    )


@router.message(RequestFlow.entering_address)
async def address_entered(message: Message, state: FSMContext) -> None:
    if not message.text or len(message.text.strip()) < 5:
        await message.answer("⚠️ Iltimos, to'liq manzilni kiriting.")
        return

    # Simple city extraction: look for known city names
    text = message.text.strip()
    cities = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]
    city = next((c for c in cities if c.lower() in text.lower()), "Toshkent")

    await state.update_data(address=text, city=city)
    await _ask_for_phone(message, state)


async def _ask_for_phone(message: Message, state: FSMContext) -> None:
    await state.set_state(RequestFlow.sharing_phone)
    await message.answer(
        "📞 <b>Telefon raqamingizni yuboring:</b>\n"
        "Usta siz bilan bog'lanishi uchun kerak.",
        parse_mode="HTML",
        reply_markup=share_phone_keyboard(),
    )


@router.message(F.contact, RequestFlow.sharing_phone)
async def phone_shared(message: Message, state: FSMContext) -> None:
    contact: Contact = message.contact
    await state.update_data(
        customer_phone=contact.phone_number,
        customer_name=contact.first_name + (f" {contact.last_name}" if contact.last_name else ""),
    )
    await show_confirmation(message, state)


@router.message(RequestFlow.sharing_phone)
async def phone_entered_manually(message: Message, state: FSMContext) -> None:
    if not message.text:
        return
    phone = message.text.strip()
    if not (phone.startswith("+998") and len(phone) == 13 and phone[1:].isdigit()):
        await message.answer("⚠️ Noto'g'ri format. Masalan: +998901234567")
        return

    await state.update_data(
        customer_phone=phone,
        customer_name=message.from_user.first_name if message.from_user else "Noma'lum",
    )
    await show_confirmation(message, state)


async def show_confirmation(message: Message, state: FSMContext) -> None:
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    data = await state.get_data()
    urgency_label = {
        UrgencyEnum.LOW: "🟢 Oddiy",
        UrgencyEnum.MEDIUM: "🟡 O'rta",
        UrgencyEnum.HIGH: "🟠 Muhim",
        UrgencyEnum.URGENT: "🔴 Juda shoshilinch",
    }.get(data.get("urgency"), "O'rta")

    text = (
        f"📋 <b>So'rovni tasdiqlang:</b>\n\n"
        f"📂 <b>Kategoriya:</b> {data.get('category_name')}\n"
        f"📌 <b>Sarlavha:</b> {data.get('title')}\n"
        f"📝 <b>Tavsif:</b> {data.get('description')}\n"
        f"⚡ <b>Shoshilinchlik:</b> {urgency_label}\n"
        f"📍 <b>Manzil:</b> {data.get('address')}\n"
        f"📞 <b>Telefon:</b> {data.get('customer_phone')}\n"
    )

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Yuborish", callback_data="confirm_request"),
            InlineKeyboardButton(text="❌ Bekor qilish", callback_data="cancel_request"),
        ]
    ])

    await state.set_state(RequestFlow.confirming)
    await message.answer(text, parse_mode="HTML", reply_markup=keyboard)


@router.callback_query(F.data == "confirm_request", RequestFlow.confirming)
async def confirm_request(callback: CallbackQuery, state: FSMContext, bot: Bot) -> None:
    data = await state.get_data()
    await state.clear()

    async with AsyncSessionLocal() as session:
        request_id = str(uuid.uuid4())[:20].replace("-", "")

        request = ServiceRequest(
            id=request_id,
            customer_name=data.get("customer_name", "Noma'lum"),
            customer_phone=data.get("customer_phone"),
            customer_telegram_id=str(callback.from_user.id),
            title=data["title"],
            description=data["description"],
            category_id=data["category_id"],
            urgency=data.get("urgency", UrgencyEnum.MEDIUM),
            status=RequestStatusEnum.PENDING,
            address=data.get("address"),
            city=data.get("city", "Toshkent"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
        )
        session.add(request)
        await session.commit()
        await session.refresh(request)

        # Run matching
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select as sa_select
        from models import Category as Cat

        cat_result = await session.execute(sa_select(Cat).filter(Cat.id == data["category_id"]))
        category = cat_result.scalar_one_or_none()
        category_name = f"{category.icon} {category.name_uz}" if category else "Noma'lum"

        masters = await match_request(session, request_id)
        await notify_masters(bot, masters, request, category_name)

    await callback.message.edit_text(
        f"✅ <b>So'rovingiz qabul qilindi!</b>\n\n"
        f"🔍 {len(masters)} ta usta topildi.\n"
        f"Ular tez orada siz bilan bog'lanadi.\n\n"
        f"📋 So'rov ID: <code>{request_id}</code>",
        parse_mode="HTML",
    )
    await callback.message.answer("Asosiy menyu:", reply_markup=main_menu_keyboard())
    await callback.answer()


@router.callback_query(F.data == "cancel_request")
async def cancel_request(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.edit_text("❌ So'rov bekor qilindi.")
    await callback.message.answer("Asosiy menyu:", reply_markup=main_menu_keyboard())
    await callback.answer()

"""Master callbacks: accept/reject requests, link Telegram account."""

import logging
import uuid
from aiogram import Router, F, Bot
from aiogram.types import CallbackQuery, Message, Contact
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from keyboards import share_phone_keyboard
from models import (
    Master,
    CustomerProfile,
    MasterCategory,
    Category,
    ServiceRequest,
    AsyncSessionLocal,
    RequestStatusEnum,
)

logger = logging.getLogger(__name__)
router = Router()


class MasterLinkFlow(StatesGroup):
    waiting_for_contact = State()


def _normalize_phone(phone: str) -> str:
    normalized = phone.strip()
    if not normalized.startswith("+"):
        normalized = f"+{normalized}"
    return normalized


# ── Link Telegram account to master profile ────────────────────────────────

@router.message(F.text == "🔗 Akkauntni ulash")
async def start_link(message: Message, state: FSMContext) -> None:
    await state.set_state(MasterLinkFlow.waiting_for_contact)
    await message.answer(
        "📞 <b>Telefon raqamingizni ulashing:</b>\n"
        "Agar bu raqam bilan akkaunt mavjud bo'lsa ulanadi,\n"
        "bo'lmasa yangi akkaunt ochiladi.",
        parse_mode="HTML",
        reply_markup=share_phone_keyboard(),
    )


@router.message(F.contact, MasterLinkFlow.waiting_for_contact)
async def link_or_create_by_contact(message: Message, state: FSMContext) -> None:
    contact: Contact = message.contact
    if not message.from_user:
        await message.answer("⚠️ Foydalanuvchi aniqlanmadi, qayta urinib ko'ring.")
        return

    # Accept only self-shared contacts to prevent linking another person's number.
    if contact.user_id and contact.user_id != message.from_user.id:
        await message.answer("⚠️ Iltimos, faqat o'zingizning raqamingizni ulashing.")
        return

    phone = _normalize_phone(contact.phone_number)
    full_name = " ".join(filter(None, [contact.first_name, contact.last_name])).strip()
    if not full_name:
        full_name = message.from_user.full_name or "Usta"

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Master).filter(Master.phone == phone))
        master = result.scalar_one_or_none()

        tg_id = str(message.from_user.id)
        if master and master.telegram_id and master.telegram_id != tg_id:
            await message.answer("⚠️ Bu telefon raqam allaqachon boshqa Telegram akkauntiga ulangan.")
            await state.clear()
            return

        if master:
            await session.execute(
                update(Master)
                .where(Master.id == master.id)
                .values(telegram_id=tg_id)
            )
        else:
            safe_phone = phone.replace("+", "")
            email = f"tg-{safe_phone}@tg.ustatop.local"
            password = f"tg-{uuid.uuid4().hex}"
            master = Master(
                id=uuid.uuid4().hex[:20],
                email=email,
                password=password,
                full_name=full_name,
                phone=phone,
                telegram_id=tg_id,
                is_active=True,
                is_verified=False,
                service_area="Toshkent",
            )
            session.add(master)
            default_category = (await session.execute(select(Category.id).order_by(Category.created_at.asc()))).scalar_one_or_none()
            if default_category:
                session.add(
                    MasterCategory(
                        id=uuid.uuid4().hex[:20],
                        master_id=master.id,
                        category_id=default_category,
                    )
                )

        profile_stmt = pg_insert(CustomerProfile).values(
            id=uuid.uuid4().hex[:20],
            telegram_id=tg_id,
            full_name=full_name,
            phone=phone,
            city="Toshkent",
            is_master=True,
        )
        profile_stmt = profile_stmt.on_conflict_do_update(
            index_elements=[CustomerProfile.telegram_id],
            set_={
                "full_name": full_name,
                "phone": phone,
                "is_master": True,
            },
        )
        await session.execute(profile_stmt)

        await session.commit()

    await state.clear()
    await message.answer(
        f"✅ <b>Muvaffaqiyatli ulandi!</b>\n\n"
        f"Salom, <b>{master.full_name}</b>!\n"
        f"Endi yangi so'rovlar haqida xabarnoma olasiz.",
        parse_mode="HTML",
    )


@router.message(MasterLinkFlow.waiting_for_contact)
async def link_contact_fallback(message: Message) -> None:
    await message.answer("⚠️ Iltimos, tugma orqali telefon raqamingizni ulashing.")


# ── Accept request ─────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("accept_"))
async def accept_request(callback: CallbackQuery, bot: Bot) -> None:
    request_id = callback.data.removeprefix("accept_")
    master_tg_id = str(callback.from_user.id)

    async with AsyncSessionLocal() as session:
        # Verify master
        master_result = await session.execute(
            select(Master).filter(Master.telegram_id == master_tg_id)
        )
        master = master_result.scalar_one_or_none()

        if not master:
            await callback.answer("❌ Akkauntingiz topilmadi. /start bosing.", show_alert=True)
            return

        # Get request
        req_result = await session.execute(
            select(ServiceRequest).filter(ServiceRequest.id == request_id)
        )
        request = req_result.scalar_one_or_none()

        if not request:
            await callback.answer("❌ So'rov topilmadi.", show_alert=True)
            return

        if request.status not in (RequestStatusEnum.PENDING, RequestStatusEnum.MATCHED):
            await callback.answer("ℹ️ Bu so'rov allaqachon qabul qilingan.", show_alert=True)
            return

        request.status = RequestStatusEnum.ACCEPTED
        request.master_id = master.id
        await session.commit()

        # Notify customer if they came from Telegram
        if request.customer_telegram_id:
            try:
                await bot.send_message(
                    chat_id=request.customer_telegram_id,
                    text=(
                        f"🎉 <b>Usta topildi!</b>\n\n"
                        f"<b>{master.full_name}</b> sizning so'rovingizni qabul qildi.\n"
                        f"📞 Usta telefoni: <code>{master.phone}</code>\n\n"
                        f"Usta tez orada siz bilan bog'lanadi."
                    ),
                    parse_mode="HTML",
                )
            except Exception:
                pass

    await callback.message.edit_text(
        f"✅ <b>So'rov qabul qilindi!</b>\n\n"
        f"📞 Mijoz telefoni: <code>{request.customer_phone}</code>\n"
        f"👤 Mijoz: {request.customer_name}\n"
        f"📍 Manzil: {request.address}, {request.city}\n\n"
        f"Mijoz bilan bog'laning va ishga kiring!",
        parse_mode="HTML",
    )
    await callback.answer("✅ So'rov qabul qilindi!")


# ── Reject request ─────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("reject_"))
async def reject_request(callback: CallbackQuery) -> None:
    request_id = callback.data.removeprefix("reject_")

    await callback.message.edit_text(
        f"❌ So'rov rad etildi.\n\n"
        f"So'rov ID: <code>{request_id}</code>",
        parse_mode="HTML",
    )
    await callback.answer("❌ Rad etildi")


# ── Complete request ────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("complete_"))
async def complete_request(callback: CallbackQuery, bot: Bot) -> None:
    request_id = callback.data.removeprefix("complete_")
    master_tg_id = str(callback.from_user.id)

    async with AsyncSessionLocal() as session:
        master_result = await session.execute(
            select(Master).filter(Master.telegram_id == master_tg_id)
        )
        master = master_result.scalar_one_or_none()
        if not master:
            await callback.answer("Akkount topilmadi", show_alert=True)
            return

        req_result = await session.execute(
            select(ServiceRequest).filter(ServiceRequest.id == request_id)
        )
        request = req_result.scalar_one_or_none()

        if not request:
            await callback.answer("So'rov topilmadi", show_alert=True)
            return

        if request.master_id and request.master_id != master.id:
            await callback.answer("Bu so'rov sizga biriktirilmagan", show_alert=True)
            return

        request.status = RequestStatusEnum.COMPLETED
        await session.commit()

        # Ask customer for review
        if request.customer_telegram_id:
            from keyboards import rating_keyboard
            try:
                await bot.send_message(
                    chat_id=request.customer_telegram_id,
                    text=(
                        "⭐ <b>Usta ishini qanday baholaysiz?</b>\n\n"
                        "Pastdagi yulduzlarni bosing:"
                    ),
                    parse_mode="HTML",
                    reply_markup=rating_keyboard(request_id),
                )
            except Exception:
                pass

    await callback.message.edit_text("✅ Ish yakunlandi! Mijozdan reyting so'raldi.")
    await callback.answer("✅ Yakunlandi!")

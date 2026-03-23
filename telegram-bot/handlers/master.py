"""Master callbacks: accept/reject requests, link Telegram account."""

import logging
from aiogram import Router, F, Bot
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models import Master, ServiceRequest, AsyncSessionLocal, RequestStatusEnum

logger = logging.getLogger(__name__)
router = Router()


class MasterLinkFlow(StatesGroup):
    waiting_for_email = State()


# ── Link Telegram account to master profile ────────────────────────────────

@router.message(F.text == "🔗 Akkauntni ulash")
async def start_link(message: Message, state: FSMContext) -> None:
    await state.set_state(MasterLinkFlow.waiting_for_email)
    await message.answer(
        "📧 <b>Email manzilingizni kiriting:</b>\n"
        "(UstaTop saytida ro'yxatdan o'tgan email)",
        parse_mode="HTML",
    )


@router.message(MasterLinkFlow.waiting_for_email)
async def link_email(message: Message, state: FSMContext) -> None:
    email = message.text.strip().lower() if message.text else ""
    if "@" not in email:
        await message.answer("⚠️ Noto'g'ri email format.")
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Master).filter(Master.email == email))
        master = result.scalar_one_or_none()

        if not master:
            await message.answer("❌ Bu email bilan hisob topilmadi.\nAvval saytda ro'yxatdan o'ting.")
            await state.clear()
            return

        if master.telegram_id and master.telegram_id != str(message.from_user.id):
            await message.answer("⚠️ Bu hisob allaqachon boshqa Telegram akkauntiga ulangan.")
            await state.clear()
            return

        await session.execute(
            update(Master)
            .where(Master.id == master.id)
            .values(telegram_id=str(message.from_user.id))
        )
        await session.commit()

    await state.clear()
    await message.answer(
        f"✅ <b>Muvaffaqiyatli ulandi!</b>\n\n"
        f"Salom, <b>{master.full_name}</b>!\n"
        f"Endi yangi so'rovlar haqida xabarnoma olasiz.",
        parse_mode="HTML",
    )


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

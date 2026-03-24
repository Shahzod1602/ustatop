"""Reusable reply keyboards."""

from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from config import settings

def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Mini App ochish", web_app=WebAppInfo(url=settings.WEBAPP_URL))],
            [KeyboardButton(text="🔧 So'rov yuborish")],
            [KeyboardButton(text="📋 So'rovlarim"), KeyboardButton(text="ℹ️ Yordam")],
        ],
        resize_keyboard=True,
        input_field_placeholder="Menyu...",
    )

def share_phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📱 Telefon raqamimni ulashish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

def share_location_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📍 Joylashuvimni ulashish", request_location=True)],
            [KeyboardButton(text="✍️ Manzilni yozib kiritish")],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

def cancel_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="❌ Bekor qilish")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

def urgency_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🟢 Oddiy"), KeyboardButton(text="🟡 O'rta")],
            [KeyboardButton(text="🟠 Muhim"), KeyboardButton(text="🔴 Juda shoshilinch")],
            [KeyboardButton(text="❌ Bekor qilish")],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

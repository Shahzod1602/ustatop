"""Reusable inline keyboards."""

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def categories_keyboard(categories: list) -> InlineKeyboardMarkup:
    """Build inline keyboard from category list."""
    buttons = []
    # 2 columns
    row = []
    for cat in categories:
        btn = InlineKeyboardButton(
            text=f"{cat.icon} {cat.name_uz}",
            callback_data=f"cat_{cat.id}",
        )
        row.append(btn)
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def request_action_keyboard(request_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Qabul qilish", callback_data=f"accept_{request_id}"),
            InlineKeyboardButton(text="❌ Rad etish", callback_data=f"reject_{request_id}"),
        ]
    ])


def rating_keyboard(request_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=f"{'⭐' * i}", callback_data=f"rate_{request_id}_{i}")
            for i in range(1, 6)
        ]
    ])

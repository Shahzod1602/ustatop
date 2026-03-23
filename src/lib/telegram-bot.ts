interface TelegramReplyMarkup {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: TelegramReplyMarkup) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken || !chatId) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

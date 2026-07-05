import { Bot, InlineKeyboard } from "grammy"
import { MINIAPP_URL } from "./config"

/**
 * Mijoz (user) bot — entry only. Opens the Mini App feed; the customer account
 * is auto-created from Telegram initData when the Mini App loads. Nothing is asked.
 */
export function createMijozBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "🛠 <b>UstaTanla</b> — kerakli ustani toping!\n\n" +
        "Ustalar ishlarini ko'ring, yoqqanini tanlab to'g'ridan-to'g'ri yozing 👇",
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().webApp("🔍 Ustalarni ko'rish", MINIAPP_URL) }
    )
  })

  return bot
}

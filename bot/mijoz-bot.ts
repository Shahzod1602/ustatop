import { Bot, InlineKeyboard } from "grammy"
import { USER_APP_URL } from "./config"

/**
 * Mijoz (user) bot — entry only. Opens the original UstaTop web catalog (warm
 * design) where customers browse masters and contact them.
 */
export function createMijozBot(token: string): Bot {
  const bot = new Bot(token)

  bot.catch((err) => console.error("[mijoz-bot] handler error:", err.error))

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "🛠 <b>UstaTanla</b> — kerakli ustani toping!\n\n" +
        "Ustalar katalogini ko'ring, yoqqaniga bog'laning 👇",
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().webApp("🔍 Ustalarni ko'rish", USER_APP_URL) }
    )
  })

  return bot
}

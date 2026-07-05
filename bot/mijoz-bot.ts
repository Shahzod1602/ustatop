import { Bot, InlineKeyboard, Keyboard } from "grammy"
import { prisma } from "./prisma"
import { MINIAPP_URL } from "./config"

/**
 * Mijoz (user) bot — entry only, per the Instagram-style model.
 * Contact-share → auto account → open the feed Mini App. Nothing else is asked.
 * Discovery, master profiles and "message the master" all happen in the Mini App.
 */
const feedKb = () => new InlineKeyboard().webApp("🔍 Ustalarni ko'rish", MINIAPP_URL)

export function createMijozBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command("start", async (ctx) => {
    const tgId = String(ctx.from!.id)
    const existing = await prisma.webCustomer.findUnique({
      where: { telegramId: tgId },
      select: { id: true },
    })
    if (existing) {
      await ctx.reply(
        "🛠 <b>UstaTanla</b>\n\nUstalar ishlarini ko'ring, yoqqanini tanlab to'g'ridan-to'g'ri yozing 👇",
        { parse_mode: "HTML", reply_markup: feedKb() }
      )
      return
    }
    await ctx.reply(
      "🛠 <b>UstaTanla</b> — kerakli ustani toping!\n\n" +
        "Boshlash uchun raqamingizni ulashing (bir marta) 👇",
      {
        parse_mode: "HTML",
        reply_markup: new Keyboard().requestContact("📱 Boshlash").resized().oneTime(),
      }
    )
  })

  // Contact-share → auto-create account, then open the app. Nothing else is asked.
  bot.on("message:contact", async (ctx) => {
    const tgId = String(ctx.from!.id)
    const contact = ctx.message.contact
    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Mijoz"
    const phone = contact.phone_number.startsWith("+") ? contact.phone_number : `+${contact.phone_number}`
    try {
      const existing = await prisma.webCustomer.findUnique({ where: { telegramId: tgId }, select: { id: true } })
      if (!existing) {
        await prisma.webCustomer.create({ data: { telegramId: tgId, fullName, phone } })
      }
    } catch (err) {
      console.error("[mijoz account]", err)
    }
    await ctx.reply("✅ Tayyor! Ustalar ishlarini ko'ring:", {
      reply_markup: { remove_keyboard: true },
    })
    await ctx.reply("👇", { reply_markup: feedKb() })
  })

  return bot
}

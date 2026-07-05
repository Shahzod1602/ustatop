import { Bot, InlineKeyboard, Keyboard } from "grammy"
import { prisma } from "./prisma"
import { ustaState } from "./state"
import { MINIAPP_URL, CITIES, PRICE_RANGES, DEFAULT_CITY } from "./config"

/**
 * Single UstaTanla bot — serves BOTH sides:
 *  - Customers: "🔍 Usta qidirish" opens the Mini App feed (account auto-created via initData).
 *  - Masters:   "🔧 Usta bo'lish" runs onboarding, then they post work photos from the Mini App.
 */

const menuKb = () =>
  new InlineKeyboard()
    .webApp("🔍 Usta qidirish", MINIAPP_URL)
    .row()
    .text("🔧 Usta bo'lish", "become:master")

const kabinetKb = () => new InlineKeyboard().webApp("🗂 Kabinet (Mini App)", MINIAPP_URL)

async function categoryKeyboard(selected: string[]): Promise<InlineKeyboard> {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } })
  const kb = new InlineKeyboard()
  cats.forEach((c, i) => {
    const mark = selected.includes(c.id) ? "✅ " : ""
    kb.text(`${mark}${c.icon} ${c.nameUz}`, `cat:toggle:${c.id}`)
    if (i % 2 === 1) kb.row()
  })
  kb.row().text("➡️ Davom etish", "cat:done")
  return kb
}

export function createBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command("start", async (ctx) => {
    const tgId = String(ctx.from!.id)
    const master = await prisma.master.findUnique({
      where: { telegramId: tgId },
      select: { fullName: true, isVerified: true },
    })
    if (master) {
      await ctx.reply(
        `Assalomu alaykum, ${master.fullName}! 👋\n\n` +
          `${master.isVerified ? "✅ Tasdiqlangan usta" : "⏳ Tasdiqlash kutilmoqda"}\n\n` +
          `Ishlaringiz rasmlarini joylang — mijozlar sizni feed'da ko'radi.`,
        { reply_markup: kabinetKb() }
      )
      return
    }
    ustaState.clear(ctx.from!.id)
    await ctx.reply(
      "🛠 <b>UstaTanla</b>\n\n" +
        "Kerakli ustani toping — santexnik, elektrik, duradgor va boshqalar bir tugma narida.\n" +
        "Yoki o'zingiz usta bo'lib ro'yxatdan o'ting 👇",
      { parse_mode: "HTML", reply_markup: menuKb() }
    )
  })

  // ── Become a master → start onboarding ──
  bot.callbackQuery("become:master", async (ctx) => {
    const master = await prisma.master.findUnique({
      where: { telegramId: String(ctx.from.id) },
      select: { id: true },
    })
    await ctx.answerCallbackQuery()
    if (master) {
      await ctx.reply("Siz allaqachon usta sifatida ro'yxatdansiz. Kabinetga kiring:", { reply_markup: kabinetKb() })
      return
    }
    ustaState.set(ctx.from.id, { step: "phone", categoryIds: [] })
    await ctx.reply("🔧 Usta bo'lish uchun raqamingizni ulashing 👇", {
      reply_markup: new Keyboard().requestContact("📱 Raqamni ulashish").resized().oneTime(),
    })
  })

  // ── Step 1: contact (only during onboarding) ──
  bot.on("message:contact", async (ctx) => {
    const st = ustaState.get(ctx.from!.id)
    if (!st || st.step !== "phone") return
    const c = ctx.message.contact
    st.fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Usta"
    st.phone = c.phone_number.startsWith("+") ? c.phone_number : `+${c.phone_number}`
    st.step = "categories"
    ustaState.set(ctx.from!.id, st)
    await ctx.reply("✅ Raqam qabul qilindi.\n\nQaysi yo'nalishda ishlaysiz? (bir nechtasini tanlash mumkin)", {
      reply_markup: await categoryKeyboard([]),
    })
  })

  // ── Step 2: categories ──
  bot.callbackQuery(/^cat:toggle:(.+)$/, async (ctx) => {
    const st = ustaState.get(ctx.from.id)
    if (!st || st.step !== "categories") return ctx.answerCallbackQuery()
    const id = ctx.match![1]
    st.categoryIds = st.categoryIds.includes(id)
      ? st.categoryIds.filter((c) => c !== id)
      : [...st.categoryIds, id]
    ustaState.set(ctx.from.id, st)
    await ctx.editMessageReplyMarkup({ reply_markup: await categoryKeyboard(st.categoryIds) })
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery("cat:done", async (ctx) => {
    const st = ustaState.get(ctx.from.id)
    if (!st || st.step !== "categories") return ctx.answerCallbackQuery()
    if (st.categoryIds.length === 0) {
      return ctx.answerCallbackQuery({ text: "Kamida bitta yo'nalish tanlang", show_alert: true })
    }
    st.step = "location"
    ustaState.set(ctx.from.id, st)
    await ctx.answerCallbackQuery()
    await ctx.reply("📍 Xizmat ko'rsatadigan joyingizni yuboring (yaqin mijozlar sizni ko'radi):", {
      reply_markup: new Keyboard().requestLocation("📍 Lokatsiyani yuborish").resized().oneTime(),
    })
  })

  // ── Step 3: location ──
  bot.on("message:location", async (ctx) => {
    const st = ustaState.get(ctx.from!.id)
    if (!st || st.step !== "location") return
    st.latitude = ctx.message.location.latitude
    st.longitude = ctx.message.location.longitude
    st.step = "city"
    ustaState.set(ctx.from!.id, st)
    const kb = new InlineKeyboard()
    CITIES.forEach((c, i) => {
      kb.text(c, `city:${c}`)
      if (i % 2 === 1) kb.row()
    })
    await ctx.reply("🏙 Shahringizni tanlang:", { reply_markup: kb })
  })

  // ── Step 4: city ──
  bot.callbackQuery(/^city:(.+)$/, async (ctx) => {
    const st = ustaState.get(ctx.from.id)
    if (!st || st.step !== "city") return ctx.answerCallbackQuery()
    st.city = ctx.match![1]
    st.step = "price"
    ustaState.set(ctx.from.id, st)
    await ctx.answerCallbackQuery()
    const kb = new InlineKeyboard()
    PRICE_RANGES.forEach((p) => kb.text(p, `price:${p}`).row())
    await ctx.editMessageText(`🏙 ${st.city}\n\n💰 Narx oralig'ingiz:`, { reply_markup: kb })
  })

  // ── Step 5: price → create master ──
  bot.callbackQuery(/^price:(.+)$/, async (ctx) => {
    const st = ustaState.get(ctx.from.id)
    if (!st || st.step !== "price") return ctx.answerCallbackQuery()
    const price = ctx.match![1]
    const tgId = String(ctx.from.id)
    try {
      await prisma.master.create({
        data: {
          telegramId: tgId,
          telegramUsername: ctx.from.username ?? null,
          fullName: st.fullName!,
          phone: st.phone!,
          email: `tg-${tgId}@ustatanla.local`,
          serviceArea: st.city ?? DEFAULT_CITY,
          latitude: st.latitude,
          longitude: st.longitude,
          isActive: true,
          isVerified: false,
          bio: `Narxlar: ${price}`,
          categories: { create: st.categoryIds.map((categoryId) => ({ categoryId })) },
        },
      })
    } catch (err) {
      console.error("[master create]", err)
      await ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true })
      return
    }
    ustaState.clear(ctx.from.id)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "🎉 <b>Tabriklaymiz! Ro'yxatdan o'tdingiz.</b>\n\n" +
        "⏳ Administrator profilingizni tasdiqlaydi.\n" +
        "📸 Endi ishlaringiz rasmlarini joylang — mijozlar feed'da ko'radi.",
      { parse_mode: "HTML" }
    )
    await ctx.reply("Kabinetga kiring va birinchi postni joylang:", { reply_markup: kabinetKb() })
  })

  return bot
}

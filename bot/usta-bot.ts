import { Bot, InlineKeyboard, Keyboard } from "grammy"
import { prisma } from "./prisma"
import { ustaState } from "./state"
import { MINIAPP_URL, CITIES, PRICE_RANGES, DEFAULT_CITY } from "./config"
import { notifyCustomerOfAccept } from "./notify"

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

export function createUstaBot(token: string): Bot {
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
          `🔔 Sizga mos yangi ishlar shu yerga keladi.\n` +
          `Profil va statistikani Kabinetда ko'ring:`,
        { reply_markup: kabinetKb() }
      )
      return
    }
    ustaState.clear(ctx.from!.id)
    await ctx.reply(
      "🔧 <b>UstaTanla — Usta kabineti</b>\n\n" +
        "Mijozlar sizni topishi uchun ro'yxatdan o'ting. Bir necha qadam, ko'p yozish shart emas.\n\n" +
        "Boshlash uchun raqamingizni ulashing 👇",
      {
        parse_mode: "HTML",
        reply_markup: new Keyboard().requestContact("📱 Raqamni ulashish").resized().oneTime(),
      }
    )
  })

  // Step 1 — contact (phone + name)
  bot.on("message:contact", async (ctx) => {
    const existing = await prisma.master.findUnique({
      where: { telegramId: String(ctx.from!.id) },
      select: { id: true },
    })
    if (existing) return // already registered
    const contact = ctx.message.contact
    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Usta"
    const phone = contact.phone_number.startsWith("+") ? contact.phone_number : `+${contact.phone_number}`
    ustaState.set(ctx.from!.id, { step: "categories", fullName, phone, categoryIds: [] })
    await ctx.reply("✅ Raqam qabul qilindi.\n\nQaysi yo'nalishda ishlaysiz? (bir nechtasini tanlash mumkin)", {
      reply_markup: await categoryKeyboard([]),
    })
  })

  // Step 2 — category multi-select
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

  // Step 3 — location
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

  // Step 4 — city
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

  // Step 5 — price → create master
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
      console.error("[usta create]", err)
      await ctx.answerCallbackQuery({ text: "Xatolik yuz berdi", show_alert: true })
      return
    }
    ustaState.clear(ctx.from.id)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "🎉 <b>Tabriklaymiz! Ro'yxatdan o'tdingiz.</b>\n\n" +
        "⏳ Administrator profilingizni tasdiqlagach, \"✅ Tasdiqlangan\" belgisi paydo bo'ladi.\n" +
        "🔔 Sizga mos yangi ishlar shu yerga keladi.",
      { parse_mode: "HTML" }
    )
    await ctx.reply("Profilingizni to'ldirish uchun Kabinetга kiring:", { reply_markup: kabinetKb() })
  })

  // Accept / skip a pushed job
  bot.callbackQuery(/^job:accept:(.+)$/, async (ctx) => {
    const requestId = ctx.match![1]
    const master = await prisma.master.findUnique({
      where: { telegramId: String(ctx.from.id) },
      select: { id: true, fullName: true, phone: true, rating: true, isActive: true },
    })
    if (!master || !master.isActive) {
      return ctx.answerCallbackQuery({ text: "Akkaunt topilmadi yoki faol emas", show_alert: true })
    }
    // Atomic claim — only if still open / unclaimed.
    const lock = await prisma.serviceRequest.updateMany({
      where: { id: requestId, status: { in: ["PENDING", "MATCHED"] }, OR: [{ masterId: null }, { masterId: master.id }] },
      data: { status: "ACCEPTED", masterId: master.id },
    })
    if (lock.count === 0) {
      await ctx.answerCallbackQuery({ text: "Afsus, ish allaqachon boshqa ustaga ketdi", show_alert: true })
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
      return
    }
    const req = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { title: true, customerPhone: true },
    })
    await ctx.answerCallbackQuery({ text: "Qabul qilindi! ✅" })
    await ctx.editMessageText(`✅ Siz bu ishni qabul qildingiz:\n\n${req?.title ?? ""}\n\nMijoz bilan bog'laning.`)

    // Notify the customer (Mijoz bot) if we can find their telegram id by phone.
    if (req?.customerPhone) {
      const customer = await prisma.webCustomer.findFirst({
        where: { phone: req.customerPhone, telegramId: { not: null } },
        select: { telegramId: true },
      })
      if (customer?.telegramId) {
        await notifyCustomerOfAccept(customer.telegramId, master, req.title)
      }
    }
  })

  bot.callbackQuery(/^job:skip:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: "O'tkazib yuborildi" })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })

  return bot
}

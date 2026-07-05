import { InlineKeyboard } from "grammy"
import { bots } from "./registry"

interface JobForMaster {
  id: string
  title: string
  categoryName: string
  city: string
  distanceKm?: number | null
}

/** Push a new job to every matched master via the Usta bot. */
export async function notifyMastersOfRequest(
  masters: { telegramId: string | null }[],
  job: JobForMaster
): Promise<number> {
  const api = bots.ustaApi
  if (!api) return 0
  let sent = 0
  const text =
    `🔔 <b>Yangi ish</b>\n\n` +
    `🧰 ${job.categoryName}\n` +
    `📍 ${job.city}${job.distanceKm != null ? ` (~${job.distanceKm.toFixed(1)} km)` : ""}\n` +
    `📝 ${job.title}\n\n` +
    `Ishni qabul qilasizmi?`
  const kb = new InlineKeyboard()
    .text("✅ Qabul qilaman", `job:accept:${job.id}`)
    .text("❌ O'tkazib yuborish", `job:skip:${job.id}`)

  for (const m of masters) {
    if (!m.telegramId) continue
    try {
      await api.sendMessage(Number(m.telegramId), text, { parse_mode: "HTML", reply_markup: kb })
      sent++
    } catch {
      // master may have blocked the bot — skip
    }
  }
  return sent
}

/** Tell the customer (Mijoz bot) that a master accepted their job. */
export async function notifyCustomerOfAccept(
  customerTelegramId: string,
  master: { fullName: string; phone: string | null; rating: number },
  jobTitle: string
): Promise<void> {
  const api = bots.mijozApi
  if (!api) return
  const text =
    `✅ <b>Ustangiz topildi!</b>\n\n` +
    `👷 ${master.fullName} (⭐ ${master.rating.toFixed(1)})\n` +
    (master.phone ? `📞 ${master.phone}\n` : "") +
    `🛠 ${jobTitle}\n\n` +
    `Usta siz bilan tez orada bog'lanadi.`
  try {
    await api.sendMessage(Number(customerTelegramId), text, { parse_mode: "HTML" })
  } catch {
    // ignore
  }
}

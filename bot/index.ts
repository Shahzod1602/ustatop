import { USTA_BOT_TOKEN, MIJOZ_BOT_TOKEN } from "./config"
import { createUstaBot } from "./usta-bot"
import { createMijozBot } from "./mijoz-bot"
import { bots } from "./registry"

async function main() {
  if (!USTA_BOT_TOKEN && !MIJOZ_BOT_TOKEN) {
    console.error("❌ .env da USTA_BOT_TOKEN / MIJOZ_BOT_TOKEN yo'q. @BotFather dan token oling.")
    process.exit(1)
  }

  const running: Promise<void>[] = []

  if (USTA_BOT_TOKEN) {
    const usta = createUstaBot(USTA_BOT_TOKEN)
    bots.ustaApi = usta.api
    running.push(usta.start({ onStart: (i) => console.log(`✅ Usta bot ishga tushdi: @${i.username}`) }))
  } else {
    console.warn("⚠️  USTA_BOT_TOKEN yo'q — usta bot o'tkazib yuborildi")
  }

  if (MIJOZ_BOT_TOKEN) {
    const mijoz = createMijozBot(MIJOZ_BOT_TOKEN)
    bots.mijozApi = mijoz.api
    running.push(mijoz.start({ onStart: (i) => console.log(`✅ Mijoz bot ishga tushdi: @${i.username}`) }))
  } else {
    console.warn("⚠️  MIJOZ_BOT_TOKEN yo'q — mijoz bot o'tkazib yuborildi")
  }

  console.log("🤖 Botlar long-polling rejimida. To'xtatish: Ctrl+C")
  await Promise.all(running)
}

main().catch((err) => {
  console.error("Bot ishga tushmadi:", err)
  process.exit(1)
})

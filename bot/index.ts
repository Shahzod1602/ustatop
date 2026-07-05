import { createUstaBot } from "./usta-bot"
import { createMijozBot } from "./mijoz-bot"

// Two bots, one process, one backend:
//   MIJOZ_BOT_TOKEN -> customer bot (search / feed)
//   USTA_BOT_TOKEN  -> master bot (onboarding / kabinet)
const MIJOZ = process.env.MIJOZ_BOT_TOKEN ?? ""
const USTA = process.env.USTA_BOT_TOKEN ?? ""

async function main() {
  if (!MIJOZ && !USTA) {
    console.error("❌ MIJOZ_BOT_TOKEN / USTA_BOT_TOKEN yo'q. @BotFather dan oling.")
    process.exit(1)
  }

  const running: Promise<void>[] = []

  if (MIJOZ) {
    const bot = createMijozBot(MIJOZ)
    running.push(bot.start({ onStart: (i) => console.log(`✅ Mijoz bot: @${i.username}`) }))
  } else {
    console.warn("⚠️  MIJOZ_BOT_TOKEN yo'q — mijoz bot o'tkazib yuborildi")
  }

  if (USTA) {
    const bot = createUstaBot(USTA)
    running.push(bot.start({ onStart: (i) => console.log(`✅ Usta bot: @${i.username}`) }))
  } else {
    console.warn("⚠️  USTA_BOT_TOKEN yo'q — usta bot o'tkazib yuborildi")
  }

  console.log("🤖 UstaTanla botlar long-polling rejimida...")
  await Promise.all(running)
}

main().catch((err) => {
  console.error("Bot ishga tushmadi:", err)
  process.exit(1)
})

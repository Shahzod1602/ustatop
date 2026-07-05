import { createBot } from "./bot"

// Single bot for both customers and masters. Token from BOT_TOKEN (falls back to
// the legacy MIJOZ_/USTA_ vars so existing .env files keep working).
const TOKEN =
  process.env.BOT_TOKEN ?? process.env.MIJOZ_BOT_TOKEN ?? process.env.USTA_BOT_TOKEN ?? ""

async function main() {
  if (!TOKEN) {
    console.error("❌ BOT_TOKEN yo'q. @BotFather dan token oling va .env ga qo'ying.")
    process.exit(1)
  }
  const bot = createBot(TOKEN)
  console.log("🤖 UstaTanla bot long-polling rejimida...")
  await bot.start({ onStart: (i) => console.log(`✅ Bot ishga tushdi: @${i.username}`) })
}

main().catch((err) => {
  console.error("Bot ishga tushmadi:", err)
  process.exit(1)
})

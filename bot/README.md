# UstaTanla Telegram botlari

Ikkita bot bitta jarayonда (long-polling), bitta backend (Prisma) va bitta Mini App (`/tma`) bilan ishlaydi.

- **Usta bot** — ustalar ro'yxatdan o'tadi (raqam + yo'nalish + lokatsiya + narx), yangi ishlar push bo'ladi, bir tugмада qabul qiladi.
- **Mijoz bot** — mijoz kategoriya + lokatsiya + raqam + muammoni yuboradi → mos ustalarga tarqaladi → qabul qilган usta mijozга yoziladi.
- **Mini App** — `/tma` (Next.js). Botдаги "Mini App" tugmasi ochadi; `initData` orqali parolsiz kiradi.

## Sozlash

1. [@BotFather](https://t.me/BotFather) da **ikkita** bot yarating.
   - Har biriga `/setmenubutton` → Mini App URL = `https://<domen>/tma`.
2. `.env` ga qo' shing:
   ```
   USTA_BOT_TOKEN="..."
   MIJOZ_BOT_TOKEN="..."
   MINIAPP_URL="https://<domen>/tma"
   ```
   (Bot `NEXTAUTH_SECRET` va `DATABASE_URL` ni ham ishlatadi — Mini App auth uchun.)
3. DB tayyor bo'lsin: `npm run db:push && npm run db:seed`.

## Ishga tushirish

```bash
npm run bot            # ikkala botni polling rejimida ishga tushiradi
npm run bot:typecheck  # bot kodini type-check qiladi
```

Mini App HTTPS talab qiladi — lokal test uchun `ngrok`/tunnel bilan `/tma` ni ochib, MINIAPP_URL ni o'sha manzilга qo'ying.

## Arxitektura

```
Usta bot ─┐                        ┌─ Mijoz bot
          ├─ bot/ (grammY) ─ Prisma ┤
          │        │                └─ notify (botlararo push)
          │        └─ registry (ustaApi ↔ mijozApi)
          └─ "Mini App" tugma → Next.js /tma → /api/telegram/verify → mobil JWT
```

## Ishlab chiqishда e'tibor bering (TODO)

- Onboarding holati hozir **in-memory** (`bot/state.ts`) — restartда yo'qoladi. Prod uchun grammY session yoki Redis.
- Polling → prodда **webhook** (bitta HTTPS endpoint) tavsiya etiladi.
- Til: hozir faqat o'zbek — kirill/rus qo'shish mumkin.
- Usta verification hujjatlari oqimi hali botда yo'q (web adminда tasdiqlanadi).

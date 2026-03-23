# UstaTop CI/CD (GitHub + Docker Server)

## 1) GitHub repository secrets
`Settings -> Secrets and variables -> Actions` ga quyidagilarni kiriting:

- `SERVER_HOST` - server IP yoki domain
- `SERVER_PORT` - odatda `22`
- `SERVER_USER` - SSH user
- `SERVER_SSH_KEY` - private key (PEM)
- `SERVER_APP_DIR` - serverdagi loyiha papkasi (masalan: `/opt/ustatop`)
- `GHCR_USERNAME` - GitHub username
- `GHCR_TOKEN` - `read:packages` huquqli GitHub token (serverda image pull uchun)
- `DEPLOY_ENV_FILE` - production `.env` kontenti (multi-line secret)

`DEPLOY_ENV_FILE` uchun namunani `.env.production.example` dan oling.

## 2) Server prerequisites
- Docker va Docker Compose plugin o'rnatilgan bo'lishi kerak.
- `SERVER_APP_DIR` papkasi mavjud bo'lishi kerak.
- Serverdan `ghcr.io` ga internet chiqishi kerak.

## 3) Deploy flow
`main` branchga push qiling:

1. GitHub Actions `npm build` qiladi.
2. Web va bot image'lar GHCR'ga push qilinadi.
3. `docker-compose.prod.yml` serverga ko'chadi.
4. Serverda:
   - `.env` fayli `DEPLOY_ENV_FILE` secretidan yoziladi
   - GHCR login qilinadi
   - `docker compose pull && up -d` ishlaydi

## 4) URL lar
- Web app: `http://SERVER_IP:3000` (yoki reverse proxy orqali `https://...`)
- Telegram Mini App uchun `WEBAPP_URL` albatta HTTPS bo'lishi tavsiya etiladi.

## 5) Muhim xavfsizlik eslatmasi
- Telegram bot tokenini public joyga chiqarmang.
- Agar token ochilib qolgan bo'lsa, BotFather orqali rotate qiling.

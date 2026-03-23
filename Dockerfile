FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]

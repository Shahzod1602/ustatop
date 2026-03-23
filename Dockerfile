FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]

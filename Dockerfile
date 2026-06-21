FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencias primero (capa cacheada)
COPY package.json package-lock.json* ./
RUN npm ci

# Identificador de build por commit: invalida la caché de las capas
# siguientes cuando cambia el commit (misma lección que workdesk).
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TZ=Europe/Madrid
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

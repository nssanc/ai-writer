FROM node:20-alpine AS base

# 安装pandoc用于Word导出
RUN apk add --no-cache pandoc

WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 创建数据目录
RUN mkdir -p /app/data /app/uploads /app/outputs
RUN chown -R nextjs:nodejs /app/data /app/uploads /app/outputs

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]


# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/server/package*.json packages/server/
COPY packages/client/package*.json packages/client/
RUN npm ci --legacy-peer-deps

# Stage 2: Build
FROM deps AS build
COPY . .
RUN npm run build:server && npm run build:client

# Stage 3: Production
FROM node:20-slim AS production
WORKDIR /app

RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/client/dist ./packages/client/dist
COPY --from=build /app/packages/server/package*.json ./packages/server/
COPY --from=build /app/package*.json ./

RUN npm ci --omit=dev --workspace=packages/server --legacy-peer-deps

RUN mkdir -p /app/packages/server/data && \
    chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "packages/server/dist/index.js"]

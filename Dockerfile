# =============================================================
# CodeTogether — Production Backend Container
# Multi-stage Docker build for persistent Node.js + Socket.IO server
# =============================================================

FROM node:20-bullseye-slim AS runner

# Install essential execution runtimes: Python3, GCC, G++, OpenJDK, Make
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    g++ \
    gcc \
    make \
    default-jre-headless \
    git \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production and build dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY server ./server
COPY src ./src
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./

# Create non-root user and persistent storage directories
RUN mkdir -p /app/server/storage /app/server/sandboxes \
    && chown -R node:node /app

USER node

EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["node", "server/server.js"]

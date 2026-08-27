FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/venv

WORKDIR /app
COPY . .

RUN /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt \
    && npm install -g corepack@latest \
    && corepack pnpm install \
    && corepack pnpm run build

ENV PATH="/opt/venv/bin:$PATH"
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]

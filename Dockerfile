# ── Growth Engine — Docker image (slim build for client demo) ─────────────────
# Stack: Node 20 (Express) + Python 3 (gen_image.py, gen_image_edit.py, pln_query.py)
# SWI-Prolog/PeTTa is intentionally excluded to keep the image small and the build fast.
# pln_query.py falls back to its pure-Python PLN implementation automatically.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-bookworm-slim

# ── Python + openai package (needed by gen_image.py / gen_image_edit.py) ──────
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY webapp/requirements.txt /tmp/webapp-requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages \
        -r /tmp/webapp-requirements.txt

# ── App source ────────────────────────────────────────────────────────────────
WORKDIR /app

# Only copy what the webapp actually needs at runtime
COPY webapp/ ./webapp/
COPY sample_data/atoms/ ./sample_data/atoms/
COPY python/ ./python/
# lib_pln.metta is needed if PeTTa is available; safe to copy even without it
COPY repos/OmegaClaw-Core/lib_pln.metta ./repos/OmegaClaw-Core/lib_pln.metta

# ── Node deps ─────────────────────────────────────────────────────────────────
WORKDIR /app/webapp
RUN npm ci --omit=dev

# ── Runtime env ───────────────────────────────────────────────────────────────
ENV PORT=8001
ENV OMEGACLAW_PYTHON=/usr/bin/python3
ENV PETTA_PATH=/app
ENV NODE_ENV=production

EXPOSE 8001

CMD ["node", "server.js"]

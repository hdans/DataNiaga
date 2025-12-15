FROM python:3.11-slim

# System deps for LightGBM and scientific stack
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ libgomp1 && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Copy requirements first (better layer caching)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source
COPY backend/ /app/

# Expose port (informational)
EXPOSE ${PORT}

# Basic healthcheck hitting the FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD \
  python -c "import urllib.request, os; url=f'http://127.0.0.1:{os.getenv('PORT','8000')}/api/health'; urllib.request.urlopen(url).read()" || exit 1

# Start via Gunicorn + Uvicorn worker
CMD ["gunicorn", "backend.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:${PORT}", \
     "--workers", "2", \
     "--timeout", "300"]

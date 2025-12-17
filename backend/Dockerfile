FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ libgomp1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

<<<<<<< HEAD
# Karena context = backend/, langsung copy file
=======
>>>>>>> 973b3e9592f3443f470cc94342d39b310e046894
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

<<<<<<< HEAD
CMD gunicorn main:app \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT
=======
CMD sh -c "gunicorn main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT}"
>>>>>>> 973b3e9592f3443f470cc94342d39b310e046894

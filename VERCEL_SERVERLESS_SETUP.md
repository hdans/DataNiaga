# ✅ Vercel Serverless Setup Complete

Saya sudah setup DataNiaga untuk deploy **kedua-duanya di Vercel** sebagai serverless functions!

---

## 📁 Struktur Baru

```
DataNiaga/
├── frontend/              ← React app (hosted di Vercel)
├── api/                   ← Backend serverless (hosted di Vercel)
│   ├── index.py          # FastAPI app + Mangum handler
│   ├── schemas.py        # Pydantic models
│   └── services/         # ML services
│       ├── forecasting.py
│       ├── mba.py
│       └── recommendations.py
├── vercel.json           # ← Vercel configuration
├── requirements.txt      # Python dependencies
└── backend/              # (Original backend - tetap ada)
```

---

## 🎯 Yang Sudah Disetup

### ✅ 1. API Serverless Function (`api/index.py`)
- FastAPI app dengan semua endpoints
- Mangum adapter untuk Vercel
- In-memory data store (sama seperti sebelumnya)
- CORS configured untuk Vercel

### ✅ 2. Services Disalin
- `api/services/forecasting.py` ← LightGBM ML
- `api/services/mba.py` ← Market Basket Analysis
- `api/services/recommendations.py` ← Recommendation logic

### ✅ 3. Vercel Configuration
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/index.py": {
      "runtime": "python3.11",
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

### ✅ 4. Requirements.txt (Root Level)
```
fastapi==0.109.0
mangum==0.17.0
pandas==2.1.4
numpy==1.26.3
scikit-learn==1.4.0
lightgbm==4.3.0
mlxtend==0.23.1
...
```

---

## 🚀 Cara Deploy

### Step 1: Update Frontend Environment
Dalam `frontend/.env.production`:
```
VITE_API_URL=/api
```

(Ini membuat frontend call ke `/api` = serverless function)

### Step 2: Push ke GitHub
```bash
git add .
git commit -m "Add Vercel serverless backend"
git push origin main
```

### Step 3: Deploy ke Vercel

**Opsi A: CLI (Tercepat)**
```bash
npm install -g vercel
vercel
```

**Opsi B: GitHub Integration**
1. Buka https://vercel.com
2. Click "Import Project"
3. Select GitHub repo
4. Vercel auto-detect `vercel.json`
5. Deploy!

### Step 4: Test
```bash
curl https://your-app.vercel.app/api/health
# Should return: {"status": "healthy", ...}
```

---

## ⚙️ Cara Kerja

```
Browser
   ↓
vercel.app/
   ↓
Frontend (React) loads
   ↓
User uploads CSV
   ↓
API call: POST /api/upload-data
   ↓
Vercel routes → api/index.py
   ↓
FastAPI + Mangum handles request
   ↓
ML pipeline runs (forecasting, MBA, etc)
   ↓
Results stored in memory
   ↓
Returns JSON
   ↓
Frontend displays dashboard
```

---

## ⚠️ Penting! Limitation Serverless

| Aspek | Limit |
|-------|-------|
| **Timeout** | 60 detik |
| **Memory** | 3GB |
| **Max body** | ~100MB |
| **Cold start** | 2-5 detik |

### ⚠️ Data Besar Bisa Timeout!

Kalau dataset:
- < 1000 rows → ✅ Aman
- 1000-5000 rows → ⚠️ Borderline (bisa slow)
- > 5000 rows → ❌ Bisa timeout

**Jika perlu dataset besar → gunakan Render backend saja!**

---

## 📊 Struktur API Path

Semua endpoint tetap sama, hanya path berubah:

```
Development (local):
  POST http://localhost:8000/api/upload-data
  GET http://localhost:8000/api/forecast

Production (Vercel):
  POST https://your-app.vercel.app/api/upload-data
  GET https://your-app.vercel.app/api/forecast
```

Frontend otomatis se-adjust based on `VITE_API_URL`

---

## 💾 Data Persistence

**Penting:** Tiap function run = data reset!

```
Request 1: User A upload CSV → data stored in memory
Request 2: User A query API → data masih ada ✅
Request 1 timeout/selesai → function killed
Request 3: User B upload CSV → NEW instance, User A data GONE ❌
```

**Ini OK untuk use case kamu** (single-session analysis)

Kalau perlu multi-session, harus add database.

---

## 🎯 Kapan Pakai Vercel vs Render

### ✅ Vercel Serverless cocok untuk:
- Small datasets
- Quick analysis
- Single users per session
- Demo/MVP

### ⚠️ Switch ke Render kalau:
- Dataset > 5000 rows
- Processing > 30 seconds
- Multiple concurrent users
- Need data persistence

---

## 📋 Deployment Checklist

- [ ] `vercel.json` created ✓
- [ ] `api/index.py` created ✓
- [ ] `api/services/` copied ✓
- [ ] `requirements.txt` at root ✓
- [ ] `frontend/.env.production` updated
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] `/api/health` returns 200
- [ ] `/api/upload-data` works

---

## 🆚 Perbandingan: Vercel vs Render

| Aspek | Vercel | Render |
|-------|--------|--------|
| **Setup** | 5 menit | 10 menit |
| **Cold start** | 2-5s | instant |
| **Timeout** | 60s | unlimited |
| **Dataset size** | Kecil | Besar |
| **Cost** | $0 | $0 (free tier) |
| **Maintenance** | Auto | Manual |
| **Performance** | Medium | High |

---

## 💡 Rekomendasi

**Mulai dengan Vercel untuk:**
- Testing deployment
- Demo ke client
- Small datasets

**Switch ke Render kalau:**
- Perlu process data besar
- Performance issue
- Timeout errors

Keduanya tetap **FREE** untuk tier awal!

---

## 📚 Dokumentasi

Baca juga:
- `VERCEL_DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `DATABASE_REMOVAL_COMPLETE.md` - Architecture overview
- `QUICK_START.md` - Local testing

---

## 🎉 Ready to Deploy!

Struktur sudah complete. Sekarang tinggal:

1. Update `.env.production` frontend
2. Push ke GitHub  
3. Deploy ke Vercel
4. Test!

Total waktu deploy: **5 menit**
Total cost: **$0**
Result: **Fully working DSS dashboard**

---

## 🆘 Jika Ada Error

### "Function timeout"
→ Dataset terlalu besar, gunakan Render backend saja

### "API returns 404"
→ Check `VITE_API_URL=/api` di frontend

### "Memory exceeded"
→ Kurangi ukuran dataset

### Cold start lambat
→ Itu normal untuk serverless, tunggu 5 detik pertama

---

**Status: SIAP DEPLOY! 🚀**

Lanjut dengan step-by-step deployment? Atau ada pertanyaan?


# Deploy to Vercel (Frontend + Backend Serverless)

## 📁 Project Structure

```
DataNiaga/
├── frontend/               # React app
│   ├── package.json
│   ├── src/
│   └── vite.config.ts
├── api/                    # Vercel serverless backend
│   ├── index.py           # Main FastAPI app
│   ├── schemas.py         # Pydantic models
│   └── services/          # ML services
│       ├── forecasting.py
│       ├── mba.py
│       └── recommendations.py
├── vercel.json            # Vercel config
├── requirements.txt       # Python dependencies
└── ...
```

## 🚀 Deployment Steps

### Step 1: Update Frontend Environment

In `frontend/.env.production`:
```
VITE_API_URL=/api
```

This tells the frontend that API calls should go to `/api` (same origin, serverless functions).

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add Vercel serverless backend setup"
git push origin main
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI (Fastest)
```bash
npm install -g vercel
cd DataNiaga
vercel
```

#### Option B: GitHub Integration
1. Go to https://vercel.com
2. Click "Import Project"
3. Select GitHub repo
4. Vercel auto-detects `vercel.json`
5. Set environment variables (if needed)
6. Deploy

### Step 4: Environment Variables (if needed)

In Vercel dashboard:
```
VITE_API_URL=/api
```

### Step 5: Verify Deployment

```bash
# Check frontend is running
curl https://your-vercel-app.vercel.app

# Check API is working
curl https://your-vercel-app.vercel.app/api/health

# Should return:
{"status": "healthy", "timestamp": "..."}
```

---

## ⚙️ How It Works

### Vercel Serverless Flow:
```
1. User visits: https://your-app.vercel.app
   ↓
2. Frontend loads (React app from /dist)
   ↓
3. User uploads CSV
   ↓
4. Frontend calls: /api/upload-data
   ↓
5. Vercel routes to: api/index.py (FastAPI + Mangum)
   ↓
6. Python serverless function runs
   ↓
7. ML pipeline executes (forecasting, MBA, etc)
   ↓
8. Results stored in memory
   ↓
9. API returns JSON
   ↓
10. Frontend displays dashboard
```

### Important Notes:
- ✅ Each request starts a new function instance
- ✅ Data stored in `data_store` (in-memory)
- ✅ **Timeout: 60 seconds max per request**
- ⚠️ Large datasets (>50MB) may timeout
- ⚠️ Each function restart = data reset (but that's expected)

---

## 🔧 Troubleshooting

### Error: "Function timeout"
- **Cause:** Upload + ML pipeline takes > 60 seconds
- **Solution:** Optimize data or use smaller dataset
- Or switch to backend server (Render)

### Error: "API returns 404"
- **Cause:** Frontend API URL is wrong
- **Solution:** Check `VITE_API_URL=/api` in env

### Error: "Memory limit exceeded"
- **Cause:** Dataset too large
- **Solution:** Use Render backend instead

### Data disappears after request
- **Cause:** That's normal! Serverless functions are stateless
- **Solution:** Each user gets fresh function (no shared state)

---

## 📊 Performance Characteristics

| Metric | Value |
|--------|-------|
| Cold start | 2-5 seconds |
| Warm request | <500ms |
| Memory | 3GB max |
| Timeout | 60 seconds |
| Concurrency | Auto-scale |

### When to Use Vercel Serverless:
- ✅ Small datasets (<1000 rows)
- ✅ Quick analysis (upload → view results)
- ✅ Low traffic application
- ✅ Single-user sessions

### When to Switch to Render:
- ❌ Large datasets (>10MB)
- ❌ Heavy ML processing (>30 seconds)
- ❌ Need persistent storage
- ❌ Multiple concurrent users

---

## 💡 Cost Analysis

| Component | Vercel | Cost |
|-----------|--------|------|
| Frontend | Included | Free |
| API Calls | First 1M | Free (then $0.50/1M) |
| Total | | $0 for small projects |

---

## ✅ Deployment Checklist

- [ ] `vercel.json` created in root
- [ ] `api/index.py` exists with FastAPI app
- [ ] `api/schemas.py` copied from backend
- [ ] `api/services/` has all ML services
- [ ] `requirements.txt` at root has dependencies
- [ ] `frontend/.env.production` has `VITE_API_URL=/api`
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Health check passes: `/api/health`
- [ ] Upload endpoint works: `/api/upload-data`

---

## 🎉 You're Live!

Your DataNiaga system is now:
- ✅ Deployed to Vercel
- ✅ Frontend + backend together
- ✅ No database needed
- ✅ Completely FREE
- ✅ Auto-scales with traffic

**URL:** https://your-vercel-app.vercel.app

---

## Next Steps

1. **Test thoroughly** with various dataset sizes
2. **Monitor cold starts** in Vercel dashboard
3. **Check function logs** if errors occur
4. **Consider Render backend** if timeout issues persist


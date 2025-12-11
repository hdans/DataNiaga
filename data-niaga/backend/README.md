# DataNiaga Backend API

Backend FastAPI untuk Retail Decision Support System.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Server

```bash
# Development mode dengan auto-reload
python main.py

# Atau menggunakan uvicorn langsung
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI application & endpoints
├── database.py          # SQLAlchemy database configuration
├── models.py            # Database models (ORM)
├── schemas.py           # Pydantic schemas for validation
├── requirements.txt     # Python dependencies
├── services/
│   ├── __init__.py
│   ├── forecasting.py   # LightGBM forecasting logic
│   ├── mba.py           # FP-Growth Market Basket Analysis
│   └── recommendations.py # DSS recommendation engine
└── README.md
```

## 🔌 API Endpoints

### Upload & Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-data` | Upload CSV/Excel file untuk processing |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user` | Create user session |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get dashboard metrics |

### Forecasting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast` | Get forecast data (filter by pulau, product) |

### Market Basket Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mba-rules` | Get MBA association rules |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get DSS recommendations |

### Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/islands` | Get list of islands |
| GET | `/api/products` | Get list of products |
| GET | `/api/health` | Health check |

## 📊 Required Data Columns

Upload file harus memiliki kolom berikut:

| Column | Type | Description |
|--------|------|-------------|
| `InvoiceNo` | String | Nomor invoice/transaksi |
| `InvoiceDate` | Date | Tanggal transaksi |
| `PULAU` | String | Nama pulau/region |
| `PRODUCT_CATEGORY` | String | Kategori produk |
| `Quantity` | Integer | Jumlah terjual |

## 🔧 Configuration

### Database
Default menggunakan SQLite (`dataniaga.db`). Untuk PostgreSQL, update `database.py`:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dataniaga"
```

### CORS
CORS dikonfigurasi untuk menerima request dari frontend React di:
- `http://localhost:5173` (Vite)
- `http://localhost:3000`

## 🧪 Testing API

### Upload Data
```bash
curl -X POST "http://localhost:8000/api/upload-data" \
  -H "accept: application/json" \
  -F "file=@sales_data.csv"
```

### Get Dashboard Summary
```bash
curl "http://localhost:8000/api/dashboard/summary"
```

### Get Recommendations
```bash
curl "http://localhost:8000/api/recommendations?pulau=JAWA,%20BALI,%20%26%20NT"
```

## 📈 Production Deployment

1. **Install production dependencies:**
   ```bash
   pip install gunicorn
   ```

2. **Run with Gunicorn:**
   ```bash
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

3. **Enable real ML models:**
   - Uncomment LightGBM code di `services/forecasting.py`
   - Uncomment FP-Growth code di `services/mba.py`

## 🔗 Frontend Integration

Update frontend environment variable:

```env
VITE_API_URL=http://localhost:8000
```

Atau untuk production:
```env
VITE_API_URL=https://your-api-domain.com
```

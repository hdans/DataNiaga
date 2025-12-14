# 🚨 Exception Summary - DataNiaga Validation System

## Quick Reference

### 📌 Exception Categories

```
┌─────────────────────────────────────────────────────────────┐
│                   VALIDATION EXCEPTIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 FILE VALIDATION (3)                                    │
│  ├── Format file tidak didukung                           │
│  ├── File kosong                                          │
│  └── File terlalu besar (> 50MB)                          │
│                                                             │
│  🏗️  STRUCTURE VALIDATION (2)                              │
│  ├── Kolom wajib tidak ditemukan                          │
│  └── File terlalu pendek (< 2 baris)                      │
│                                                             │
│  📊 DATA VALIDATION (14)                                   │
│  │                                                         │
│  ├─ InvoiceNo (2)                                         │
│  │  ├── Kosong                                            │
│  │  └── Duplikat                                          │
│  │                                                         │
│  ├─ InvoiceDate (3)                                       │
│  │  ├── Kosong                                            │
│  │  ├── Format salah                                      │
│  │  └── Tanggal tidak valid                               │
│  │                                                         │
│  ├─ PULAU (2)                                             │
│  │  ├── Kosong                                            │
│  │  └── Tidak standar (⚠️)                                 │
│  │                                                         │
│  ├─ PRODUCT_CATEGORY (1)                                  │
│  │  └── Kosong                                            │
│  │                                                         │
│  └─ Quantity (4)                                          │
│     ├── Kosong                                            │
│     ├── Bukan angka                                       │
│     ├── Nol/Negatif                                       │
│     └── Bukan angka bulat                                 │
│                                                             │
│  ⚠️  WARNINGS (3)                                          │
│  ├── Data terlalu sedikit (< 100 transaksi)              │
│  ├── Kategori terlalu sedikit (< 3)                      │
│  └── Wilayah terlalu sedikit (< 2)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Total Exception Count: **22**

| Category | Count | Level | Blocks Upload |
|----------|-------|-------|--------------|
| File Validation | 3 | 🔴 Error | ✅ YES |
| Structure Validation | 2 | 🔴 Error | ✅ YES |
| Data Validation | 14 | 🔴 Error | ✅ YES |
| Warnings | 3 | 🟡 Warning | ❌ NO |
| **TOTAL** | **22** | Mixed | - |

---

## Exception Matrix by Field

```
FIELD              ERRORS          WARNINGS        BLOCKING
─────────────────────────────────────────────────────────────
InvoiceNo          2               0               ✅ YES
InvoiceDate        3               0               ✅ YES
PULAU              1               1               ✅ YES*
PRODUCT_CATEGORY   1               0               ✅ YES
Quantity           4               0               ✅ YES
─────────────────────────────────────────────────────────────
General            2               3               ✅ YES
─────────────────────────────────────────────────────────────

* PULAU warning doesn't block, but error does
```

---

## Exception Flow Diagram

```
User Upload File
    │
    ├─→ [FILE VALIDATION]
    │   ├─ Format check (csv/xlsx/xls)     → Exception: Format tidak didukung 🔴
    │   ├─ Size check (0 bytes)            → Exception: File kosong 🔴
    │   └─ Size check (> 50MB)             → Exception: File terlalu besar 🔴
    │
    ├─→ [STRUCTURE VALIDATION]
    │   ├─ Parse CSV                       → Exception: File terlalu pendek 🔴
    │   └─ Check columns                   → Exception: Kolom tidak ditemukan 🔴
    │
    └─→ [DATA VALIDATION] (per row)
        ├─→ InvoiceNo
        │   ├─ Not empty check             → Exception: Kosong 🔴
        │   └─ Uniqueness check            → Exception: Duplikat 🔴
        │
        ├─→ InvoiceDate
        │   ├─ Not empty check             → Exception: Kosong 🔴
        │   ├─ Format check (regex)        → Exception: Format salah 🔴
        │   └─ Parse & validity check      → Exception: Tanggal tidak valid 🔴
        │
        ├─→ PULAU
        │   ├─ Not empty check             → Exception: Kosong 🔴
        │   └─ Standard check (list)       → Warning: Tidak standar 🟡
        │
        ├─→ PRODUCT_CATEGORY
        │   └─ Not empty check             → Exception: Kosong 🔴
        │
        └─→ Quantity
            ├─ Not empty check             → Exception: Kosong 🔴
            ├─ Parse to number             → Exception: Bukan angka 🔴
            ├─ Range check (> 0)           → Exception: Nol/Negatif 🔴
            └─ Integer check               → Exception: Bukan angka bulat 🔴

    │
    ├─→ [GENERAL CHECKS]
    │   ├─ Row count check                 → Warning: Data terlalu sedikit 🟡
    │   ├─ Unique categories               → Warning: Kategori terlalu sedikit 🟡
    │   └─ Unique pulau                    → Warning: Wilayah terlalu sedikit 🟡
    │
    └─→ RESULT
        ├─ Has errors?      → FAIL ❌ → Show error details
        ├─ Has warnings?    → PASS ✅ → Show warnings only
        └─ All OK?          → SUCCESS ✅ → Process data
```

---

## Exception Message Examples

### 🔴 File Level
```
❌ Format file tidak didukung. Gunakan CSV atau Excel (.csv, .xlsx, .xls)
❌ File kosong. Pastikan file memiliki data.
❌ File terlalu besar (max 50MB). Perpecil file Anda.
```

### 🔴 Structure Level
```
❌ Kolom wajib tidak ditemukan: PRODUCT_CATEGORY, Quantity
❌ File terlalu pendek. Minimal perlu header + 1 baris data
```

### 🔴 Data Level - Each Error Shows
```
Field:        InvoiceNo
Row:          Baris 5
Current:      Value: INV-001
Reason:       Nomor faktur duplikat (sudah ada sebelumnya)
```

### 🟡 Warning Level
```
⚠️ Hanya 50 transaksi ditemukan. Minimal 100 disarankan untuk analisis optimal.
⚠️ Hanya 2 kategori produk ditemukan. Lebih banyak kategori = analisis lebih baik.
⚠️ Baris 10: Wilayah "SURABAYA" tidak standar. Contoh: JAWA, BALI, SUMATERA
```

---

## UI Components Used

### Error Display
```
[Container: bg-destructive/5, border-destructive/30]
├─ Header: "Detail Kesalahan (14)" with icon
├─ Error List (scrollable, max 20 shown)
│  └─ [Each error box]
│     ├─ Field badge (mono text)
│     ├─ Row number
│     ├─ Current value
│     └─ Error reason
└─ Statistics: "12 dari 50 baris valid"
```

### Warning Display
```
[Container: bg-yellow-500/5, border-yellow-500/30]
├─ Header: "Peringatan (3)" with icon
└─ Warning list
   ├─ • Hanya 50 transaksi ditemukan...
   ├─ • Hanya 2 kategori produk...
   └─ • Baris 10: Wilayah tidak standar...
```

---

## Validation Statistics Tracking

```typescript
interface DataValidationResult {
  isValid: boolean;              // All errors = false
  errors: ValidationError[];     // Error details
  warnings: string[];            // Warning messages
  stats: {
    totalRows: number;           // Total data rows (exclude header)
    validRows: number;           // Rows passed validation
  };
}

// Example Result:
{
  isValid: false,
  errors: [
    {
      field: 'Quantity',
      rowNumber: 5,
      value: '5.5',
      reason: 'Quantity harus berupa angka bulat (tidak ada desimal)'
    },
    // ... more errors
  ],
  warnings: [
    '⚠️ Hanya 50 transaksi ditemukan. Minimal 100 disarankan...'
  ],
  stats: {
    totalRows: 50,
    validRows: 48
  }
}
```

---

## Implementation Details

### File Location
`src/pages/Setup.tsx`

### Key Functions
1. **`validateFile()`** - File format & size validation
2. **`parseCSV()`** - Parse CSV content to records
3. **`validateDataStructure()`** - Full data validation + error collection

### Validation Features
- ✅ Front-end validation (instant feedback)
- ✅ Detailed error messages
- ✅ Error messages in Bahasa Indonesia
- ✅ Error details per row (field, row number, value, reason)
- ✅ Scrollable error list (max 20 at a time)
- ✅ Warnings alongside errors
- ✅ Statistics dashboard
- ✅ Auto-dismiss validation results when file removed

---

## Use Case Examples

### ✅ VALID FILE
```csv
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY,Quantity
INV-001,2024-01-15,JAWA,Susu,5
INV-002,2024-01-15,BALI,Roti,3
INV-003,2024-01-16,SUMATERA,Kacang Tanah,10
```
✅ **Result:** All valid → Process data

### ❌ MISSING COLUMN
```csv
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY
INV-001,2024-01-15,JAWA,Susu
```
❌ **Result:** `Kolom wajib tidak ditemukan: Quantity`

### ❌ INVALID DATES
```csv
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY,Quantity
INV-001,01-15-2024,JAWA,Susu,5
INV-002,2024-13-01,BALI,Roti,3
```
❌ **Results:**
- Row 2: Format tanggal salah (01-15-2024)
- Row 3: Tanggal tidak valid (bulan 13)

### ❌ INVALID QUANTITY
```csv
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY,Quantity
INV-001,2024-01-15,JAWA,Susu,5.5
INV-002,2024-01-16,BALI,Roti,-2
INV-003,2024-01-17,SUMATERA,Kacang Tanah,ten
```
❌ **Results:**
- Row 2: Bukan angka bulat (5.5)
- Row 3: Nol/Negatif (-2)
- Row 4: Bukan angka (ten)

### ⚠️ WARNINGS
```csv
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY,Quantity
INV-001,2024-01-15,JAWA,Susu,5
INV-002,2024-01-16,BALI,Roti,3
(hanya 2 transaksi, hanya 2 wilayah)
```
✅ **Valid** but ⚠️ **Warnings:**
- Hanya 2 transaksi (minimal 100 disarankan)
- Hanya 2 wilayah (lebih banyak lebih baik)

---

## Error Handling Strategy

```
EXCEPTION OCCURS
    ↓
1. Collect error details (field, row, value, reason)
2. Display error message to user
3. Show detailed list of all errors
4. Provide statistics (X of Y rows valid)
5. Suggest solutions in error message
    ↓
USER FIXES DATA
    ↓
6. Remove file and retry (validationResult cleared)
    ↓
REVALIDATE
```

---

## Notes

- **Performance:** Validation pada file besar (10MB+) mungkin butuh beberapa detik
- **Feedback:** Instant validation feedback sebelum API call
- **UX:** Error messages jelas dan actionable (user tahu cara fix)
- **Scalability:** Dapat menampilkan 100+ errors (dengan pagination)
- **Localization:** All messages in Bahasa Indonesia

---

Last Updated: December 14, 2025

# 🎨 EXCEPTION VISUAL GUIDE

Quick visual reference untuk semua 20 exceptions yang telah diimplementasikan.

---

## 📊 EXCEPTION TREE

```
🔴 VALIDATION EXCEPTIONS (20 Total)
│
├─ 📁 FILE VALIDATION (3 Errors)
│  ├─ ❌ Format File Tidak Didukung
│  │     → .csv, .xlsx, .xls only
│  │
│  ├─ ❌ File Kosong
│  │     → Size = 0 bytes
│  │
│  └─ ❌ File Terlalu Besar
│        → Size > 50 MB
│
├─ 🏗️ STRUCTURE VALIDATION (2 Errors)
│  ├─ ❌ Kolom Wajib Tidak Ditemukan
│  │     → Missing required columns
│  │
│  └─ ❌ File Terlalu Pendek
│        → Less than header + 1 row
│
├─ 📊 DATA VALIDATION (14 Errors)
│  │
│  ├─ 🔤 InvoiceNo (2 Errors)
│  │  ├─ ❌ Kosong
│  │  └─ ❌ Duplikat
│  │
│  ├─ 📅 InvoiceDate (3 Errors)
│  │  ├─ ❌ Kosong
│  │  ├─ ❌ Format Salah
│  │  └─ ❌ Tanggal Tidak Valid
│  │
│  ├─ 🗺️ PULAU (1 Error + 1 Warning)
│  │  ├─ ❌ Kosong (ERROR)
│  │  └─ ⚠️ Tidak Standar (WARNING)
│  │
│  ├─ 📦 PRODUCT_CATEGORY (1 Error)
│  │  └─ ❌ Kosong
│  │
│  └─ 🔢 Quantity (4 Errors)
│     ├─ ❌ Kosong
│     ├─ ❌ Bukan Angka
│     ├─ ❌ Nol/Negatif
│     └─ ❌ Bukan Integer
│
└─ ⚠️ WARNINGS (3 + 1 = 4)
   ├─ ⚠️ Data < 100 Transaksi
   ├─ ⚠️ Kategori < 3
   ├─ ⚠️ Wilayah < 2
   └─ ⚠️ PULAU Tidak Standar (dari data validation)
```

---

## 🎯 EXCEPTION BY FIELD

```
┌────────────────────────────────────────────────────────────────┐
│                      BY FIELD BREAKDOWN                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔤 InvoiceNo                                                  │
│  ├─ ❌ Kosong                                                  │
│  └─ ❌ Duplikat                                                │
│  Total: 2 Errors                                               │
│                                                                │
│  📅 InvoiceDate                                                │
│  ├─ ❌ Kosong                                                  │
│  ├─ ❌ Format Salah (YYYY-MM-DD or DD/MM/YYYY)                │
│  └─ ❌ Tanggal Tidak Valid (Feb 30, bulan 13, dll)           │
│  Total: 3 Errors                                               │
│                                                                │
│  🗺️ PULAU                                                      │
│  ├─ ❌ Kosong (ERROR)                                          │
│  └─ ⚠️ Tidak Standar (WARNING)                                 │
│  Total: 1 Error + 1 Warning                                    │
│                                                                │
│  📦 PRODUCT_CATEGORY                                           │
│  └─ ❌ Kosong                                                  │
│  Total: 1 Error                                                │
│                                                                │
│  🔢 Quantity                                                   │
│  ├─ ❌ Kosong                                                  │
│  ├─ ❌ Bukan Angka (text, symbols, "5 pcs")                   │
│  ├─ ❌ Nol atau Negatif (0, -5, dll)                          │
│  └─ ❌ Bukan Integer (5.5, 10.75, dll)                        │
│  Total: 4 Errors                                               │
│                                                                │
│  📊 General Stats                                              │
│  ├─ ⚠️ Data < 100 Transaksi                                    │
│  ├─ ⚠️ Kategori < 3                                           │
│  ├─ ⚠️ Wilayah < 2                                            │
│  └─ ❌ Kolom Missing (part of structure)                      │
│  Total: 3 Warnings + Various Errors                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔴 ERROR vs 🟡 WARNING

```
┌──────────────────────────────────┬──────────────────────────────┐
│     🔴 ERROR (Blokir Upload)     │  🟡 WARNING (Hanya Info)     │
├──────────────────────────────────┼──────────────────────────────┤
│                                  │                              │
│ ❌ Format file tidak didukung    │ ⚠️  Data < 100               │
│ ❌ File kosong                   │ ⚠️  Kategori < 3             │
│ ❌ File terlalu besar            │ ⚠️  Wilayah < 2              │
│ ❌ Kolom tidak ditemukan         │ ⚠️  PULAU tidak standar      │
│ ❌ File terlalu pendek           │                              │
│ ❌ InvoiceNo kosong              │ ✅ Proses tetap lanjut       │
│ ❌ InvoiceNo duplikat            │ ✅ Tidak perlu fix           │
│ ❌ InvoiceDate kosong            │                              │
│ ❌ InvoiceDate format salah      │                              │
│ ❌ InvoiceDate tidak valid       │                              │
│ ❌ PULAU kosong                  │                              │
│ ❌ PRODUCT_CATEGORY kosong       │                              │
│ ❌ Quantity kosong               │                              │
│ ❌ Quantity bukan angka          │                              │
│ ❌ Quantity nol/negatif          │                              │
│ ❌ Quantity bukan integer        │                              │
│                                  │                              │
│ ❌ STOP PROCESSING               │ ℹ️  SHOW MESSAGE & CONTINUE  │
│                                  │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

---

## 📋 EXCEPTION MATRIX

```
FIELD                 ERROR              VALUE EXAMPLE      REASON
─────────────────────────────────────────────────────────────────
InvoiceNo             EMPTY              ""                 Tidak ada nomor
                      DUPLICATE          "INV-001" (x2)     Sudah ada sebelumnya

InvoiceDate           EMPTY              ""                 Tidak ada tanggal
                      FORMAT WRONG       "01-15-2024"       Bukan YYYY-MM-DD/DD/MM/YYYY
                      INVALID            "2024-02-30"       Tanggal tidak ada

PULAU                 EMPTY              ""                 Tidak ada wilayah
                      NOT STANDARD (⚠️)  "SURABAYA"         Bukan standar list

PRODUCT_CATEGORY      EMPTY              ""                 Tidak ada kategori

Quantity              EMPTY              ""                 Tidak ada jumlah
                      NOT NUMBER         "lima", "5 pcs"    Harus angka murni
                      NEGATIVE           "0", "-5"          Harus > 0
                      FLOAT              "5.5", "10.75"     Harus integer

General               COLUMNS MISSING    "Quantity"         Kolom wajib hilang
                      TOO SMALL (⚠️)     50 rows            Minimal 100
                      PRODUCTS (⚠️)      2 categories       Minimal 3
                      REGIONS (⚠️)       1 region           Minimal 2
```

---

## 🎨 UI APPEARANCE

### Error Display
```
┌─────────────────────────────────────────────────────────────┐
│  🔴 ❌ Data tidak valid: 5 kesalahan ditemukan              │
│     Lihat detail di bawah.                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📍 Detail Kesalahan (5)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  [Quantity]                                           │ │
│  │  Baris 5                     Value: 5.5               │ │
│  │  ❌ Quantity harus berupa angka bulat (tidak ada      │ │
│  │     desimal)                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  [InvoiceDate]                                        │ │
│  │  Baris 8                     Value: 01-15-2024        │ │
│  │  ❌ Format tanggal salah. Gunakan YYYY-MM-DD atau    │ │
│  │     DD/MM/YYYY                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (3 kesalahan lainnya)                                  │
│                                                             │
│  📊 Statistik: 45 dari 50 baris valid                       │
└─────────────────────────────────────────────────────────────┘
```

### Warning Display
```
┌─────────────────────────────────────────────────────────────┐
│  🟡 ⚠️  Peringatan (2)                                       │
├─────────────────────────────────────────────────────────────┤
│  • Hanya 50 transaksi ditemukan. Minimal 100 disarankan     │
│    untuk analisis yang optimal.                             │
│                                                             │
│  • Hanya 1 wilayah ditemukan. Analisis per-wilayah          │
│    membutuhkan data dari beberapa wilayah.                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 VALIDATION FLOW

```
USER UPLOAD FILE
       ↓
   [FILE VALIDATION]
   ├─ Format (.csv/.xlsx/.xls)  → ERROR?
   ├─ Size (not 0, < 50MB)       → ERROR?
   └─ Parse CSV                  → ERROR?
       ↓
   [STRUCTURE VALIDATION]
   ├─ Has header + 1 row         → ERROR?
   └─ Has required columns       → ERROR?
       ↓
   [DATA VALIDATION] (per row)
   ├─ InvoiceNo (not empty)      → ERROR?
   ├─ InvoiceNo (unique)         → ERROR?
   ├─ InvoiceDate (not empty)    → ERROR?
   ├─ InvoiceDate (format)       → ERROR?
   ├─ InvoiceDate (valid)        → ERROR?
   ├─ PULAU (not empty)          → ERROR?
   ├─ PULAU (standard?)          → WARNING
   ├─ PRODUCT_CATEGORY (not empty) → ERROR?
   ├─ Quantity (not empty)       → ERROR?
   ├─ Quantity (number)          → ERROR?
   ├─ Quantity (positive)        → ERROR?
   └─ Quantity (integer)         → ERROR?
       ↓
   [GENERAL STATS]
   ├─ Data >= 100?               → WARNING if not
   ├─ Products >= 3?             → WARNING if not
   └─ Regions >= 2?              → WARNING if not
       ↓
       ├─ HAS ERRORS?
       │  → SHOW ERROR DETAILS
       │  → STOP
       │
       └─ ONLY WARNINGS?
          → SHOW WARNINGS
          → CONTINUE TO API
```

---

## ✅ CHECKLIST - All Implemented

```
☑️  File validation (3 types)
☑️  Structure validation (2 types)
☑️  InvoiceNo validation (2 types)
☑️  InvoiceDate validation (3 types)
☑️  PULAU validation (1 error + 1 warning)
☑️  PRODUCT_CATEGORY validation (1 type)
☑️  Quantity validation (4 types)
☑️  General statistics validation (3 warnings)
☑️  Error collection & reporting
☑️  UI for errors (scrollable, paginated)
☑️  UI for warnings
☑️  Localization (Bahasa Indonesia)
☑️  Integration in Setup.tsx
☑️  Documentation (4 files)
```

---

## 📊 STATISTICS

- **Total Exceptions:** 20
- **Errors (🔴):** 17
- **Warnings (🟡):** 3
- **Fields Validated:** 5
- **Levels of Validation:** 3
- **UI Components:** 2 (errors + warnings)
- **Documentation Files:** 4

---

## 🚀 USAGE

### User Perspective
1. Upload file → Auto-validate
2. See errors → Fix in spreadsheet
3. Re-upload → Try again
4. Success → Data processed

### Developer Perspective
1. All messages in Indonesian
2. Easily extensible (add new rules to `validateDataStructure()`)
3. Comprehensive error details per field/row
4. Good UX (scrollable, summarized, color-coded)

---

## 📚 DOCUMENTATION FILES

```
1. README_VALIDATION.md
   ├─ Ringkasan singkat
   ├─ Statistik exceptions
   ├─ Flowchart sederhana
   └─ Quick checklist

2. VALIDATION_EXCEPTIONS.md
   ├─ Setiap exception detail
   ├─ Kapan terjadi
   ├─ Solusi user
   └─ Best practices

3. EXCEPTION_SUMMARY.md
   ├─ Visual matrix
   ├─ Flow diagram
   ├─ Use case examples
   └─ UI reference

4. IMPLEMENTATION_GUIDE.md
   ├─ Arsitektur lengkap
   ├─ Code walkthrough
   ├─ Testing guide
   └─ Troubleshooting

5. DATA_VALIDATION_SUMMARY.md
   ├─ Executive summary
   ├─ Implementation checklist
   ├─ Test cases
   └─ Future improvements

6. THIS FILE - Exception Visual Guide
   ├─ Tree structure
   ├─ Matrix layout
   ├─ Flow diagrams
   └─ Quick reference visuals
```

---

**Version:** 1.0  
**Status:** ✅ COMPLETE  
**Date:** December 14, 2025  
**Language:** Bahasa Indonesia

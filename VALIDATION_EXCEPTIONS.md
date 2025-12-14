# 📋 Data Validation Exceptions Documentation

Dokumentasi lengkap tentang semua exception dan validasi yang diterapkan pada sistem upload data DataNiaga.

---

## 🔍 Overview

Sistem validasi terdiri dari 3 level:

1. **File Validation** - Cek format dan ukuran file
2. **Structure Validation** - Cek kolom dan header
3. **Data Validation** - Cek nilai di setiap row

---

## 1️⃣ FILE VALIDATION EXCEPTIONS

### Exception: Format File Tidak Didukung
**Error Message:** `❌ Format file tidak didukung. Gunakan CSV atau Excel (.csv, .xlsx, .xls)`

**Kapan Terjadi:**
- User upload file dengan extension selain `.csv`, `.xlsx`, atau `.xls`

**Contoh:**
- ❌ `data.txt`
- ❌ `data.pdf`
- ❌ `data.json`
- ✅ `data.csv`
- ✅ `data.xlsx`

**Solusi User:**
1. Buka file di Excel
2. Save As → CSV atau Excel format
3. Upload ulang file

---

### Exception: File Kosong
**Error Message:** `❌ File kosong. Pastikan file memiliki data.`

**Kapan Terjadi:**
- User upload file dengan ukuran 0 byte

**Solusi User:**
- Pastikan file memiliki data sebelum upload
- Jangan upload file yang belum disimpan atau template kosong

---

### Exception: File Terlalu Besar
**Error Message:** `❌ File terlalu besar (max 50MB). Perpecil file Anda.`

**Kapan Terjadi:**
- File size > 50 MB

**Solusi User:**
1. Pecah data menjadi beberapa file lebih kecil
2. Filter data yang tidak diperlukan
3. Hapus kolom yang tidak dibutuhkan
4. Compress file jika memungkinkan

---

## 2️⃣ STRUCTURE VALIDATION EXCEPTIONS

### Exception: Kolom Wajib Tidak Ditemukan
**Error Message:** `❌ Kolom wajib tidak ditemukan: [field names]`

**Kapan Terjadi:**
- File tidak memiliki salah satu atau lebih kolom yang diperlukan
- Nama kolom tidak sesuai (case-sensitive)

**Required Columns:**
- `InvoiceNo`
- `InvoiceDate`
- `PULAU`
- `PRODUCT_CATEGORY`
- `Quantity`

**Contoh Error:**
```
❌ Kolom wajib tidak ditemukan: PRODUCT_CATEGORY, Quantity
```

**Solusi User:**
1. Buka file di Excel
2. Pastikan kolom header nama persis sesuai:
   - `InvoiceNo` (bukan `invoice_no`, `Invoice_Number`, dll)
   - `InvoiceDate` (bukan `tanggal`, `date`, dll)
   - `PULAU` (bukan `region`, `area`, dll)
   - `PRODUCT_CATEGORY` (bukan `product`, `kategori`, dll)
   - `Quantity` (bukan `qty`, `jumlah`, dll)
3. Upload ulang

---

### Exception: File Terlalu Pendek
**Error Message:** `❌ File terlalu pendek. Minimal perlu header + 1 baris data`

**Kapan Terjadi:**
- File hanya memiliki header tanpa data transaksi
- File kurang dari 2 baris

**Solusi User:**
- Tambahkan minimal 1 baris data transaksi
- Lebih baik lagi, tambahkan 100+ baris untuk analisis optimal

---

## 3️⃣ DATA VALIDATION EXCEPTIONS

### 🔴 Error-Level Validations (Blocking)

#### A. InvoiceNo Validation

**Exception A1: Nomor Faktur Kosong**
- **Error Message:** `Nomor faktur tidak boleh kosong`
- **Row:** Baris X
- **Value:** `(kosong)`
- **Penyebab:** Kolom `InvoiceNo` tidak diisi atau blank
- **Solusi:** Isi nomor faktur untuk setiap transaksi (contoh: INV-001, 001, A12345)

**Exception A2: Nomor Faktur Duplikat**
- **Error Message:** `Nomor faktur duplikat (sudah ada sebelumnya)`
- **Row:** Baris X
- **Value:** `INV-123`
- **Penyebab:** Nomor faktur sudah muncul di baris sebelumnya
- **Solusi:** Gunakan nomor faktur yang unik untuk setiap transaksi atau tambahkan timestamp

---

#### B. InvoiceDate Validation

**Exception B1: Tanggal Kosong**
- **Error Message:** `Tanggal faktur tidak boleh kosong`
- **Row:** Baris X
- **Value:** `(kosong)`
- **Penyebab:** Kolom `InvoiceDate` tidak diisi
- **Solusi:** Isi tanggal transaksi

**Exception B2: Format Tanggal Salah**
- **Error Message:** `Format tanggal salah. Gunakan YYYY-MM-DD atau DD/MM/YYYY`
- **Row:** Baris X
- **Value:** `01-12-2024` atau `2024/01/12` atau `Januari 12, 2024`
- **Penyebab:** Format tidak sesuai
- **Format Valid:**
  - ✅ `2024-01-15` (ISO Format)
  - ✅ `15/01/2024` (European Format)
- **Format Tidak Valid:**
  - ❌ `01-12-2024` (ambiguous)
  - ❌ `2024/01/15` (slash, bukan dash)
  - ❌ `Januari 15, 2024` (kata-kata)
  - ❌ `15.01.2024` (dot separator)

**Exception B3: Tanggal Tidak Valid**
- **Error Message:** `Tanggal tidak valid (periksa hari/bulan/tahun)`
- **Row:** Baris X
- **Value:** `2024-13-45` atau `2024-02-31`
- **Penyebab:** Kombinasi hari/bulan/tahun tidak valid
- **Contoh Invalid:**
  - ❌ `2024-02-30` (Februari hanya 29 hari di 2024)
  - ❌ `2024-13-01` (tidak ada bulan 13)
  - ❌ `2024-01-32` (Januari hanya 31 hari)
  - ❌ `0000-00-00` (tanggal null)

**Solusi General B:**
- Di Excel, format kolom sebagai Date sebelum save
- Pastikan menggunakan format yang konsisten di seluruh file
- Gunakan tool seperti `=TEXT(today(),"YYYY-MM-DD")` untuk generate date

---

#### C. PULAU Validation

**Exception C1: PULAU Kosong**
- **Error Message:** `Nama wilayah/pulau tidak boleh kosong`
- **Row:** Baris X
- **Value:** `(kosong)`
- **Penyebab:** Kolom `PULAU` tidak diisi
- **Solusi:** Isi nama wilayah untuk setiap transaksi

**Exception C2: PULAU Tidak Standar (⚠️ Warning, bukan error)**
- **Warning Message:** `⚠️ Baris X: Wilayah "SURABAYA" tidak standar. Contoh: JAWA, BALI, SUMATERA`
- **Row:** Baris X
- **Value:** `SURABAYA` atau `surabaya` atau `Jawa Timur`
- **Penyebab:** Nama wilayah tidak sesuai standar
- **Standar PULAU yang Dikenali:**
  - ✅ `JAWA`
  - ✅ `SUMATERA`
  - ✅ `BALI`
  - ✅ `KALIMANTAN`
  - ✅ `SULAWESI`
  - ✅ `PAPUA`
  - ✅ `NTT` (Nusa Tenggara Timur)
  - ✅ `NTB` (Nusa Tenggara Barat)

**Solusi C:**
- Gunakan nama pulau besar, bukan kota/provinsi
- Normalize data: petakan `Surabaya` → `JAWA`, `Denpasar` → `BALI`, dll

---

#### D. PRODUCT_CATEGORY Validation

**Exception D1: PRODUCT_CATEGORY Kosong**
- **Error Message:** `Kategori produk tidak boleh kosong`
- **Row:** Baris X
- **Value:** `(kosong)`
- **Penyebab:** Kolom `PRODUCT_CATEGORY` tidak diisi
- **Solusi:** Isi kategori produk untuk setiap transaksi

**Solusi D:**
- Tentukan list kategori produk yang valid di perusahaan
- Konsisten dalam naming (contoh: selalu "Susu", bukan "susu", "SUSU", "Milk")
- Hindari typo dalam kategori

---

#### E. Quantity Validation

**Exception E1: Quantity Kosong**
- **Error Message:** `Jumlah produk tidak boleh kosong`
- **Row:** Baris X
- **Value:** `(kosong)`
- **Penyebab:** Kolom `Quantity` tidak diisi
- **Solusi:** Isi jumlah produk

**Exception E2: Quantity Bukan Angka**
- **Error Message:** `Quantity harus berupa angka`
- **Row:** Baris X
- **Value:** `lima` atau `5 pcs` atau `5,5` (dengan koma)
- **Penyebab:** Nilai tidak berupa angka numerik
- **Contoh Invalid:**
  - ❌ `lima` (kata-kata)
  - ❌ `5 pcs` (dengan unit)
  - ❌ `5 pcs` (dengan teks)
  - ❌ `Rp 50.000` (currency)

**Exception E3: Quantity Nol atau Negatif**
- **Error Message:** `Quantity harus lebih besar dari 0`
- **Row:** Baris X
- **Value:** `0` atau `-5`
- **Penyebab:** Jumlah tidak boleh 0 atau negatif
- **Solusi:** Gunakan angka positif > 0

**Exception E4: Quantity Bukan Angka Bulat**
- **Error Message:** `Quantity harus berupa angka bulat (tidak ada desimal)`
- **Row:** Baris X
- **Value:** `5.5` atau `10.75`
- **Penyebab:** Quantity harus integer (satuan unit)
- **Solusi:** Bulatkan ke atas atau bawah (5 atau 6, bukan 5.5)

**Solusi E:**
- Di Excel gunakan format Number (bukan Text)
- Jika ada desimal, round ke integer terdekat
- Pastikan tanpa unit atau simbol

---

## ⚠️ WARNING LEVEL VALIDATIONS

Warnings tidak memblokir proses, tapi memberikan rekomendasi.

### Warning W1: Data Transaksi Terlalu Sedikit
- **Message:** `⚠️ Hanya 45 transaksi ditemukan. Minimal 100 disarankan untuk analisis optimal.`
- **Kapan:** Total row < 100
- **Rekomendasi:** Tambahkan minimal 100 transaksi untuk hasil forecast yang lebih akurat

### Warning W2: Kategori Produk Terlalu Sedikit
- **Message:** `⚠️ Hanya 2 kategori produk ditemukan. Lebih banyak kategori = analisis lebih baik.`
- **Kapan:** Unique product categories < 3
- **Rekomendasi:** Tambahkan data dari lebih banyak kategori produk untuk MBA rules yang lebih baik

### Warning W3: Wilayah Terlalu Sedikit
- **Message:** `⚠️ Hanya 1 wilayah ditemukan. Analisis per-wilayah membutuhkan data dari beberapa wilayah.`
- **Kapan:** Unique pulau < 2
- **Rekomendasi:** Tambahkan data transaksi dari 2+ wilayah untuk analisis regional

---

## 📊 Validation Statistics

Setelah validation, user akan melihat:

```
✅ Statistik: 450 dari 500 baris valid
⚠️ 50 baris berisi error
```

- **Valid Rows:** Baris yang lulus semua validasi dan akan diproses
- **Total Rows:** Total baris data (exclude header)

---

## 🎯 Error Display Features

### 1. Error List dengan Pagination
- Menampilkan max 20 error pertama
- Jika > 20, akan ditampilkan "... dan X kesalahan lainnya"
- Scrollable container untuk melihat lebih banyak error

### 2. Detail Setiap Error
Untuk setiap error ditampilkan:
- **Field Name:** Nama kolom yang error (InvoiceNo, InvoiceDate, dll)
- **Row Number:** Nomor baris di file (1-based, including header)
- **Current Value:** Nilai yang dikirim user
- **Error Reason:** Penjelasan mengapa error

### 3. Warna-Coding
- 🔴 **Red** untuk errors (memblokir proses)
- 🟡 **Yellow** untuk warnings (informasi saja)

---

## 💡 Best Practices for Users

### 1. Format File
```
✅ CSV Format:
InvoiceNo,InvoiceDate,PULAU,PRODUCT_CATEGORY,Quantity
INV-001,2024-01-15,JAWA,Susu,5
INV-002,2024-01-15,BALI,Roti,3
INV-003,2024-01-16,SUMATERA,Kacang Tanah,10
```

### 2. Data Quality Checklist
- [ ] File format: CSV atau Excel
- [ ] Header kolom: Persis `InvoiceNo`, `InvoiceDate`, `PULAU`, `PRODUCT_CATEGORY`, `Quantity`
- [ ] Minimal 100 transaksi
- [ ] Tanggal: Format YYYY-MM-DD atau DD/MM/YYYY
- [ ] Quantity: Angka bulat positif
- [ ] PULAU: Nama pulau standard (JAWA, BALI, SUMATERA, dll)
- [ ] InvoiceNo: Unik untuk setiap baris

### 3. Troubleshooting Flow

```
User upload file
    ↓
File validation (format, size)
    ├─ FAIL → Show file error
    └─ PASS ↓
Data structure validation (columns)
    ├─ FAIL → Show missing columns
    └─ PASS ↓
Data value validation (each row)
    ├─ FAIL → Show error details
    └─ PASS ↓
Show warnings (if any)
    ↓
SUCCESS → Process data
```

---

## 🔧 Technical Implementation

### Validation Functions in `Setup.tsx`

1. **`validateFile(file: File): boolean`**
   - Check extension
   - Check file size
   - Check empty file

2. **`parseCSV(text: string): Record<string, string>[]`**
   - Parse CSV content
   - Extract header and data rows

3. **`validateDataStructure(data): DataValidationResult`**
   - Check required columns
   - Validate each field in each row
   - Generate error and warning list
   - Calculate statistics

### Error Collection Strategy
- Errors collected untuk ALL rows
- Max 20 ditampilkan, dengan counter untuk rest
- Scrollable container untuk UX yang lebih baik
- User dapat lihat pattern dari errors

---

## 📝 Notes

- Semua validation dilakukan di **frontend** sebelum API call
- Ini memberikan feedback instant kepada user
- User bisa fix data dan retry tanpa waiting
- Backend juga mungkin melakukan validation tambahan
- Fokus pada user experience: error messages yang jelas dan actionable

---

Generated: December 14, 2025

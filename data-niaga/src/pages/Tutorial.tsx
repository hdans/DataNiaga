import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Upload, 
  BarChart3, 
  TrendingUp, 
  Package2, 
  Gift, 
  Store, 
  CheckCircle2,
  Settings as SettingsIcon,
  Home,
  PlayCircle
} from 'lucide-react';
import videoTutorial from '@/assets/video.mp4';

export default function Tutorial() {
  const [videoOpen, setVideoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">DataNiaga Tutorial</span>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        {/* Intro */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Panduan Lengkap DataNiaga
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Ikuti langkah demi langkah untuk memaksimalkan Decision Support System berbasis AI
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setVideoOpen(true)}
          >
            <PlayCircle className="w-5 h-5" />
            Tonton Video Tutorial
          </Button>
        </div>

        {/* Video Modal */}
        <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-2 border-primary/20">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-2xl font-bold">Video Tutorial DataNiaga</DialogTitle>
              <DialogDescription>
                Panduan lengkap penggunaan sistem dari awal hingga akhir
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full aspect-video bg-black">
              <video 
                controls 
                className="w-full h-full"
                autoPlay
              >
                <source src={videoTutorial} type="video/mp4" />
                Browser Anda tidak mendukung pemutaran video.
              </video>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tutorial Steps */}
        <div className="space-y-8">
          {/* Step 1: Setup */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">1. Setup & Upload Data</CardTitle>
                  <p className="text-sm text-muted-foreground">Memulai sistem dengan data transaksi Anda</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Setup</strong> adalah titik awal Anda. Di sini Anda akan:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Mengisi informasi profil (nama, role, perusahaan)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Upload file CSV/Excel dengan data transaksi historis (minimal 3 bulan)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Sistem otomatis memproses data dan melatih model AI (forecasting + MBA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Setelah selesai, Anda diarahkan ke Dashboard utama</span>
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Format Data:</strong> Pastikan file Anda memiliki kolom: TANGGAL, PULAU, KATEGORI_PRODUK, KUANTITAS_TERJUAL
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Dashboard */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">2. Dashboard Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Ringkasan performa dan insight bisnis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                <strong>Dashboard</strong> menampilkan ringkasan kinerja sistem secara keseluruhan:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Metric Cards:</strong> Akurasi model forecasting, jumlah produk, pulau, dan rekomendasi aktif</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Island Selector:</strong> Filter data berdasarkan wilayah (Kalimantan, Sulawesi, dll)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Forecast Chart:</strong> Grafik prediksi 10 minggu mendatang per kategori produk</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Rekomendasi:</strong> 3-5 aksi prioritas untuk meningkatkan penjualan</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Step 3: Forecasts */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">3. Halaman Forecasts</CardTitle>
                  <p className="text-sm text-muted-foreground">Prediksi penjualan detail per produk</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Forecasts</strong> memberikan prediksi mendalam:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tabel forecast 10 minggu ke depan per kategori produk dan pulau</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Perbandingan data aktual vs prediksi (minggu historis)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Filter berdasarkan pulau untuk analisis regional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Export data ke CSV untuk analisis lanjutan</span>
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Insight:</strong> Gunakan forecast untuk merencanakan stok 2-3 minggu ke depan dan hindari stockout
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Inventory */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">4. Inventory Management</CardTitle>
                  <p className="text-sm text-muted-foreground">Manajemen stok cerdas berbasis AI</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Inventory</strong> membantu mengelola stok optimal:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Rekomendasi stocking: produk mana yang perlu ditambah atau dikurangi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Alert produk dengan risiko stockout tinggi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Identifikasi dead stock (produk dengan forecast rendah)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Saran bundling untuk menggerakkan slow-moving items</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Step 5: Promo */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">5. Promo Strategy</CardTitle>
                  <p className="text-sm text-muted-foreground">Strategi promosi berbasis Market Basket Analysis</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Promo</strong> menggunakan MBA untuk strategi bundling:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tabel MBA Rules: produk yang sering dibeli bersamaan (lift, confidence, support)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Saran bundling otomatis (contoh: "Beli Kacang Tanah + Daun Pisang diskon 10%")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Filter berdasarkan pulau untuk promosi regional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Peluang cross-selling untuk meningkatkan average transaction value</span>
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Contoh:</strong> Jika Kacang Tanah → Daun Pisang memiliki lift 3.5, artinya pelanggan yang beli kacang tanah 3.5x lebih mungkin beli daun pisang. Buat bundling!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 6: Store Layout */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">6. Store Layout Optimization</CardTitle>
                  <p className="text-sm text-muted-foreground">Tata letak toko berdasarkan asosiasi produk</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Store Layout</strong> memberikan rekomendasi penempatan produk:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Produk yang harus didekatkan (high-affinity pairs dari MBA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Zona Hot/Warm/Cold berdasarkan volume penjualan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Saran produk anchor (produk dengan traffic tinggi) untuk area strategis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Visual heatmap untuk planning layout fisik toko</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Step 7: Quality */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">7. Model Quality & Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground">Evaluasi akurasi model forecasting</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Quality</strong> menampilkan metrik evaluasi model:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>MAE (Mean Absolute Error):</strong> rata-rata selisih prediksi vs aktual</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>MAPE (Mean Absolute Percentage Error):</strong> akurasi dalam persen</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Rating kualitas per produk: Excellent ({"<"}5% error), Good (5-10%), Fair (10-20%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Filter per pulau dan kategori produk untuk analisis detail</span>
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Model berkualitas baik memiliki MAPE {"<"}15%. Jika lebih tinggi, coba upload data lebih banyak atau periksa kualitas data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 8: Settings */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">8. Settings & Data Management</CardTitle>
                  <p className="text-sm text-muted-foreground">Konfigurasi sistem dan manajemen data</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">
                Halaman <strong>Settings</strong> untuk konfigurasi dan maintenance:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>System Info:</strong> lihat kapan terakhir training, jumlah data, akurasi model</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Export Data:</strong> download semua forecast dalam format CSV</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Import New Data:</strong> upload data baru untuk re-training model</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Kembali ke Landing:</strong> logout dan reset sistem</span>
                </li>
              </ul>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Best Practice:</strong> Update data setiap bulan untuk menjaga akurasi prediksi tetap optimal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-primary/5 rounded-xl p-8 border border-primary/20">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Siap Memulai?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sekarang Anda memahami semua fitur DataNiaga. Upload data Anda dan mulai optimalkan bisnis ritel dengan AI!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/setup">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Mulai Setup
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                Kembali ke Landing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-12">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 DataNiaga. Decision Support System untuk Ritel di Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Brain, Lightbulb, ArrowRight, BarChart3, Package, TrendingUp, Store } from 'lucide-react';
import danishPhoto from '@/assets/danish.webp';
import upiPhoto from '@/assets/upi.webp';
import athallahPhoto from '@/assets/athallah.webp';

// Simple Intersection Observer hook to animate on scroll
function useReveal(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('opacity-0', 'translate-y-6');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.remove('opacity-0', 'translate-y-6');
            el.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px', ...(options || {}) }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options]);
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  useReveal(heroRef);
  useReveal(aboutRef);
  useReveal(howRef);
  useReveal(ctaRef);
  useReveal(teamRef);
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden h-screen w-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <nav className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">DataNiaga</span>
          </div>
          <Link to="/setup">
            <Button variant="outline" size="sm">
              Mulai Sekarang
            </Button>
          </Link>
        </nav>
        
        <div ref={heroRef} className="transition-all duration-700 relative z-10 flex-1 w-full flex items-center">
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              Dukungan Keputusan Bertenaga AI
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              DataNiaga: Intelijen Ritel{' '}
              <span className="text-primary">Bertenaga AI</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Optimalkan Stok, Promosi, dan Tata Letak Toko dengan Pembelajaran Mesin. 
              Ubah data transaksi Anda menjadi wawasan bisnis yang dapat ditindaklanjuti.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/setup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Mulai Analisis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/tutorial">
                <Button variant="outline" size="lg" className="gap-2">
                  Tonton Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div ref={aboutRef} className="transition-all duration-700 container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Apa itu DataNiaga?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sistem Pendukung Keputusan yang dirancang untuk membantu manajer ritel membuat 
              keputusan berbasis data menggunakan peramalan canggih dan analisis keranjang pasar.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Peramalan Penjualan</h3>
                <p className="text-sm text-muted-foreground">
                  Prediksi bertenaga LightGBM untuk 10 minggu ke depan, tersegmentasi berdasarkan wilayah dan kategori produk.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analisis Keranjang Pasar</h3>
                <p className="text-sm text-muted-foreground">
                  Algoritma FP-Growth mengidentifikasi asosiasi produk untuk bundling dan cross-selling yang lebih cerdas.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Optimasi Toko</h3>
                <p className="text-sm text-muted-foreground">
                  Rekomendasi berbasis data untuk penempatan produk dan strategi promosi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section className="py-16 md:py-20">
        <div ref={howRef} className="transition-all duration-700 container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Bagaimana Cara Kerjanya
            </h2>
            <p className="text-muted-foreground">
              Tiga langkah sederhana untuk mengubah data Anda menjadi wawasan
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    1
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Unggah Data Anda</h3>
                  <p className="text-sm text-muted-foreground">
                    Unggah data transaksi Anda dalam format CSV atau Excel dengan riwayat penjualan.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              </div>
              
              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    2
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">AI Menganalisis Pola</h3>
                  <p className="text-sm text-muted-foreground">
                    Model ML kami mendeteksi tren, pola, dan asosiasi produk secara otomatis.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              </div>
              
              {/* Step 3 */}
              <div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    3
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lightbulb className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Dapatkan Rekomendasi</h3>
                  <p className="text-sm text-muted-foreground">
                    Terima wawasan yang dapat ditindaklanjuti untuk inventori, promosi, dan tata letak toko.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary">
        <div ref={ctaRef} className="transition-all duration-700 container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Siap Mengoptimalkan Operasi Ritel Anda?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Unggah data transaksi Anda dan dapatkan rekomendasi bertenaga AI dalam hitungan menit.
          </p>
          <Link to="/setup">
            <Button size="lg" variant="secondary" className="gap-2">
              Mulai Analisis Sekarang
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Developers Section */}
      <section className="py-16 md:py-20">
        <div ref={teamRef} className="transition-all duration-700 container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Tim Pengembang</h2>
            <p className="text-muted-foreground">3 developer yang membangun DataNiaga</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Dev 1 */}
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage className="object-cover" src={danishPhoto} alt="Danish Rahadian" />
                  <AvatarFallback>DN</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">Danish Rahadian</h3>
                  <p className="text-sm text-muted-foreground">DevOps & ML Engineer</p>
                </div>
              </CardContent>
            </Card>
            {/* Dev 2 */}
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage className="object-cover" src={upiPhoto} alt="Upi" />
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">Luthfi Aziz</h3>
                  <p className="text-sm text-muted-foreground">FullStack Developer</p>
                </div>
              </CardContent>
            </Card>
            {/* Dev 3 */}
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage className="object-cover" src={athallahPhoto} alt="Athallah" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">Athallah Azhar</h3>
                  <p className="text-sm text-muted-foreground">FullStack Developer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 DataNiaga. Decision Support System untuk Ritel di Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings as SettingsIcon, 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  Home,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDashboardSummary, useUploadData, useTrainingMetadata } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

type ImportStep = 'idle' | 'uploading' | 'validating' | 'processing' | 'complete' | 'error';

export default function Settings() {
  const navigate = useNavigate();
  const { data: summary } = useDashboardSummary();
  const { data: trainingMetadata } = useTrainingMetadata();
  const uploadMutation = useUploadData();
  const [isExporting, setIsExporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Check backend connectivity on mount
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health');
        if (response.ok) {
          console.log('✓ Backend is connected');
        }
      } catch (error) {
        console.error('✗ Backend connection failed:', error);
      }
    };
    checkBackend();
  }, []);

  const lastTrainedDate = trainingMetadata?.last_trained 
    ? new Date(trainingMetadata.last_trained)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://localhost:8000/api/forecast');
      if (!response.ok) throw new Error('Failed to fetch forecast data');
      
      const payload = await response.json();
      
      // Handle both old array format and new { forecast_data, model_metrics } format
      const forecasts = Array.isArray(payload) ? payload : (payload.forecast_data || []);
      
      if (!forecasts || forecasts.length === 0) {
        toast({
          title: 'Data Kosong',
          description: 'Tidak ada data prakiraan untuk diekspor. Silakan import data terlebih dahulu.',
          variant: 'destructive',
        });
        setIsExporting(false);
        return;
      }
      
      const csv = convertForecastsToCSV(forecasts);
      downloadCSV(csv, `forecast-export-${new Date().toISOString().split('T')[0]}.csv`);
      
      toast({
        title: 'Ekspor Berhasil',
        description: `${forecasts.length} baris data telah diunduh.`,
      });
    } catch (error) {
      toast({
        title: 'Gagal Ekspor',
        description: 'Terjadi kesalahan saat mengekspor data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      await processImportedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      await processImportedFile(e.target.files[0]);
    }
  };

  const processImportedFile = async (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      toast({
        title: 'Format File Tidak Didukung',
        description: 'Silakan upload file CSV atau Excel (.csv, .xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setImportStep('uploading');
    setImportProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + Math.random() * 25, 85));
      }, 300);

      setImportStep('validating');
      await new Promise(r => setTimeout(r, 500));
      
      setImportStep('processing');
      const result = await uploadMutation.mutateAsync(file);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStep('complete');

      toast({
        title: 'Impor Berhasil! ✓',
        description: `${result?.records || 'Data'} baris telah diproses. Mengalihkan ke dashboard...`,
      });

      // Navigate to dashboard after 1.5 seconds
      setTimeout(() => {
        setImportStep('idle');
        setImportProgress(0);
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      setImportStep('error');
      
      // Extract meaningful error message from response
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          'Terjadi kesalahan saat mengimpor data.';
      
      console.error('Import error details:', error);
      
      toast({
        title: 'Gagal Impor ✗',
        description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage,
        variant: 'destructive',
      });
      
      setTimeout(() => {
        setImportStep('idle');
        setImportProgress(0);
      }, 3000);
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const getErrorMessage = (): string => {
    if (importStep === 'error') {
      return 'Silakan tunggu sambil kami menganalisis data Anda...';
    }
    return '';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi aplikasi DSS Ritel Anda
          </p>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Versi Model</p>
                <p className="font-semibold">LightGBM v4.0.0 (Regresi Tweedie)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pelatihan Terakhir</p>
                <p className="font-semibold">{lastTrainedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produk</p>
                <p className="font-semibold">{summary?.total_products ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wilayah</p>
                <p className="font-semibold">{summary?.total_islands ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Akurasi Prakiraan</p>
                <p className="font-semibold">{summary?.forecast_accuracy?.toFixed(1) ?? 'N/A'}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-success/10 text-success border-success/30 flex w-fit">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Aktif
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Konfigurasi Model
            </CardTitle>
            <CardDescription>
              Parameter model peramalan saat ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
              <p><span className="text-muted-foreground">objective:</span> tweedie</p>
              <p><span className="text-muted-foreground">tweedie_variance_power:</span> 1.5</p>
              <p><span className="text-muted-foreground">n_estimators:</span> 1000</p>
              <p><span className="text-muted-foreground">learning_rate:</span> 0.05</p>
              <p><span className="text-muted-foreground">num_leaves:</span> 31</p>
              <p><span className="text-muted-foreground">look_back_weeks:</span> 4</p>
              <p><span className="text-muted-foreground">forecast_horizon:</span> 10 weeks</p>
            </div>
          </CardContent>
        </Card>

        {/* MBA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              Konfigurasi MBA
            </CardTitle>
            <CardDescription>
              Parameter Analisis Keranjang Pasar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
              <p><span className="text-muted-foreground">algorithm:</span> FP-Growth</p>
              <p><span className="text-muted-foreground">min_support:</span> 0.10</p>
              <p><span className="text-muted-foreground">min_lift:</span> 2.0</p>
              <p><span className="text-muted-foreground">min_confidence:</span> 0.40</p>
              <p><span className="text-muted-foreground">max_rules_per_region:</span> 60</p>
            </div>
          </CardContent>
        </Card>

        {/* Import Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Impor Data Baru
            </CardTitle>
            <CardDescription>
              Unggah file CSV atau Excel untuk memperbarui model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {importStep === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Pemrosesan Gagal</p>
                  <p className="text-sm mt-1">{getErrorMessage()}</p>
                  <p className="text-xs mt-2">Periksa format file Anda atau coba lagi dengan file berbeda.</p>
                </AlertDescription>
              </Alert>
            )}

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                importStep !== 'idle' && 'pointer-events-none opacity-60',
                dragActive && importStep === 'idle'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
            >
              <input
                type="file"
                id="import-file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={importStep !== 'idle'}
              />
              <label htmlFor="import-file" className="cursor-pointer block">
                {importStep === 'idle' ? (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Seret file di sini atau klik untuk memilih</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, atau XLS (maksimal 100MB)</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm font-medium">
                      {importStep === 'uploading' && 'Mengunggah file...'}
                      {importStep === 'validating' && 'Memvalidasi data...'}
                      {importStep === 'processing' && 'Memproses dan melatih model...'}
                      {importStep === 'complete' && '✓ Impor selesai!'}
                      {importStep === 'error' && '✗ Terjadi kesalahan'}
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Progress Bar */}
            {importStep !== 'idle' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Progres</span>
                  <span className="text-xs font-medium text-muted-foreground">{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      importStep === 'error' ? 'bg-destructive' : 'bg-primary'
                    )}
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    {importStep === 'uploading' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    )}
                    <span>Unggah file</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {importStep === 'validating' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : importStep === 'uploading' ? (
                      <div className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    )}
                    <span>Validasi data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {importStep === 'processing' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : importStep === 'complete' ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : importStep === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-destructive" />
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                    <span>Latih model</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tindakan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleExportData} 
              disabled={isExporting}
              className="w-full justify-start"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Ekspor Data Prakiraan
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToLanding} 
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Halaman Utama
            </Button>
          </CardContent>
        </Card>

        {/* Architecture Note */}
        <Card className="bg-accent/50 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Catatan Arsitektur</h3>
            <p className="text-xs text-muted-foreground">
              Frontend DSS ini dibangun dengan React + Vite + Tailwind CSS. Model peramalan 
              dan MBA (LightGBM, FP-Growth) berjalan sebagai pekerjaan Python terpisah yang mengisi 
              database. Frontend membaca hasil yang sudah dihitung sebelumnya untuk rendering dashboard yang cepat.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Backend API: <code className="bg-muted px-1 rounded">http://localhost:8000</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Helper: Convert forecast data to CSV format
function convertForecastsToCSV(forecasts: any[]): string {
  if (!Array.isArray(forecasts)) return '';

  const headers = ['Week', 'Pulau', 'Product Category', 'Actual', 'Predicted', 'Is Forecast'];
  const rows = forecasts.map((f) => [
    f.week || '',
    f.pulau || '',
    f.product_category || '',
    f.actual || '',
    f.predicted || '',
    f.is_forecast ? 'Yes' : 'No',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
}

// Helper: Trigger CSV download
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

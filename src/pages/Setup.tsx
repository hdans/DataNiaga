import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  BarChart3,
  Loader2,
  X,
  ChevronDown,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUploadData, useCreateUser } from '@/hooks/useApi';
import { toast } from 'sonner';

const REQUIRED_COLUMNS = ['InvoiceNo', 'InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity'];

interface UserInfo {
  name: string;
  role: string;
  company: string;
}

interface ValidationError {
  field: string;
  rowNumber: number;
  value: string;
  reason: string;
}

interface DataValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
  };
}

type ProcessingStep = 'idle' | 'uploading' | 'validating' | 'forecasting' | 'mba' | 'complete' | 'error';

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', role: '', company: '' });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  
  const uploadMutation = useUploadData();
  const createUserMutation = useCreateUser();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      setValidationError('❌ Format file tidak didukung. Gunakan CSV atau Excel (.csv, .xlsx, .xls)');
      return false;
    }
    
    if (file.size === 0) {
      setValidationError('❌ File kosong. Pastikan file memiliki data.');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setValidationError('❌ File terlalu besar (max 50MB). Perpecil file Anda.');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    
    // Count occurrences of potential delimiters
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    // Return the most likely delimiter
    if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    return ',';
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('File terlalu pendek. Minimal perlu header + 1 baris data');
    
    // Auto-detect delimiter
    const delimiter = detectDelimiter(text);
    
    // Parse header
    const headerValues = parseCSVLine(lines[0], delimiter);
    const header = headerValues.map(h => h.replace(/^"|"$/g, '')); // Remove surrounding quotes
    
    const data: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      const record: Record<string, string> = {};
      
      for (let j = 0; j < header.length; j++) {
        // Remove surrounding quotes if present
        let value = values[j] || '';
        value = value.replace(/^"|"$/g, '');
        record[header[j]] = value;
      }
      
      data.push(record);
    }
    
    return data;
  };

  const validateDataStructure = (data: Record<string, string>[]): DataValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let validRows = 0;

    // Check required columns exist
    if (data.length === 0) {
      return {
        isValid: false,
        errors: [{ field: 'general', rowNumber: 0, value: '', reason: 'Data kosong. Tidak ada baris transaksi ditemukan.' }],
        warnings: [],
        stats: { totalRows: 0, validRows: 0 }
      };
    }

    const firstRow = data[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return {
        isValid: false,
        errors: [{
          field: 'header',
          rowNumber: 1,
          value: missingColumns.join(', '),
          reason: `Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`
        }],
        warnings: [],
        stats: { totalRows: data.length, validRows: 0 }
      };
    }

    // Validate each row
    const pulauNames = new Set<string>();
    const productNames = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +1 for header, +1 for 1-based indexing
      let rowValid = true;

      // Validate InvoiceNo
      if (!row.InvoiceNo || row.InvoiceNo.trim() === '') {
        errors.push({
          field: 'InvoiceNo',
          rowNumber: rowNum,
          value: row.InvoiceNo || '(kosong)',
          reason: 'Nomor faktur tidak boleh kosong'
        });
        rowValid = false;
      }
      // Note: Allow duplicate InvoiceNo (multiple line items per invoice)

      // Validate InvoiceDate
      if (!row.InvoiceDate || row.InvoiceDate.trim() === '') {
        errors.push({
          field: 'InvoiceDate',
          rowNumber: rowNum,
          value: row.InvoiceDate || '(kosong)',
          reason: 'Tanggal faktur tidak boleh kosong'
        });
        rowValid = false;
      } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(row.InvoiceDate.trim())) {
          errors.push({
            field: 'InvoiceDate',
            rowNumber: rowNum,
            value: row.InvoiceDate,
            reason: 'Format tanggal salah. Gunakan YYYY-MM-DD atau DD/MM/YYYY'
          });
          rowValid = false;
        } else {
          // Try to parse date
          const date = new Date(row.InvoiceDate);
          if (isNaN(date.getTime())) {
            errors.push({
              field: 'InvoiceDate',
              rowNumber: rowNum,
              value: row.InvoiceDate,
              reason: 'Tanggal tidak valid (periksa hari/bulan/tahun)'
            });
            rowValid = false;
          }
        }
      }

      // Validate PULAU
      if (!row.PULAU || row.PULAU.trim() === '') {
        errors.push({
          field: 'PULAU',
          rowNumber: rowNum,
          value: row.PULAU || '(kosong)',
          reason: 'Nama wilayah/pulau tidak boleh kosong'
        });
        rowValid = false;
      } else {
        // Accept any format for PULAU (single or multiple regions)
        const pulauRaw = row.PULAU.trim();
        pulauNames.add(pulauRaw);
      }

      // Validate PRODUCT_CATEGORY
      if (!row.PRODUCT_CATEGORY || row.PRODUCT_CATEGORY.trim() === '') {
        errors.push({
          field: 'PRODUCT_CATEGORY',
          rowNumber: rowNum,
          value: row.PRODUCT_CATEGORY || '(kosong)',
          reason: 'Kategori produk tidak boleh kosong'
        });
        rowValid = false;
      } else {
        productNames.add(row.PRODUCT_CATEGORY);
      }

      // Validate Quantity
      if (!row.Quantity || row.Quantity.trim() === '') {
        errors.push({
          field: 'Quantity',
          rowNumber: rowNum,
          value: row.Quantity || '(kosong)',
          reason: 'Jumlah produk tidak boleh kosong'
        });
        rowValid = false;
      } else {
        const qty = parseFloat(row.Quantity);
        if (isNaN(qty)) {
          errors.push({
            field: 'Quantity',
            rowNumber: rowNum,
            value: row.Quantity,
            reason: 'Quantity harus berupa angka'
          });
          rowValid = false;
        } else if (qty <= 0) {
          errors.push({
            field: 'Quantity',
            rowNumber: rowNum,
            value: row.Quantity,
            reason: 'Quantity harus lebih besar dari 0'
          });
          rowValid = false;
        } else if (!Number.isInteger(qty)) {
          errors.push({
            field: 'Quantity',
            rowNumber: rowNum,
            value: row.Quantity,
            reason: 'Quantity harus berupa angka bulat (tidak ada desimal)'
          });
          rowValid = false;
        }
      }

      if (rowValid) validRows++;
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: { totalRows: data.length, validRows }
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setValidationError(null);
    setValidationResult(null);
    setShowValidationDetails(false);
  };

  const processData = async () => {
    if (!file) {
      setValidationError('Please upload a file first');
      return;
    }

    try {
      // Step 1: Upload file
      setProcessingStep('uploading');
      setProgress(10);
      
      // Step 2: Validating data structure
      setProcessingStep('validating');
      setProgress(20);
      
      let fileText: string;
      try {
        fileText = await file.text();
      } catch (fileReadError: any) {
        throw new Error(`Gagal membaca file: ${fileReadError.message}`);
      }

      let parsedData: Record<string, string>[];
      try {
        parsedData = parseCSV(fileText);
      } catch (parseError: any) {
        throw new Error(`Gagal parse CSV: ${parseError.message}`);
      }

      const validation = validateDataStructure(parsedData);
      setValidationResult(validation);

      if (!validation.isValid) {
        setShowValidationDetails(true);
        const errorCount = validation.errors.length;
        setValidationError(`❌ Data tidak valid: ${errorCount} kesalahan ditemukan. Lihat detail di bawah.`);
        toast.error(`Data validation failed: ${errorCount} errors found`);
        setProcessingStep('error');
        return;
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => toast.warning(w));
      }

      await new Promise(r => setTimeout(r, 300));
      
      // Step 3: Call API
      setProcessingStep('forecasting');
      setProgress(40);
      
      const result = await uploadMutation.mutateAsync(file);
      
      setProgress(70);
      setProcessingStep('mba');
      await new Promise(r => setTimeout(r, 500));
      
      // Step 4: Save user info
      setProgress(90);
      await createUserMutation.mutateAsync(userInfo);
      
      // Store user info in localStorage
      localStorage.setItem('dataniaga_user', JSON.stringify(userInfo));
      
      setProgress(100);
      setProcessingStep('complete');
      toast.success(`Data processed: ${result.records} records`);
      
      await new Promise(r => setTimeout(r, 800));
      navigate('/dashboard');
      
    } catch (error: any) {
      setProcessingStep('error');
      const message = error?.message || 'Failed to process data';
      setValidationError(`❌ ${message}`);
      toast.error(message);
    }
  };

  // Fallback: Simulate processing when API is unavailable
  const simulateProcessing = async () => {
    setProcessingStep('validating');
    setProgress(10);
    await new Promise(r => setTimeout(r, 800));
    
    setProgress(25);
    setProcessingStep('forecasting');
    await new Promise(r => setTimeout(r, 1500));
    
    setProgress(60);
    setProcessingStep('mba');
    await new Promise(r => setTimeout(r, 1200));
    
    setProgress(90);
    await new Promise(r => setTimeout(r, 500));
    
    setProgress(100);
    setProcessingStep('complete');
    await new Promise(r => setTimeout(r, 800));

    localStorage.setItem('dataniaga_user', JSON.stringify(userInfo));
    toast.success('Data processed (demo mode)');
    navigate('/dashboard');
  };

  const handleProcessData = async () => {
    if (!file) {
      setValidationError('Please upload a file first');
      return;
    }
    
    // Try real API first, fallback to simulation
    try {
      await processData();
    } catch {
      // If API fails, use simulation mode
      simulateProcessing();
    }
  };

  const canProceedStep1 = userInfo.name.trim() && userInfo.role.trim() && userInfo.company.trim();
  const canProceedStep2 = file !== null;

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'uploading': return 'Uploading file...';
      case 'validating': return 'Validating data columns...';
      case 'forecasting': return 'Training Model...';
      case 'mba': return 'Analyzing Market Basket (FP-Growth)...';
      case 'complete': return 'Analysis Complete!';
      case 'error': return 'Processing Failed';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Setup DataNiaga</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              1
            </div>
            <div className={cn("w-16 h-1 rounded", step >= 2 ? "bg-primary" : "bg-muted")} />
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>
        </div>

        {/* Step 1: Identity Form */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Ceritakan Tentang Anda</CardTitle>
              <CardDescription>
                Informasi ini membantu mempersonalisasi pengalaman dashboard Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama Anda"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Peran</Label>
                <Input
                  id="role"
                  placeholder="Misalnya, Manajer Toko, Analis"
                  value={userInfo.role}
                  onChange={(e) => setUserInfo({ ...userInfo, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Nama Perusahaan</Label>
                <Input
                  id="company"
                  placeholder="Masukkan nama perusahaan Anda"
                  value={userInfo.company}
                  onChange={(e) => setUserInfo({ ...userInfo, company: e.target.value })}
                />
              </div>
              <div className="pt-4">
                <Button 
                  className="w-full gap-2" 
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Lanjutkan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: File Upload */}
        {step === 2 && processingStep === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>Unggah Data Transaksi</CardTitle>
              <CardDescription>
                Unggah file data penjualan Anda untuk memulai analisis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Requirements */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">Kolom yang Diperlukan</h4>
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_COLUMNS.map((col) => (
                        <span key={col} className="px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-mono font-medium border border-primary/20">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details */}
                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-4 w-full">
                    <Info className="w-4 h-4" />
                    Lihat Panduan Detail Format Data
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform ml-auto",
                      isDetailsOpen && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 space-y-4 border border-border/50">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded font-semibold">InvoiceNo</span>
                            <p className="text-sm text-muted-foreground mt-2">Nomor faktur unik untuk setiap transaksi</p>
                            <p className="text-xs text-muted-foreground mt-1">Contoh: <code className="bg-muted px-1.5 py-0.5 rounded">INV-001</code>, <code className="bg-muted px-1.5 py-0.5 rounded">12345</code></p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded font-semibold">InvoiceDate</span>
                            <p className="text-sm text-muted-foreground mt-2">Tanggal transaksi</p>
                            <p className="text-xs text-muted-foreground mt-1">Format: <code className="bg-muted px-1.5 py-0.5 rounded">YYYY-MM-DD</code> atau <code className="bg-muted px-1.5 py-0.5 rounded">DD/MM/YYYY</code></p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded font-semibold">PULAU</span>
                            <p className="text-sm text-muted-foreground mt-2">Nama wilayah/pulau tempat transaksi</p>
                            <p className="text-xs text-muted-foreground mt-1">Contoh: <code className="bg-muted px-1.5 py-0.5 rounded">JAWA</code>, <code className="bg-muted px-1.5 py-0.5 rounded">BALI</code>, <code className="bg-muted px-1.5 py-0.5 rounded">SUMATERA</code></p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded font-semibold">PRODUCT_CATEGORY</span>
                            <p className="text-sm text-muted-foreground mt-2">Kategori produk yang dibeli</p>
                            <p className="text-xs text-muted-foreground mt-1">Contoh: <code className="bg-muted px-1.5 py-0.5 rounded">Susu</code>, <code className="bg-muted px-1.5 py-0.5 rounded">Roti</code>, <code className="bg-muted px-1.5 py-0.5 rounded">Kacang Tanah</code></p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded font-semibold">Quantity</span>
                            <p className="text-sm text-muted-foreground mt-2">Jumlah unit produk yang dibeli</p>
                            <p className="text-xs text-muted-foreground mt-1">Contoh: <code className="bg-muted px-1.5 py-0.5 rounded">5</code>, <code className="bg-muted px-1.5 py-0.5 rounded">10</code>, <code className="bg-muted px-1.5 py-0.5 rounded">2</code></p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mt-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">Tips:</span> File CSV/Excel Anda harus memiliki baris header dengan nama kolom di atas, diikuti dengan data transaksi. Minimal <span className="font-semibold text-foreground">100 transaksi</span> disarankan untuk analisis yang optimal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Upload Zone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-border",
                  file ? "border-primary/50 bg-primary/5" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!file ? (
                  <>
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-1">
                      Seret & lepas file Anda di sini
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      atau klik untuk telusuri
                    </p>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span>Telusuri File</span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Mendukung file CSV dan Excel (.csv, .xlsx, .xls)
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {/* Validation Details */}
              {validationResult && showValidationDetails && !validationResult.isValid && (
                <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Detail Kesalahan ({validationResult.errors.length})
                    </h4>
                    <button
                      onClick={() => setShowValidationDetails(!showValidationDetails)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showValidationDetails ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {validationResult.errors.slice(0, 20).map((error, idx) => (
                      <div key={idx} className="bg-background/50 rounded p-3 text-sm space-y-1 border border-destructive/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block mb-1">
                              {error.field}
                            </p>
                            <p className="text-foreground font-medium">Baris {error.rowNumber}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Value: <code className="bg-muted px-1 rounded">{error.value}</code>
                          </span>
                        </div>
                        <p className="text-destructive text-sm">{error.reason}</p>
                      </div>
                    ))}
                    {validationResult.errors.length > 20 && (
                      <div className="text-center text-xs text-muted-foreground">
                        ... dan {validationResult.errors.length - 20} kesalahan lainnya
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded p-3 text-sm text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Statistik:</span> {validationResult.stats.validRows} dari {validationResult.stats.totalRows} baris valid</p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult && validationResult.warnings.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Peringatan ({validationResult.warnings.length})
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-600">
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  disabled={!canProceedStep2}
                  onClick={handleProcessData}
                >
                  Proses Data
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {processingStep !== 'idle' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                {processingStep !== 'complete' ? (
                  <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                ) : (
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                )}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {getProcessingMessage()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {processingStep !== 'complete' 
                      ? 'Silakan tunggu sambil kami menganalisis data Anda...'
                      : 'Pengalihan ke dashboard Anda...'}
                  </p>
                </div>
                <div className="max-w-xs mx-auto">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

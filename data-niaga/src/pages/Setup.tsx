import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  BarChart3,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REQUIRED_COLUMNS = ['InvoiceNo', 'InvoiceDate', 'PULAU', 'PRODUCT_CATEGORY', 'Quantity'];

interface UserInfo {
  name: string;
  role: string;
  company: string;
}

type ProcessingStep = 'idle' | 'validating' | 'forecasting' | 'mba' | 'complete';

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', role: '', company: '' });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);

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
      setValidationError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return false;
    }
    
    setValidationError(null);
    return true;
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
  };

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

    // Store user info in localStorage
    localStorage.setItem('dataniaga_user', JSON.stringify(userInfo));
    
    navigate('/dashboard');
  };

  const handleProcessData = () => {
    if (!file) {
      setValidationError('Please upload a file first');
      return;
    }
    simulateProcessing();
  };

  const canProceedStep1 = userInfo.name.trim() && userInfo.role.trim() && userInfo.company.trim();
  const canProceedStep2 = file !== null;

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'validating': return 'Validating data columns...';
      case 'forecasting': return 'Training Forecast Model (LightGBM)...';
      case 'mba': return 'Analyzing Market Basket (FP-Growth)...';
      case 'complete': return 'Analysis Complete!';
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
            <span className="font-semibold text-foreground">DataNiaga Setup</span>
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
              <CardTitle>Tell Us About You</CardTitle>
              <CardDescription>
                This information helps personalize your dashboard experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="e.g., Store Manager, Analyst"
                  value={userInfo.role}
                  onChange={(e) => setUserInfo({ ...userInfo, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Enter your company name"
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
                  Continue
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
              <CardTitle>Upload Transaction Data</CardTitle>
              <CardDescription>
                Upload your sales data file to begin analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Requirements */}
              <Alert>
                <FileSpreadsheet className="w-4 h-4" />
                <AlertDescription>
                  <span className="font-medium">Required Columns:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {REQUIRED_COLUMNS.map((col) => (
                      <span key={col} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                        {col}
                      </span>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>

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
                      Drag & drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse
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
                        <span>Browse Files</span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-4">
                      Supports CSV and Excel files (.csv, .xlsx, .xls)
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

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  disabled={!canProceedStep2}
                  onClick={handleProcessData}
                >
                  Process Data
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
                      ? 'Please wait while we analyze your data...'
                      : 'Redirecting to your dashboard...'}
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

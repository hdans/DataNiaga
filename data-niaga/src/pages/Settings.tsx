import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, RefreshCw, Download, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const handleRefreshModels = () => {
    toast({
      title: 'Model Refresh Initiated',
      description: 'Training job has been queued. This may take 5-10 minutes.',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your data export will be ready shortly.',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Retail DSS application
          </p>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Model Version</p>
                <p className="font-semibold">LightGBM v3.3.5 (Tweedie)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Training</p>
                <p className="font-semibold">Dec 4, 2025 - 08:30 AM</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Range</p>
                <p className="font-semibold">Jan 2022 - Dec 2025</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-success/10 text-success border-success/30">
                  Active
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
              Model Configuration
            </CardTitle>
            <CardDescription>
              Current forecasting model parameters
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
              MBA Configuration
            </CardTitle>
            <CardDescription>
              Market Basket Analysis parameters
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

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleRefreshModels} className="w-full justify-start">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Models (Run Training Job)
            </Button>
            <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Forecast Data
            </Button>
          </CardContent>
        </Card>

        {/* Architecture Note */}
        <Card className="bg-accent/50 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Architecture Note</h3>
            <p className="text-xs text-muted-foreground">
              This DSS frontend is built with React + Vite + Tailwind CSS. The forecasting 
              and MBA models (LightGBM, FP-Growth) run as separate Python jobs that populate 
              the database. The frontend reads pre-computed results for fast dashboard rendering.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              To run the training pipeline, execute: <code className="bg-muted px-1 rounded">python jobs/weekly_update.py</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

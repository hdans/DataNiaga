import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Brain, Lightbulb, ArrowRight, BarChart3, Package, TrendingUp, Store } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <nav className="relative z-10 container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">DataNiaga</span>
          </div>
          <Link to="/setup">
            <Button variant="outline" size="sm">
              Get Started
            </Button>
          </Link>
        </nav>
        
        <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              AI-Powered Decision Support
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              DataNiaga: AI-Powered{' '}
              <span className="text-primary">Retail Intelligence</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Optimize Stock, Promotion, and Store Layout with Machine Learning. 
              Transform your transaction data into actionable business insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/setup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Start Analysis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What is DataNiaga?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A Decision Support System designed to help retail managers make data-driven 
              decisions using advanced forecasting and market basket analysis.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Sales Forecasting</h3>
                <p className="text-sm text-muted-foreground">
                  LightGBM-powered predictions for the next 10 weeks, segmented by region and product category.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Market Basket Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  FP-Growth algorithm identifies product associations for smarter bundling and cross-selling.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg bg-card">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Store Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Data-driven recommendations for product placement and promotional strategies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to transform your data into insights
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    1
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Upload Your Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your transaction data in CSV or Excel format with sales history.
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
                  <h3 className="font-semibold text-foreground mb-2">AI Analyzes Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    Our ML models detect trends, patterns, and product associations automatically.
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
                  <h3 className="font-semibold text-foreground mb-2">Get Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive actionable insights for inventory, promotions, and store layout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Optimize Your Retail Operations?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Upload your transaction data and get AI-powered recommendations in minutes.
          </p>
          <Link to="/setup">
            <Button size="lg" variant="secondary" className="gap-2">
              Start Analysis Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 DataNiaga. Decision Support System for Retail Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}

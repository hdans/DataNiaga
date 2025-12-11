// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export interface UserData {
  name: string;
  role: string;
  company: string;
}

export interface DashboardSummary {
  total_products: number;
  total_islands: number;
  stockout_risks: number;
  opportunities: number;
  forecast_accuracy: number;
}

export interface ForecastData {
  week: string;
  actual: number | null;
  predicted: number;
  is_forecast: boolean;
}

export interface MBARule {
  antecedents: string;
  consequents: string;
  support: number;
  confidence: number;
  lift: number;
}

export interface Recommendation {
  type: 'derived_demand' | 'dead_stock';
  product: string;
  related_product: string | null;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

// API Error Handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, errorData.detail || 'Request failed');
  }
  return response.json();
}

// API Functions
export const api = {
  // Upload data file
  async uploadData(file: File): Promise<{ status: string; message: string; records: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload-data`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse(response);
  },

  // Create user session
  async createUser(userData: UserData): Promise<{ status: string; user_id: number }> {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return handleResponse(response);
  },

  // Get dashboard summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`);
    return handleResponse(response);
  },

  // Get forecast data
  async getForecast(pulau?: string, product?: string): Promise<ForecastData[]> {
    const params = new URLSearchParams();
    if (pulau) params.append('pulau', pulau);
    if (product) params.append('product', product);

    const url = `${API_BASE_URL}/api/forecast${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get MBA rules
  async getMBARules(pulau?: string): Promise<MBARule[]> {
    const url = pulau
      ? `${API_BASE_URL}/api/mba-rules?pulau=${encodeURIComponent(pulau)}`
      : `${API_BASE_URL}/api/mba-rules`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get recommendations
  async getRecommendations(pulau?: string, type?: string): Promise<Recommendation[]> {
    const params = new URLSearchParams();
    if (pulau) params.append('pulau', pulau);
    if (type) params.append('type', type);
    
    const url = `${API_BASE_URL}/api/recommendations${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get available islands
  async getIslands(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/islands`);
    return handleResponse(response);
  },

  // Get available product categories
  async getProducts(pulau?: string): Promise<string[]> {
    const url = pulau
      ? `${API_BASE_URL}/api/products?pulau=${encodeURIComponent(pulau)}`
      : `${API_BASE_URL}/api/products`;
    const response = await fetch(url);
    return handleResponse(response);
  },
};

export default api;

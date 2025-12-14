import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { UserData } from '@/lib/api.ts';

// Query Keys
export const queryKeys = {
  dashboardSummary: ['dashboardSummary'] as const,
  forecast: (pulau?: string, product?: string) => ['forecast', pulau, product] as const,
  mbaRules: (pulau?: string) => ['mbaRules', pulau] as const,
  recommendations: (pulau?: string, type?: string) => ['recommendations', pulau, type] as const,
  islands: ['islands'] as const,
  products: (pulau?: string) => ['products', pulau] as const,
};

// Dashboard Summary Hook
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.getDashboardSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Forecast Hook
export function useForecast(pulau?: string, product?: string) {
  return useQuery({
    queryKey: queryKeys.forecast(pulau, product),
    queryFn: () => api.getForecast(pulau, product),
    staleTime: 5 * 60 * 1000,
  });
}

// MBA Rules Hook
export function useMBARules(pulau?: string) {
  return useQuery({
    queryKey: queryKeys.mbaRules(pulau),
    queryFn: () => api.getMBARules(pulau),
    staleTime: 5 * 60 * 1000,
  });
}

// Recommendations Hook
export function useRecommendations(pulau?: string, type?: string) {
  return useQuery({
    queryKey: queryKeys.recommendations(pulau, type),
    queryFn: () => api.getRecommendations(pulau, type),
    staleTime: 5 * 60 * 1000,
  });
}

// Islands Hook
export function useIslands() {
  return useQuery({
    queryKey: queryKeys.islands,
    queryFn: () => api.getIslands(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Products Hook
export function useProducts(pulau?: string) {
  return useQuery({
    queryKey: queryKeys.products(pulau),
    queryFn: () => api.getProducts(pulau),
    staleTime: 10 * 60 * 1000,
  });
}

// Training Metadata Hook
export function useTrainingMetadata() {
  return useQuery({
    queryKey: ['trainingMetadata'],
    queryFn: () => api.getTrainingMetadata(),
    staleTime: 5 * 60 * 1000,
  });
}

// Upload Data Mutation
export function useUploadData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => api.uploadData(file),
    onSuccess: () => {
      // Invalidate all queries after successful upload
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['mbaRules'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.islands });
    },
  });
}

// Create User Mutation
export function useCreateUser() {
  return useMutation({
    mutationFn: (userData: UserData) => api.createUser(userData),
  });
}

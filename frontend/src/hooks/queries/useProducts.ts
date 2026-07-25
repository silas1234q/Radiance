import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { Product, ProductWithAnalysis, RoutineStep } from '../../types/api';

export function useProducts(category?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => api.fetch<Product[]>(category ? `/products?category=${category}` : '/products'),
  });
}

export function useProductSearch(query: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => api.fetch<Product[]>(`/products/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useProductAnalysis(productId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['products', 'analysis', productId],
    queryFn: () => api.fetch<ProductWithAnalysis>(`/products/${productId}/analysis`),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}

export function useBarcodeLookup() {
  const api = useApi();
  return useMutation({
    // scan.tsx renders its own 404 "not found" + error UI for this.
    meta: { suppressErrorToast: true },
    mutationFn: (barcode: string) =>
      api.fetch<Product>(`/products/barcode/${encodeURIComponent(barcode)}`),
  });
}

export function useCreateProduct() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    // ManualProductModal renders inline `createProduct.isError` text.
    meta: { suppressErrorToast: true },
    mutationFn: (data: {
      name: string;
      brand: string;
      category: string;
      ingredients: string;
      barcode?: string;
      imageUrl?: string;
    }) =>
      api.fetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useExtractIngredients() {
  const api = useApi();
  return useMutation({
    // ManualProductModal.processLabelImage toasts from its own catch block.
    meta: { suppressErrorToast: true },
    mutationFn: (imageUrl: string) =>
      api.fetch<{ ingredients: string[] }>('/products/extract-ingredients', {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      }),
  });
}

export function useAddStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      routineId,
      name,
      description,
      productId,
    }: {
      routineId: string;
      name: string;
      description?: string;
      productId?: string;
    }) =>
      api.fetch<RoutineStep>(`/routines/${routineId}/steps`, {
        method: 'POST',
        body: JSON.stringify({ name, description, productId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

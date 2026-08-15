import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useTrack } from '../useTrack';
import { getErrorMessage } from '../../lib/errors';
import type { Product, ProductWithAnalysis, RoutineStep } from '../../types/api';

interface ProductScanLimit {
  scansUsed: number;
  freeLimit: number;
  scansRemaining: number | null;
  isPro: boolean;
}

export function useProductScanLimit() {
  const api = useApi();
  return useQuery({
    queryKey: ['productScanLimit'],
    queryFn: () => api.fetch<ProductScanLimit>('/products/scan-limit'),
  });
}

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
  const track = useTrack();
  return useMutation({
    // scan.tsx renders its own 404 "not found" + error UI for this.
    meta: { suppressErrorToast: true },
    mutationFn: (barcode: string) =>
      api.fetch<Product>(`/products/barcode/${encodeURIComponent(barcode)}`),
    // No barcode in the payload — it identifies a specific product a person
    // owns. The hit/miss rate is the signal: a high miss rate means the
    // catalogue is the problem, not the scanner.
    onSuccess: () => track('product_barcode_scanned'),
    onError: (err) => track('product_barcode_lookup_failed', { message: getErrorMessage(err) }),
  });
}

export function useCreateProduct() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
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
    onSuccess: (_data, vars) => {
      // Category only — name/brand/ingredients are the product itself.
      // Manual entry volume is the signal that catalogue coverage is short.
      track('product_created_manually', { category: vars.category });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useExtractIngredients() {
  const api = useApi();
  const track = useTrack();
  return useMutation({
    // ManualProductModal.processLabelImage toasts from its own catch block.
    meta: { suppressErrorToast: true },
    mutationFn: (imageUrl: string) =>
      api.fetch<{ ingredients: string[] }>('/products/extract-ingredients', {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      }),
    // Count, not the ingredient list — a zero here means OCR failed silently.
    onSuccess: (data) =>
      track('product_ingredients_extracted', { ingredient_count: data.ingredients.length }),
  });
}

// NOTE: this duplicates `useAddStep` in useRoutines.ts — same endpoint, one
// fewer cache invalidation. Both are instrumented with the same event so the
// count is right whichever one a screen happens to import. The duplication
// predates this change and is worth collapsing separately.
export function useAddStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
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
    onSuccess: (_data, { routineId, productId }) => {
      track('routine_step_added', { routine_id: routineId, has_product: !!productId });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

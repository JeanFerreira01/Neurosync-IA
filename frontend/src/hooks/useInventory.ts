import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import type { Product, StockMovement } from "@/types";

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => inventoryService.listProducts(params),
    select: (data) => data.results,
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["product-alerts"],
    queryFn: () => inventoryService.alerts(),
  });
}

export function useProductMovements(id: string) {
  return useQuery({
    queryKey: ["product-movements", id],
    queryFn: () => inventoryService.movements(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => inventoryService.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-alerts"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product>) => inventoryService.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-alerts"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-alerts"] });
    },
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StockMovement>) => inventoryService.createMovement(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-alerts"] });
      qc.invalidateQueries({ queryKey: ["neurotest-scales"] });
      qc.invalidateQueries({ queryKey: ["neurotest-stock-summary"] });
      if (variables.product) {
        qc.invalidateQueries({ queryKey: ["product-movements", variables.product] });
      }
    },
  });
}

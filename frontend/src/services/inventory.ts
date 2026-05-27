import api from "@/lib/api";
import type { Product, ProductAlert, StockMovement, PaginatedResponse } from "@/types";

export const inventoryService = {
  listProducts: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Product>>("/inventory/products/", { params }).then((r) => r.data),

  getProduct: (id: string) =>
    api.get<Product>(`/inventory/products/${id}/`).then((r) => r.data),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>("/inventory/products/", data).then((r) => r.data),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/inventory/products/${id}/`, data).then((r) => r.data),

  deleteProduct: (id: string) =>
    api.delete(`/inventory/products/${id}/`),

  alerts: () =>
    api.get<ProductAlert[]>("/inventory/products/alerts/").then((r) => r.data),

  movements: (productId: string) =>
    api.get<StockMovement[]>(`/inventory/products/${productId}/movements/`).then((r) => r.data),

  createMovement: (data: Partial<StockMovement>) =>
    api.post<StockMovement>("/inventory/movements/", data).then((r) => r.data),
};

import { z } from "zod";

export const searchProductsSchema = {
  query: z.string().min(1, "query is required")
};

export const getProductSchema = {
  productId: z.number().int().positive()
};

export const filterProductsSchema = {
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  category: z.string().optional(),
  minRating: z.number().min(0).max(5).optional()
};

export const addToCartSchema = {
  productId: z.number().int().positive(),
  quantity: z.number().int().positive()
};

export const purchaseProductSchema = {
  userId: z.string().min(1, "userId is required")
};

export const getOrdersSchema = {
  userId: z.string().min(1, "userId is required")
};

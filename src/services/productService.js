import { products } from "../data/products.js";

const normalize = (value) => value.trim().toLowerCase();

export async function searchProducts(query) {
  const normalizedQuery = normalize(query);

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export async function getProductById(productId) {
  return products.find((product) => product.id === productId) ?? null;
}

export async function filterProducts(filters) {
  return products.filter((product) => {
    if (typeof filters.minPrice === "number" && product.price < filters.minPrice) {
      return false;
    }

    if (typeof filters.maxPrice === "number" && product.price > filters.maxPrice) {
      return false;
    }

    if (typeof filters.category === "string" && product.category !== filters.category.toLowerCase()) {
      return false;
    }

    if (typeof filters.minRating === "number" && product.rating < filters.minRating) {
      return false;
    }

    return true;
  });
}

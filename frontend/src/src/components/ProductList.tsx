import { useEffect, useState } from "react";
import { getProducts } from "../services/supabaseService";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../types";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getProducts();
      setProducts(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// app/admin/products/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Define a product interface for type safety
interface Product {
  _id: string;
  name: string;
  price: number;
  desc: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/products`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        // Expecting the API to return an array of products
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return <p style={{ padding: "1rem" }}>Loading...</p>;
  }

  if (error) {
    return <p style={{ padding: "1rem", color: "red" }}>{error}</p>;
  }

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Products</h1>

      {/* Link to a page/form for creating a new product */}
      <div style={{ margin: "1rem 0" }}>
        <Link href="/admin/products/create">Create New Product</Link>
      </div>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {products.map((product: Product) => (
            <li
              key={product._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0 }}>{product.name}</h2>
              <p>Price: {product.price}</p>
              <p style={{ marginBottom: "0.5rem" }}>{product.desc}</p>

              {/* Example edit/delete actions */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href={`/admin/products/${product._id}/edit`}>Edit</Link>
                <button
                  onClick={async () => {
                    // Example delete logic placeholder
                    alert("Delete logic not implemented yet.");
                  }}
                  style={{ color: "red" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

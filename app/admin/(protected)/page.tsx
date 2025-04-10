// app/admin/(protected)/page.tsx
import Dashboard from "./Dashboard.client"; // Import the client component

export const metadata = {
  title: "Admin Dashboard | Phulkari Bagh",
  description: "Manage products for Phulkari Bagh",
};

// Server-side function to fetch products.
async function getProducts() {
  // Use NEXT_PUBLIC_SITE_URL if provided; otherwise, default to localhost.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  // Create an absolute URL using the URL constructor.
  const url = new URL("/api/products", baseUrl).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const products = await getProducts();
  return <Dashboard products={products} />;
}
// app/admin/products/[id].tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, FormEvent } from "react"

/**
 * A page that lets the admin edit an existing product.
 * Loads product data from /api/products/[id] and performs a PUT request to update.
 */
export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  // Local state for product fields
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch existing product details
   */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" })

        if (!res.ok) {
          throw new Error("Failed to load product.")
        }
        const productData = await res.json()

        // Populate local state with existing product data
        setName(productData.name || "")
        setDesc(productData.desc || "")
        setPrice(productData.price?.toString() || "")
      } catch (err: any) {
        setError(err.message || "Something went wrong.")
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  /**
   * Handle form submission (PUT request to /api/products/[id])
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          desc,
          price,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update product.")
      }

      // On success, redirect to the products list or do something else
      router.push("/admin/products")
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !error && !name && !desc && !price) {
    return <p style={{ padding: "1rem" }}>Loading product data...</p>
  }

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Edit Product</h1>

      {error && (
        <p style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
        <div>
          <label>Product Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ width: "100%", minHeight: "80px", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label>Price (INR)</label>
          <input
            type="number"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "0.75rem 1.5rem" }}>
          {loading ? "Updating..." : "Update Product"}
        </button>
      </form>
    </main>
  )
}
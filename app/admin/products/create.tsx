"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CreateProductPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle image selection and convert to base64
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Submit the form to create a new product
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Optional: upload image if present
      let secure_url = "";
      let public_id = "";

      if (imageBase64) {
        // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        // Call your upload route
        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            folder: "phulkari_products",
          }),
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }
        const uploadData = await uploadRes.json();
        secure_url = uploadData.secure_url;
        public_id = uploadData.public_id;
      }

      // 2. Create the product
      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          desc,
          price,
          imageUrl: secure_url,
          imageId: public_id,
        }),
      });

      if (!productRes.ok) {
        throw new Error("Failed to create product");
      }

      // 3. Optionally refresh or redirect to the product list
      router.push("/admin/products");
    } catch (err: unknown) {
      let errMessage = "Something went wrong";
      if (err instanceof Error) {
        errMessage = err.message;
      }
      console.error("Error creating product:", err);
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Create a New Product</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label>Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              minHeight: "80px",
            }}
          />
        </div>

        <div>
          <label>Price (INR)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label>Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "block" }}
          />
          {imageBase64 && (
            <Image
              src={imageBase64}
              alt="Preview"
              width={150}
              height={150}
              style={{ marginTop: "0.5rem" }}
            />
          )}
        </div>

        <button type="submit" disabled={loading} style={{ padding: "0.75rem 1.5rem" }}>
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </main>
  );
}

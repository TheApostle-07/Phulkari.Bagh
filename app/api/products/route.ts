// app/api/products/route.ts
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await dbConnect()
    const products = await Product.find({})
    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const data = await request.json()
    const product = new Product(data)
    await product.save()
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 })
  }
}
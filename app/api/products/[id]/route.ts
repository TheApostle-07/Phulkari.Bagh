// app/api/products/[id]/route.ts
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const product = await Product.findById(params.id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch product"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const data = await request.json()
    const product = await Product.findByIdAndUpdate(params.id, data, { new: true })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update product"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const product = await Product.findByIdAndDelete(params.id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete product"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

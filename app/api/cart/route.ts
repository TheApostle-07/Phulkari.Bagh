import dbConnect from "@/lib/db";
import Cart from "@/lib/models/Cart";
import { NextResponse } from "next/server";

// GET: Fetch the cart for a given user based on a query parameter.
export async function GET(request: Request) {
  try {
    // Establish a connection to the database
    await dbConnect();

    // Parse query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Validate that userId is provided
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Find the cart document corresponding to the userId.
    // Using `.lean()` for a faster read if you're not modifying the document.
    const cart = await Cart.findOne({ userId }).lean();

    // Return the cart if found, otherwise default structure with empty items.
    return NextResponse.json(cart || { userId, items: [] });
  } catch (error: any) {
    // Log detailed error for debugging purposes.
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST: Save or update the cart for a user.
export async function POST(request: Request) {
  try {
    // Establish a connection to the database
    await dbConnect();

    // Parse JSON data from the request body.
    const data = await request.json();
    const { userId, items } = data;

    // Validate required fields: userId must be truthy and items must be an array.
    if (!userId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid data: userId and items array are required." },
        { status: 400 }
      );
    }

    // Additional validation: Ensure each item has the expected fields.
    const isValidItems = items.every(
      (item: any) =>
        item.productId &&
        typeof item.productId === "string" &&
        item.name &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity)
    );

    if (!isValidItems) {
      return NextResponse.json(
        { error: "Invalid items structure." },
        { status: 400 }
      );
    }

    // Update or create the cart document.
    // `runValidators: true` ensures your schema validations are enforced.
    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { items, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(updatedCart);
  } catch (error: any) {
    // Log detailed error for debugging purposes.
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update cart" },
      { status: 500 }
    );
  }
}
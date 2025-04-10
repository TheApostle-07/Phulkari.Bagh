import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

/**
 * POST /api/users
 * Create or update a user's record in the database.
 *
 * Expected payload:
 * {
 *   uid: string,          // required
 *   email: string,        // required
 *   displayName?: string, // optional
 *   photoURL?: string     // optional
 * }
 */
export async function POST(request: Request) {
  try {
    // Ensure a connection to the database
    await dbConnect();

    // Parse JSON data from the request
    const data = await request.json();
    const { uid, email, displayName, photoURL } = data;

    // Validate required fields: UID and email must be provided
    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields: uid and email are required." },
        { status: 400 }
      );
    }

    // Upsert the user record: create a new user if one doesn't exist, or update the existing one.
    const userRecord = await User.findOneAndUpdate(
      { uid }, // Filter by uid
      { email, displayName, photoURL, updatedAt: new Date() }, // Update object
      { new: true, upsert: true, runValidators: true } // Options
    );

    // Return the created/updated user record
    return NextResponse.json(userRecord, { status: 200 });
  } catch (error: any) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create/update user" },
      { status: 500 }
    );
  }
}
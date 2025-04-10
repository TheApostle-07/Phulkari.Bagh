// app/api/admin/login/route.ts

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Look up the admin user by email (username) and role.
    const user = await User.findOne({ email: username, role: "admin" });
    if (!user) {
      console.log("User not found for email:", username);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // For debugging only: log the hashed password (remove in production)
    console.log("Stored hash:", user.password);

    // Compare the provided password with the stored hashed password.
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.log("Password mismatch for user:", username);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create a JWT that includes the admin's UID and role.
    const token = jwt.sign({ uid: user.uid, role: "admin" }, SECRET_KEY, {
      expiresIn: "1d",
      algorithm: "HS256",
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "admin_jwt",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day in seconds
      sameSite: "strict",
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Login error:", error.message);
    } else {
      console.error("Login error:", error);
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server"
import { uploadImage } from "@/lib/cloudinary"

interface UploadRequestBody {
  imageBase64: string
  folder?: string
}

/**
 * Receives a base64-encoded image, converts it to a Buffer, then uploads it to Cloudinary.
 */
export async function POST(request: Request) {
  try {
    const { imageBase64, folder }: UploadRequestBody = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "No image data provided." }, { status: 400 })
    }

    const buffer = Buffer.from(imageBase64, "base64")
    const result = await uploadImage(buffer, { folder: folder || "house_of_phulkari" })

    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url,
    })
  } catch (error: unknown) {
    console.error("Error uploading image:", error)
    const errorMessage = (error as Error).message || "Something went wrong."
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error("Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment")
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Uploads an image to Cloudinary.
 *
 * @param filePathOrBuffer A string (data URI) or Buffer containing image data.
 * @param options Optional upload options.
 * @returns A promise resolving with the Cloudinary upload response.
 */
export async function uploadImage(
  filePathOrBuffer: string | Buffer,
  options: Record<string, unknown> = {}
): Promise<UploadApiResponse> {
  // If the input is a Buffer, convert it into a data URI.
  const dataUri =
    typeof filePathOrBuffer === "string"
      ? filePathOrBuffer
      : `data:image/webp;base64,${filePathOrBuffer.toString('base64')}`

  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      { folder: "house_of_phulkari", ...options },
      (error, result) => {
        if (error) return reject(error)
        resolve(result as UploadApiResponse)
      }
    )
  })
}

export default cloudinary
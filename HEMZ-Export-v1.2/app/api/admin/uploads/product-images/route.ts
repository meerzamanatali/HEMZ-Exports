import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/admin-session"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession()
    if (!auth.ok) {
      return auth.response
    }

    const formData = await request.formData()
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files were uploaded" }, { status: 400 })
    }

    const uploadedImages: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: `Unsupported file type for ${file.name}` }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "hemz-exports/products" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      uploadedImages.push(result.secure_url)
    }

    return NextResponse.json({ success: true, images: uploadedImages })
  } catch (error) {
    console.error("POST /api/admin/uploads/product-images error:", error)
    return NextResponse.json({ error: "Failed to upload product images" }, { status: 500 })
  }
}
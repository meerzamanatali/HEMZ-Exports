import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/admin-session"

function getSafeExtension(fileName: string, mimeType: string) {
  const fileExt = path.extname(fileName || "").toLowerCase()
  if (fileExt) {
    return fileExt
  }

  switch (mimeType) {
    case "image/png":
      return ".png"
    case "image/webp":
      return ".webp"
    case "image/gif":
      return ".gif"
    default:
      return ".jpg"
  }
}

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

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products")
    await mkdir(uploadDir, { recursive: true })

    const uploadedImages: string[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: `Unsupported file type for ${file.name}` }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const extension = getSafeExtension(file.name, file.type)
      const fileName = `${Date.now()}-${randomUUID()}${extension}`
      const absolutePath = path.join(uploadDir, fileName)

      await writeFile(absolutePath, buffer)
      uploadedImages.push(`/uploads/products/${fileName}`)
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    })
  } catch (error) {
    console.error("POST /api/admin/uploads/product-images error:", error)
    return NextResponse.json(
      { error: "Failed to upload product images" },
      { status: 500 }
    )
  }
}

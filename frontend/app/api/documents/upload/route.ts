import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const metadataStr = formData.get("metadata") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    let metadata
    try {
      metadata = JSON.parse(metadataStr)
    } catch (error) {
      return NextResponse.json({ error: "Invalid metadata format" }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    // In Docker, this should map to the volume: importer_data:/app/data
    const uploadDir =
      process.env.NODE_ENV === "production"
        ? "/app/data/import/pending" // Docker path
        : path.join(process.cwd(), "uploads", "pending") // Local development path

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // File is already renamed on the frontend
      const fileName = file.name
      const filePath = path.join(uploadDir, fileName)
      console.log(`[UPLOAD] Saving file to: ${filePath}`)
      await writeFile(filePath, buffer)
      uploadedFiles.push(fileName)
    }

    // Trigger import process
    try {
      const importResponse = await fetch("http://backend:8001/trigger-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!importResponse.ok) {
        console.error("Failed to trigger import:", importResponse.statusText)
      }
    } catch (importError) {
      console.error("Error triggering import:", importError)
      // Don't fail the upload if import trigger fails
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedFiles.length,
      files: uploadedFiles,
      metadata,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}

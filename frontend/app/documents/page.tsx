"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Upload, ArrowLeft, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "../../components/ui/alert"

interface DocumentMetadata {
  standard: string
  site: string
  area: string
  line: string
  department: string
  language: string
}

export default function DocumentManagement() {
  const router = useRouter()
  const [files, setFiles] = useState<FileList | null>(null)
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    standard: "ISA95",
    site: "",
    area: "",
    line: "",
    department: "",
    language: "CZ",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
    setUploadStatus({ type: null, message: "" })
  }

  const handleMetadataChange = (field: keyof DocumentMetadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }))
  }

  const generateFileName = (originalName: string): string => {
    const extension = originalName.split(".").pop()
    const name = originalName.replace(`.${extension}`, "")
    const { standard, site, area, line, department, language } = metadata

    return `${name}_${standard}_${site}_${area}_${line}_${department}_${language}.${extension}`
  }

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setUploadStatus({ type: "error", message: "Prosím vyberte soubory k nahrání." })
      return
    }

    // Validate required fields
    const requiredFields = ["site", "area", "line", "department"]
    const missingFields = requiredFields.filter((field) => !metadata[field as keyof DocumentMetadata])

    if (missingFields.length > 0) {
      setUploadStatus({
        type: "error",
        message: `Prosím vyplňte všechna povinná pole: ${missingFields.join(", ")}`,
      })
      return
    }

    setIsUploading(true)
    setUploadStatus({ type: null, message: "" })

    try {
      const formData = new FormData()

      // Add files with renamed names
      Array.from(files).forEach((file) => {
        const newFileName = generateFileName(file.name)
        const renamedFile = new File([file], newFileName, { type: file.type })
        formData.append("files", renamedFile)
      })

      // Add metadata
      formData.append("metadata", JSON.stringify(metadata))

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      setUploadStatus({
        type: "success",
        message: `Úspěšně nahráno ${result.uploadedCount} souborů. Import byl spuštěn.`,
      })

      // Reset form
      setFiles(null)
      setMetadata({
        standard: "ISA95",
        site: "",
        area: "",
        line: "",
        department: "",
        language: "CZ",
      })

      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus({
        type: "error",
        message: `Chyba při nahrávání: ${error instanceof Error ? error.message : "Neznámá chyba"}`,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const previewFileNames = files
    ? Array.from(files).map((file) => ({
        original: file.name,
        renamed: generateFileName(file.name),
      }))
    : []

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Správa dokumentů</h1>
          <p className="text-gray-600 mt-2">Nahrajte a spravujte průmyslové dokumenty podle standardu ISA-95</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Nahrát dokumenty
              </CardTitle>
              <CardDescription>Vyberte soubory a vyplňte metadata podle ISA-95</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="file-upload">Soubory (PDF, DOCX)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {/* Metadata Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="standard">Standard</Label>
                  <Select value={metadata.standard} onValueChange={(value) => handleMetadataChange("standard", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISA95">ISA-95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="site">Site *</Label>
                  <Select
                    value={metadata.site}
                    onValueChange={(value) => handleMetadataChange("site", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte závod" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upper">Upper</SelectItem>
                      <SelectItem value="Middle">Middle</SelectItem>
                      <SelectItem value="Down">Down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="area">Pracoviště *</Label>
                  <Select
                    value={metadata.area}
                    onValueChange={(value) => handleMetadataChange("area", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte pracoviště" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixing">Mixing</SelectItem>
                      <SelectItem value="Heating">Heating</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="line">Linka *</Label>
                  <Select
                    value={metadata.line}
                    onValueChange={(value) => handleMetadataChange("line", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte linku" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Linka 1">Linka 1</SelectItem>
                      <SelectItem value="Linka 2">Linka 2</SelectItem>
                      <SelectItem value="Linka 3">Linka 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <Input
                    id="line"
                    value={metadata.line}
                    onChange={(e) => handleMetadataChange("line", e.target.value)}
                    placeholder="např. Line1"
                  /> */}
                </div>

                <div>
                  <Label htmlFor="department">Oddělení *</Label>
                  <Select
                    value={metadata.department}
                    onValueChange={(value) => handleMetadataChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte oddělení" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="QA">QA</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Jazyk</Label>
                  <Select value={metadata.language} onValueChange={(value) => handleMetadataChange("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CZ">Čeština</SelectItem>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="DE">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Upload Status */}
              {uploadStatus.type && (
                <Alert
                  className={
                    uploadStatus.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }
                >
                  {uploadStatus.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={uploadStatus.type === "success" ? "text-green-800" : "text-red-800"}>
                    {uploadStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || !files || files.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Nahrávám...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Nahrát dokumenty
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Náhled souborů
              </CardTitle>
              <CardDescription>Náhled přejmenovaných souborů podle metadata</CardDescription>
            </CardHeader>
            <CardContent>
              {previewFileNames.length > 0 ? (
                <div className="space-y-3">
                  {previewFileNames.map((file, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Původní název:</div>
                      <div className="font-mono text-sm text-gray-800 mb-2">{file.original}</div>
                      <div className="text-sm text-gray-600 mb-1">Nový název:</div>
                      <div className="font-mono text-sm text-blue-600">{file.renamed}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Vyberte soubory pro náhled přejmenování</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

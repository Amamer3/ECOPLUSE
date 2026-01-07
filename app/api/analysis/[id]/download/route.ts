import { NextResponse } from "next/server"
import { fetchFromN8n, N8nError } from "@/lib/n8n"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate id parameter
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        { error: "Invalid analysis ID" },
        { status: 400 }
      )
    }

    const analysis = await fetchFromN8n({ 
      action: "get_analysis", 
      id: id.trim() 
    })

    // Handle empty or null response
    if (!analysis) {
      console.warn("[download] No analysis found for id:", id)
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      )
    }

    // Check for webhook error response
    if (analysis.success === false) {
      console.warn("[download] Webhook returned error:", analysis.message)
      return NextResponse.json(
        { error: analysis.message || "Analysis not found" },
        { status: 404 }
      )
    }

    try {
      const jsonString = JSON.stringify(analysis, null, 2)
      const safeId = id.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50)
      
      return new NextResponse(jsonString, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="analysis-${safeId}-${Date.now()}.json"`,
          "Content-Length": Buffer.byteLength(jsonString),
        },
      })
    } catch (stringifyError) {
      console.error("[download] Failed to stringify analysis:", stringifyError)
      return NextResponse.json(
        { error: "Failed to prepare download" },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof N8nError) {
      console.error("[download] N8n error:", error.message, error.statusCode)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error("[download] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to download analysis"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { fetchFromN8n } from "@/lib/n8n"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const analysis = await fetchFromN8n({ action: "get_analysis", id })

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    return new NextResponse(JSON.stringify(analysis, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="analysis-${id}.json"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading analysis:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

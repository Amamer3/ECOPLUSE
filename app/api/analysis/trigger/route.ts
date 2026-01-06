import { NextResponse } from "next/server"
import { fetchFromN8n } from "@/lib/n8n"

export async function POST(request: Request) {
  try {
    const { country, indicator, startDate, endDate } = await request.json()

    if (!country || !indicator || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await fetchFromN8n({
      action: "trigger_analysis",
      country,
      indicator,
      startDate,
      endDate,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error triggering analysis:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

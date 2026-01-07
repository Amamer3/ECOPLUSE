import { NextResponse } from "next/server"
import { fetchFromN8n, N8nError } from "@/lib/n8n"

export async function POST(request: Request) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[trigger] Invalid JSON body")
      return NextResponse.json(
        { error: "Invalid request body. JSON expected." },
        { status: 400 }
      )
    }

    const { country, indicator, startDate, endDate } = body

    // Validate required fields
    const missingFields = []
    if (!country) missingFields.push("country")
    if (!indicator) missingFields.push("indicator")
    if (!startDate) missingFields.push("startDate")
    if (!endDate) missingFields.push("endDate")

    if (missingFields.length > 0) {
      console.warn("[trigger] Missing required fields:", missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate field types and values
    if (typeof country !== "string" || country.trim() === "") {
      return NextResponse.json(
        { error: "Country must be a non-empty string" },
        { status: 400 }
      )
    }

    if (typeof indicator !== "string" || indicator.trim() === "") {
      return NextResponse.json(
        { error: "Indicator must be a non-empty string" },
        { status: 400 }
      )
    }

    // Validate dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: "Start date is not a valid date" },
        { status: 400 }
      )
    }

    if (isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: "End date is not a valid date" },
        { status: 400 }
      )
    }

    if (startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    const result = await fetchFromN8n({
      action: "trigger_analysis",
      country: country.trim(),
      indicator: indicator.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    })

    // Check for webhook error response
    if (result && result.success === false) {
      console.warn("[trigger] Webhook returned error:", result.message)
      return NextResponse.json(
        { error: result.message || "Webhook processing failed" },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof N8nError) {
      console.error("[trigger] N8n error:", error.message, error.statusCode)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    console.error("[trigger] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to trigger analysis"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

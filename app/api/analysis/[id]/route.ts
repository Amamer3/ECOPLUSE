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
            console.warn("[get_analysis] No analysis found for id:", id)
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 }
            )
        }

        // Check for webhook error response
        if (analysis.success === false) {
            console.warn("[get_analysis] Webhook returned error:", analysis.message)
            return NextResponse.json(
                { error: analysis.message || "Analysis not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(analysis)
    } catch (error) {
        if (error instanceof N8nError) {
            console.error("[get_analysis] N8n error:", error.message, error.statusCode)
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            )
        }

        console.error("[get_analysis] Unexpected error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch analysis"
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}

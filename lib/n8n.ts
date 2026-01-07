export interface N8nErrorResponse {
    error?: string
    message?: string
    statusCode?: number
}

export interface N8nResponse<T = any> {
    success?: boolean
    data?: T
    error?: string
    message?: string
}

export class N8nError extends Error {
    constructor(
        public statusCode: number,
        public details: string,
        message?: string
    ) {
        super(message || `N8n Webhook Error (${statusCode}): ${details}`)
        this.name = "N8nError"
    }
}

export async function fetchFromN8n(payload: any) {
    const WEBHOOK_URL = "https://n8n.srv1173078.hstgr.cloud/webhook/economic-analysis"

    if (!WEBHOOK_URL) {
        throw new N8nError(500, "Webhook URL not configured", "Server configuration error")
    }

    if (!payload || typeof payload !== "object") {
        throw new N8nError(400, "Invalid payload", "Request payload must be an object")
    }

    try {
        console.log("[N8n] Sending payload:", JSON.stringify(payload, null, 2))

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const responseText = await response.text()
        console.log("[N8n] Response status:", response.status)
        console.log("[N8n] Response body:", responseText)

        if (!response.ok) {
            // Try to parse error response for better error message
            let errorDetails = responseText
            try {
                const errorJson = JSON.parse(responseText)
                errorDetails = errorJson.error || errorJson.message || responseText
            } catch {}
            throw new N8nError(response.status, errorDetails)
        }

        // Handle empty response
        if (!responseText || responseText.trim() === "") {
            console.warn("[N8n] Empty response body")
            return { success: false, data: null }
        }

        try {
            const data = JSON.parse(responseText)
            
            // Validate response structure
            if (typeof data === "object" && data !== null) {
                return data
            }
            
            console.warn("[N8n] Invalid response structure:", typeof data)
            return { success: false, data, rawResponse: responseText }
        } catch (parseError) {
            console.error("[N8n] Failed to parse response:", parseError)
            // Return raw text wrapped in object for graceful handling
            return { success: false, message: responseText }
        }
    } catch (error) {
        if (error instanceof N8nError) {
            console.error("[N8n] N8nError:", error.message)
            throw error
        }

        if (error instanceof TypeError && error.message.includes("fetch")) {
            console.error("[N8n] Network error:", error.message)
            throw new N8nError(503, "Network unavailable", "Unable to connect to webhook service")
        }

        if (error instanceof Error && error.name === "AbortError") {
            console.error("[N8n] Request timeout")
            throw new N8nError(504, "Request timeout", "Webhook service took too long to respond")
        }

        console.error("[N8n] Unexpected error:", error)
        throw new N8nError(500, error instanceof Error ? error.message : "Unknown error", "Failed to communicate with webhook service")
    }
}

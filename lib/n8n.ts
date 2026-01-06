export async function fetchFromN8n(payload: any) {
    const WEBHOOK_URL = "https://n8n.srv1173078.hstgr.cloud/webhook/economic-analysis"

    try {
        console.log("Sending payload to n8n:", JSON.stringify(payload, null, 2))
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        const responseText = await response.text()
        console.log("n8n response status:", response.status)
        console.log("n8n response body:", responseText)

        if (!response.ok) {
            throw new Error(`n8n webhook failed with status: ${response.status}. Body: ${responseText}`)
        }

        try {
            return JSON.parse(responseText)
        } catch (e) {
            // If response is not JSON, return the text wrapped in an object
            return { message: responseText }
        }
    } catch (error) {
        console.error("Error fetching from n8n:", error)
        throw error
    }
}

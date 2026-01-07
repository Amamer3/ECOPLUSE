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
      // Build comprehensive CSV with well-formatted sections: summary, forecast (graphs), anomalies
      const indicator = analysis?.data?.indicator ?? ""
      const country = analysis?.data?.country ?? ""
      const timestamp = analysis?.timestamp ?? ""
      const info = analysis?.data ?? {}
      const ai = analysis?.full_analysis?.ai_analysis ?? {}
      const stats = analysis?.full_analysis?.statistics ?? {}
      const meta = analysis?.full_analysis?.metadata ?? {}
      const forecast = Array.isArray(analysis?.full_analysis?.forecast) ? analysis.full_analysis.forecast : []
      const anomalies = Array.isArray(ai?.anomalies) ? ai.anomalies : []

      const esc = (v: any) => {
        const s = v === null || v === undefined ? "" : String(v)
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? '"' + s.replace(/"/g, '""') + '"'
          : s
      }

      // Consistent, rich header so spreadsheets import cleanly and charts can be reconstructed
      let csvString = "section,indicator,country,country_name,indicator_name,series_id,start_date,end_date,timestamp,date,value,type,confidence,upper,lower,current_value,change_pct,trend,forecast_direction,alert_count,ai_trend,ai_trend_strength,ai_volatility,ai_forecast_confidence,ai_trend_description,ai_insights,ai_key_observations,ai_risk_factors,ai_seasonality_detected,ai_economic_interpretation,stats_mean,stats_std,stats_min,stats_max,stats_latest,stats_previous,stats_change,stats_change_pct,anomaly_reason\n"

      // Summary row (dashboard cards + AI + stats + metadata)
      csvString += [
        "summary",
        indicator,
        country,
        meta?.country_name ?? "",
        meta?.indicator_name ?? "",
        meta?.series_id ?? "",
        meta?.start_date ?? "",
        meta?.end_date ?? "",
        timestamp,
        "", // date
        "", // value
        "", // type
        "", // confidence
        "", // upper
        "", // lower
        info?.latest_value ?? "",
        info?.change_pct ?? "",
        info?.trend ?? "",
        info?.forecast_direction ?? "",
        info?.alert_count ?? "",
        ai?.trend ?? "",
        ai?.trend_strength ?? "",
        ai?.volatility ?? "",
        ai?.forecast_confidence ?? "",
        ai?.trend_description ?? "",
        ai?.insights ?? "",
        Array.isArray(ai?.key_observations) ? ai.key_observations.join(" | ") : "",
        Array.isArray(ai?.risk_factors) ? ai.risk_factors.join(" | ") : "",
        ai?.seasonality_detected ?? "",
        ai?.economic_interpretation ?? "",
        stats?.mean ?? "",
        stats?.std ?? "",
        stats?.min ?? "",
        stats?.max ?? "",
        stats?.latest ?? "",
        stats?.previous ?? "",
        stats?.change ?? "",
        stats?.change_pct ?? "",
        "" // anomaly_reason
      ].map(esc).join(",") + "\n"

      // Forecast rows for chart data, including upper/lower bounds used in graphs
      for (const f of forecast) {
        const confidence = Math.min(Math.max(f?.confidence ?? 0.85, 0), 1)
        const margin = (f?.value ?? 0) * (1 - confidence)
        const upper = (f?.value ?? 0) + margin
        const lower = (f?.value ?? 0) - margin
        csvString += [
          "forecast",
          indicator,
          country,
          meta?.country_name ?? "",
          meta?.indicator_name ?? "",
          meta?.series_id ?? "",
          meta?.start_date ?? "",
          meta?.end_date ?? "",
          timestamp,
          f?.date ?? "",
          f?.value ?? "",
          f?.type ?? "",
          confidence,
          upper,
          lower,
          "", "", "", "", "", // current_value..alert_count
          "", "", "", "", "", // ai_* fields
          "", "", // ai_key_observations, ai_risk_factors
          "", "", // seasonality_detected, economic_interpretation
          "", "", "", "", "", "", "", "", // stats_*
          "" // anomaly_reason
        ].map(esc).join(",") + "\n"
      }

      // Anomalies rows (deep analysis signals)
      for (const a of anomalies) {
        csvString += [
          "anomaly",
          indicator,
          country,
          meta?.country_name ?? "",
          meta?.indicator_name ?? "",
          meta?.series_id ?? "",
          meta?.start_date ?? "",
          meta?.end_date ?? "",
          timestamp,
          a?.date ?? "",
          a?.value ?? "",
          "", // type
          "", // confidence
          "", // upper
          "", // lower
          "", "", "", "", "", // current_value..alert_count
          "", "", "", "", "", // ai_* fields
          "", "", // ai_key_observations, ai_risk_factors
          "", "", // seasonality_detected, economic_interpretation
          "", "", "", "", "", "", "", "", // stats_*
          a?.reason ?? ""
        ].map(esc).join(",") + "\n"
      }

      const safeId = id.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50)

      return new NextResponse(csvString, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analysis-${safeId}-${Date.now()}.csv"`,
          "Content-Length": Buffer.byteLength(csvString).toString(),
        },
      })
    } catch (prepareError) {
      console.error("[download] Failed to prepare CSV:", prepareError)
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

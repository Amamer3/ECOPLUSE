# Economic Analysis Dashboard

A real-time economic analysis dashboard powered by n8n webhook integration and AI-driven market insights.

## Overview

This Next.js application provides a comprehensive platform for analyzing economic indicators, forecasting trends, and accessing AI-powered economic interpretations. Data is fetched from a custom n8n webhook that provides detailed economic analysis with forecasts, volatility metrics, and AI-generated insights.

## Features

✨ **Core Capabilities**
- 📊 Real-time economic data analysis
- 🌍 Multi-country support with dynamic filtering
- 📈 Advanced trend visualization with confidence intervals
- 🤖 AI-powered economic insights and market interpretation
- 💾 Browser-based localStorage persistence (temporary database)
- 📝 Complete analysis history tracking
- ⬇️ JSON export functionality for analysis data
- 🔴 Custom accent color scheme (#e15554 red)

## Technology Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui components
- **Charts**: Recharts for data visualization
- **State Management**: React hooks with localStorage
- **Data Integration**: n8n webhook API
- **Package Manager**: pnpm

## Project Structure

```
economic-analysis-dashboard/
├── app/
│   ├── page.tsx                    # Dashboard (home)
│   ├── analysis/
│   │   ├── page.tsx               # Analysis results display
│   │   └── [id]/page.tsx          # Analysis detail view
│   ├── history/page.tsx           # Analysis history
│   ├── trends/page.tsx            # Market trends analysis
│   ├── api/
│   │   └── analysis/
│   │       ├── list/route.ts      # API - get analyses list
│   │       ├── [id]/route.ts      # API - get analysis by ID
│   │       ├── trigger/route.ts   # API - trigger new analysis
│   │       └── download/route.ts  # API - download analysis
│   └── layout.tsx
├── components/
│   ├── analysis-history-table.tsx
│   ├── analysis-trigger-dialog.tsx
│   ├── app-sidebar.tsx
│   ├── metrics-grid.tsx
│   ├── charts/
│   │   ├── trend-area-chart.tsx
│   │   ├── trend-bar-chart.tsx
│   │   └── trend-line-chart.tsx
│   └── ui/                        # shadcn UI components
├── lib/
│   ├── db.ts
│   ├── n8n.ts                     # n8n webhook client
│   ├── countries.ts               # Country utilities
│   └── utils.ts
├── styles/
│   └── globals.css
├── public/
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- n8n webhook endpoint configured

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd economic-analysis-dashboard
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure n8n webhook** (if needed)
```bash
# Update lib/n8n.ts with your webhook URL
# Default: https://n8n.srv1173078.hstgr.cloud/webhook/economic-analysis
```

4. **Start development server**
```bash
pnpm dev
```

5. **Open browser**
```
http://localhost:3000
```

## Usage

### Dashboard (`/`)
- **Purpose**: View latest economic analysis for selected country
- **Behavior**: Shows empty state until analysis is manually triggered
- **Features**:
  - Country selector for filtering
  - Key metrics display (current value, trend, outlook, volatility)
  - Predictive analysis chart with confidence intervals
  - Volume metrics visualization
  - AI insights panel

### Analysis Page (`/analysis`)
- **Purpose**: Run new analysis and view results
- **Behavior**: Displays triggered analysis immediately with no page reload
- **Features**:
  - Analysis trigger dialog with date/country/indicator selection
  - Real-time result display
  - Data persists in localStorage
  - Automatic history saving

### Analysis Detail (`/analysis/[id]`)
- **Purpose**: Detailed view of specific analysis
- **Behavior**: Callback-based immediate data display
- **Features**:
  - Complete economic analysis breakdown
  - Trend projection with upper/lower bounds
  - Statistical metrics
  - AI analysis with key observations
  - Risk factors and economic interpretation

### History Page (`/history`)
- **Purpose**: Browse all previous analyses
- **Behavior**: Reads from localStorage history array
- **Features**:
  - Table view of all analyses
  - Filter by country and indicator
  - Sort by date (newest first)
  - View details or download JSON
  - Trigger new analysis from page

### Market Trends (`/trends`)
- **Purpose**: Visualize market trends and forecasts
- **Behavior**: Displays analysis trends when data available
- **Features**:
  - Trend metrics (direction, strength, volatility, confidence)
  - Trend progression area chart
  - Projected values bar chart
  - Market analysis summary

## Data Management

### localStorage Structure

**Key: `analysisPageData`**
```typescript
{
  success: boolean
  data: {
    indicator: string
    country: string
    latest_value: number
    change_pct: string
    trend: string
    forecast_direction: string
    alert_count: number
  }
  full_analysis: {
    metadata: { ... }
    statistics: { ... }
    ai_analysis: { ... }
    forecast: Array<{ date, value, type, confidence }>
    alerts: any
  }
  timestamp: string
}
```

**Key: `analysisHistory`**
```typescript
Array<{
  id: string // indicator name
  success: boolean
  data: { ... }
  full_analysis: { ... }
  timestamp: string
}>
```

### Data Flow

```
Trigger Analysis
    ↓
[AnalysisTriggerDialog] → n8n Webhook
    ↓
Validation & Processing
    ↓
Save to localStorage:
  - analysisPageData (current)
  - analysisHistory (append to array)
    ↓
Display on Page (no redirect)
    ↓
Callback onSuccess() → Update parent page state
```

## API Routes

### `/api/analysis/list`
Get list of analyses for a country
```bash
GET /api/analysis/list?country=US
```

### `/api/analysis/[id]`
Get full analysis by indicator
```bash
GET /api/analysis/INTEREST
```

### `/api/analysis/trigger`
Trigger new analysis
```bash
POST /api/analysis/trigger
Body: {
  indicator: string
  country: string
  startDate: string (YYYY-MM-DD)
  endDate: string (YYYY-MM-DD)
}
```

### `/api/analysis/[id]/download`
Download analysis as JSON
```bash
GET /api/analysis/INTEREST/download
```

## Key Components

### AnalysisTriggerDialog
Modal dialog for triggering new analyses
- Props: `onSuccess?: (data: N8nSingleResponse) => void`
- Features: Date validation, country selection, error handling

### MetricsGrid
Display key performance metrics
- Props: `metrics: Metric[]`
- Supports trend indicators (up/down)

### TrendLineChart
Area chart with confidence intervals
- Props: `data, series, type`
- Used for trend projection visualization

### TrendBarChart
Bar chart for discrete values
- Props: `data, title, color`
- Used for projected values/volume

### AnalysisHistoryTable
Table for browsing historical analyses
- Props: `analyses, onViewDetails, onDownload`
- Features: Sorting, filtering, actions

## Color Scheme

- **Primary Accent**: `#e15554` (Red)
- **Background**: Dark theme with muted backgrounds
- **Text**: High contrast for readability
- **Charts**: Red accent for all visualizations

## Error Handling

The application includes comprehensive error handling:
- Network error detection and user feedback
- JSON parsing validation
- Response structure validation
- User-facing toast notifications
- Console logging for debugging

See `lib/n8n.ts` for custom `N8nError` class with:
- Status code tracking
- Error categorization (network, parse, timeout, validation)
- 30-second request timeout

## Development Notes

### Client vs Server Components
- **Dashboard (`/`)**: Client component (reads localStorage)
- **Analysis (`/analysis`)**: Client component (state management)
- **History (`/history`)**: Client component (localStorage source)
- **Trends (`/trends`)**: Client component (localStorage source)

### No Automatic Data Fetching
- ✅ All pages use localStorage as data source
- ✅ No automatic API requests on page load
- ✅ User must explicitly trigger analysis
- ✅ Data persists across browser sessions

### localStorage as Temporary Database
- Replaces traditional API calls for history
- Provides immediate data availability
- Survives page refreshes
- Suitable for browser-based persistence
- Consider upgrading to database for production use

## Deployment

### Build
```bash
pnpm build
```

### Production Start
```bash
pnpm start
```

### Environment Variables (if needed)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest
- Requires localStorage support

## Future Enhancements

- [ ] Database integration (replace localStorage)
- [ ] User authentication and saved analyses
- [ ] Advanced filtering and search
- [ ] Custom date range selection
- [ ] Export to CSV/Excel
- [ ] Real-time data updates
- [ ] Comparative analysis tools
- [ ] Alert notifications

## Troubleshooting

### No data showing on Dashboard
- Check localStorage has `analysisPageData`
- Run analysis on `/analysis` page first
- Verify country filter matches analysis data

### Charts not displaying
- Ensure forecast data exists in analysis
- Check browser console for errors
- Verify chart components are imported

### History not persisting
- Check browser localStorage is enabled
- Verify `analysisHistory` key exists
- Clear and retry analysis trigger

### n8n Webhook Issues
- Verify webhook URL in `lib/n8n.ts`
- Check n8n webhook is active
- Validate payload structure matches expected format

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue or contact the development team.

---

**Last Updated**: January 7, 2026
**Version**: 1.0.0

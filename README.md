# UDSM Journal Analytics

**University of Dar es Salaam — OJS Journal Analytics Dashboard**

A comprehensive analytics dashboard for monitoring research impact, citations, and global reach across UDSM scholarly journals. Built as an OJS (Open Journal Systems) plugin.

## Features

- 📊 **Dashboard** — System-wide KPIs, world map, editorial funnel, top articles
- 📖 **Journals** — Per-journal metrics (publications, views, downloads, editorial stats)
- ⚖️ **Comparison** — Side-by-side journal comparison with radar, bar, and timeline charts
- 🔴 **Live Engagement** — Real-time visitor analytics powered by Matomo
- 🌍 **Public View** — Embeddable public-facing journal metrics
- ⚙️ **System Settings** — Configuration and API connection management

## Tech Stack

- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui
- **Charts**: Recharts · react-simple-maps
- **Data Sources**: OJS REST API · Matomo Analytics API · Crossref API
- **Auth**: JWT token via `apiToken` query parameter

## Getting Started

```sh
# Clone the repository
git clone https://github.com/FrankEWallace/udsmjournal_analytics.git

# Navigate to the project
cd udsmjournal_analytics

# Install dependencies
npm install

# Create .env.local with your config (see .env.example)

# Start dev server
npm run dev
```

## Deployment

The dashboard is deployed as an OJS plugin under:
`plugins/generic/udsmGlobalReach/`

## License

© 2026 University of Dar es Salaam. All rights reserved.

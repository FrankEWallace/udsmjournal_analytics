# Fast Statistics API Plugin for OJS

A high-performance statistics API plugin for Open Journal Systems (OJS) that provides instant access to pre-optimized statistics data.

## ⚡ Performance Comparison

| Endpoint | Default OJS API | Fast Stats API |
|----------|----------------|----------------|
| Get 100 publications with stats | ~120 seconds (TIMEOUT) | **< 1 second** |
| Get all counts | ~2-5 seconds | **< 0.1 seconds** |
| Complete dashboard data | ~30+ seconds | **< 0.5 seconds** |

## 📦 Installation

### Method 1: Copy Plugin Files

1. Copy the `fastStatsApi` folder to `plugins/generic/fastStatsApi/`
2. Copy `api/v1/fast-stats/` folder to your OJS `api/v1/fast-stats/`
3. Go to Settings > Website > Plugins
4. Enable "Fast Statistics API" in Generic Plugins

### Method 2: Git Clone

```bash
cd plugins/generic
git clone https://github.com/yourrepo/fastStatsApi.git

# Also copy API endpoint
cp -r fastStatsApi/api/v1/fast-stats ../../api/v1/
```

## 🚀 API Endpoints

All endpoints require Bearer token authentication. Base URL pattern:

```
http://your-ojs.com/index.php/{journal}/api/v1/fast-stats/{endpoint}
```

### Complete Dashboard (Single Call)

**GET `/fast-stats/dashboard`**

Returns all dashboard data in one optimized call:

```javascript
const response = await fetch(
  'http://localhost:8000/index.php/tjpsd/api/v1/fast-stats/dashboard',
  { headers: { 'Authorization': 'Bearer YOUR_API_KEY' }}
);
```

**Response:**
```json
{
  "counts": {
    "totalSubmissions": 456,
    "publishedArticles": 234,
    "activeSubmissions": 45,
    "totalIssues": 32,
    "publishedIssues": 28,
    "totalUsers": 1250
  },
  "downloads": {
    "abstractViews": 125000,
    "fileDownloads": 89000,
    "totalViews": 214000
  },
  "editorial": {
    "submissionsReceived": 456,
    "acceptanceRate": 51.3,
    "rejectionRate": 18.6
  },
  "users": {
    "totalUsers": 1250,
    "byRole": [
      { "roleName": "Author", "count": 567 },
      { "roleName": "Reviewer", "count": 234 }
    ]
  },
  "topPublications": [...],
  "recentPublications": [...],
  "publicationsByYear": [...],
  "viewsTimeline": [...],
  "lastUpdated": "2026-02-14 10:30:00"
}
```

### Individual Endpoints

#### Counts Only
**GET `/fast-stats/counts`**

```json
{
  "totalSubmissions": 456,
  "publishedArticles": 234,
  "activeSubmissions": 45,
  "declinedSubmissions": 67,
  "totalIssues": 32,
  "publishedIssues": 28,
  "totalUsers": 1250
}
```

#### All Journals (Site Admin)
**GET `/fast-stats/journals`**

```json
{
  "items": [
    {
      "id": 1,
      "path": "tjpsd",
      "name": "Journal of Policy Studies",
      "enabled": true,
      "totalSubmissions": 234,
      "publishedArticles": 180,
      "publishedIssues": 24
    }
  ],
  "itemsMax": 2
}
```

#### Aggregated Stats (All Journals)
**GET `/fast-stats/aggregated`**

```json
{
  "totalJournals": 2,
  "activeJournals": 2,
  "totalSubmissions": 456,
  "totalPublished": 380,
  "totalAbstractViews": 250000,
  "totalDownloads": 180000
}
```

#### Downloads
**GET `/fast-stats/downloads`**

```json
{
  "abstractViews": 125000,
  "fileDownloads": 89000,
  "totalViews": 214000
}
```

#### Downloads by Journal
**GET `/fast-stats/downloads/by-journal`**

```json
{
  "items": [
    {
      "journalId": 1,
      "path": "tjpsd",
      "name": "Journal Name",
      "abstractViews": 100000,
      "fileDownloads": 70000,
      "totalViews": 170000
    }
  ]
}
```

#### Views Over Time
**GET `/fast-stats/views/timeline?months=12`**

```json
[
  {
    "month": "202501",
    "date": "2025-01",
    "abstractViews": 10500,
    "fileDownloads": 7200,
    "totalViews": 17700
  }
]
```

#### Top Publications
**GET `/fast-stats/publications/top?limit=10`**

```json
{
  "items": [
    {
      "submissionId": 123,
      "title": "Article Title",
      "journalName": "Journal Name",
      "abstractViews": 5000,
      "fileDownloads": 3200,
      "totalViews": 8200
    }
  ]
}
```

#### Recent Publications
**GET `/fast-stats/publications/recent?limit=10`**

```json
{
  "items": [
    {
      "submissionId": 234,
      "title": "Recently Published Article",
      "datePublished": "2026-02-10",
      "sectionName": "Research Articles"
    }
  ]
}
```

#### All Publications (Paginated)
**GET `/fast-stats/publications?count=50&offset=0&orderBy=total_views&orderDirection=DESC`**

```json
{
  "items": [...],
  "itemsMax": 234
}
```

#### Publications by Year
**GET `/fast-stats/publications/by-year`**

```json
{
  "items": [
    { "year": 2026, "count": 45 },
    { "year": 2025, "count": 67 },
    { "year": 2024, "count": 52 }
  ]
}
```

#### User Statistics
**GET `/fast-stats/users`**

```json
{
  "totalUsers": 1250,
  "byRole": [
    { "roleId": 65536, "roleName": "Author", "count": 567 },
    { "roleId": 4096, "roleName": "Reviewer", "count": 234 },
    { "roleId": 1048576, "roleName": "Reader", "count": 350 }
  ]
}
```

#### Editorial Statistics
**GET `/fast-stats/editorial`**

```json
{
  "submissionsReceived": 456,
  "submissionsQueued": 45,
  "submissionsPublished": 234,
  "submissionsDeclined": 85,
  "submissionsScheduled": 12,
  "acceptanceRate": 51.3,
  "rejectionRate": 18.6
}
```

#### Citation Statistics
**GET `/fast-stats/citations`**

```json
{
  "available": true,
  "totalCitations": 1250,
  "publicationsWithCitations": 180
}
```

## 🔧 Query Parameters

### Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `journalId` | int | Specify journal ID (overrides context) |

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | int | 50 | Number of items to return (max: 200) |
| `offset` | int | 0 | Starting offset |
| `orderBy` | string | `total_views` | Sort field |
| `orderDirection` | string | `DESC` | Sort direction (ASC/DESC) |

### Timeline Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `months` | int | 12 | Number of months to include (max: 60) |

## 🔐 Authentication

All endpoints require Bearer token authentication:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}
```

Generate an API key:
1. Log in to OJS as admin
2. Go to Profile > API Key
3. Check "Enable external applications..."
4. Generate API Secret

## 📊 Role-Based Access

| Role | Available Endpoints |
|------|-------------------|
| Site Admin | All endpoints including `/journals`, `/aggregated`, `/downloads/by-journal` |
| Manager | All journal-specific endpoints |
| Sub Editor | All journal-specific endpoints |

## 🛠 Configuration

The plugin works out of the box with no configuration required.

### Optional: Scheduled Task

The plugin includes a scheduled task for cache warming. To enable:

1. Enable the `acron` plugin in OJS
2. Or add to your crontab:
```bash
0 * * * * php /path/to/ojs/tools/runScheduledTasks.php plugins/generic/fastStatsApi/scheduledTasks.xml
```

## 📁 File Structure

```
plugins/generic/fastStatsApi/
├── FastStatsApiPlugin.inc.php     # Main plugin class
├── index.php                       # Plugin loader
├── version.xml                     # Version info
├── settings.xml                    # Plugin settings
├── scheduledTasks.xml              # Scheduled tasks config
├── README.md                       # This file
├── api/
│   └── v1/
│       └── FastStatsHandler.inc.php  # API handler
├── classes/
│   └── FastStatsDAO.inc.php        # Database operations
├── locale/
│   └── en_US/
│       └── locale.xml              # Translations
└── tasks/
    └── FastStatsAggregationTask.inc.php  # Scheduled task

api/v1/fast-stats/
└── index.php                       # API entry point
```

## 🔄 Portability

To install on another OJS instance:

1. Copy `plugins/generic/fastStatsApi/` folder
2. Copy `api/v1/fast-stats/` folder
3. Enable plugin in admin panel

No database changes or core modifications required!

## 📝 License

GNU General Public License v3.0

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests.

## 📧 Support

For issues, please create a GitHub issue with:
- OJS version
- PHP version
- Error messages
- Steps to reproduce

---

**Version:** 1.0.0  
**Compatibility:** OJS 3.3.x  
**Author:** Fast Stats API Plugin Contributors

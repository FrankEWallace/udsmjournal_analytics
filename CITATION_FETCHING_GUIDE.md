# Citation Fetching Service - Guide

## 📖 Overview

The Fast Stats API plugin includes **two citation services** that pull citation counts from external sources:

1. **Crossref API** - For publications **with DOIs** (most accurate)
2. **OpenAlex API** - For publications **without DOIs** (uses title matching)

Citation data is stored in the `fast_stats_citation_counts` database table and cached for fast retrieval.

---

## 🔄 How It Works

### Automatic Mode (Scheduled Task)

The plugin automatically fetches citations **daily at 3 AM** when the scheduled task is enabled.

**Configuration:** `scheduledTasks.xml`
```xml
<task class="plugins.generic.fastStatsApi.classes.CrossrefCitationTask">
  <frequency hour="3" />
  <args>
    <arg>admin@yourjournal.org</arg>  <!-- Your email for polite pool -->
    <arg>50</arg>                      <!-- Batch size: 50 publications per run -->
  </args>
</task>
```

**To Enable Automatic Fetching:**

**Option 1: Using Acron Plugin (Easiest)**
```
1. In OJS Admin → Plugins → Generic Plugins
2. Enable "Acron Plugin"
3. Done! Tasks run automatically on page visits
```

**Option 2: Using System Cron**
```bash
# Add to crontab (Linux/Mac)
0 * * * * php /path/to/ojs/tools/runScheduledTasks.php plugins/generic/fastStatsApi/scheduledTasks.xml

# Or Windows Task Scheduler
php C:\path\to\ojs\tools\runScheduledTasks.php plugins/generic/fastStatsApi/scheduledTasks.xml
```

---

## 🚀 Manual Activation

### Method 1: Via API Endpoint (Recommended)

You can trigger citation fetching manually using the API endpoints.

#### Fetch from Crossref (for DOIs)

```powershell
# PowerShell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?limit=100&email=your@email.com" `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

```bash
# Bash/cURL
curl -X POST "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?limit=100&email=your@email.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Parameters:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `onlyMissing` | `true` | Only fetch for publications without citation data |
| `limit` | `100` | Max publications to process (max: 500) |
| `email` | `null` | Your email for Crossref polite pool (recommended) |
| `journalId` | `null` | Limit to specific journal |

**Response:**
```json
{
  "success": true,
  "message": "Processed 100 publications",
  "processed": 100,
  "successful": 95,
  "failed": 5,
  "results": [
    {
      "doi": "10.1234/example.001",
      "title": "Article Title",
      "citationCount": 15,
      "status": "success"
    }
  ],
  "log": [
    "SUCCESS: DOI 10.1234/example.001 has 15 citations"
  ]
}
```

#### Fetch from OpenAlex (for publications without DOIs)

```powershell
# PowerShell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch-openalex?limit=50&email=your@email.com" `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

**Parameters:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `onlyMissing` | `true` | Only fetch for publications without citation data |
| `limit` | `50` | Max publications to process (max: 200) |
| `email` | `null` | Your email for OpenAlex API |
| `includeWithDoi` | `false` | Also search publications that have DOIs |
| `journalId` | `null` | Limit to specific journal |

---

### Method 2: Via Command Line

Run the scheduled task manually from the command line:

```bash
# Navigate to OJS directory
cd /path/to/ojs

# Run the scheduled task
php tools/runScheduledTasks.php plugins/generic/fastStatsApi/scheduledTasks.xml
```

```powershell
# Windows PowerShell
cd C:\path\to\ojs
php tools\runScheduledTasks.php plugins\generic\fastStatsApi\scheduledTasks.xml
```

---

## 🎯 Step-by-Step: First Time Setup

### Complete Citation Fetch Process

```powershell
# 1. Get your API token first
$token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.YOUR_TOKEN_HERE"
$email = "admin@yourjournal.com"
$baseUrl = "http://localhost:8000/tjpsd/api/v1/fast-stats"

# 2. Check which publications have DOIs
$pubsWithDois = Invoke-RestMethod -Uri "$baseUrl/citations/dois" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Publications with DOIs: $($pubsWithDois.itemsMax)"

# 3. Fetch Crossref citations for publications with DOIs
Write-Host "Fetching Crossref citations..."
$crossrefResult = Invoke-RestMethod -Method POST `
  -Uri "$baseUrl/citations/fetch?limit=200&email=$email" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Crossref: $($crossrefResult.successful) successful, $($crossrefResult.failed) failed"

# 4. Check publications without DOIs
$pubsWithoutDois = Invoke-RestMethod -Uri "$baseUrl/citations/no-doi" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Publications without DOIs: $($pubsWithoutDois.itemsMax)"

# 5. Fetch OpenAlex citations for publications without DOIs
Write-Host "Fetching OpenAlex citations..."
$openalexResult = Invoke-RestMethod -Method POST `
  -Uri "$baseUrl/citations/fetch-openalex?limit=50&email=$email" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "OpenAlex: $($openalexResult.found) found, $($openalexResult.notFound) not found"

# 6. View all citations
$allCitations = Invoke-RestMethod -Uri "$baseUrl/citations/all" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "Total citations indexed: $($allCitations.summary.totalCitations)"
Write-Host "Publications with citations: $($allCitations.summary.publicationsWithCitations)"
```

---

## 📊 View Citation Data

### Get All Citations

```powershell
GET /api/v1/fast-stats/citations/all
```

**Parameters:**
- `count` - Number of results (default: 50)
- `offset` - Pagination offset
- `orderBy` - Sort by: `citation_count`, `last_updated`, `title`, `date_published`
- `orderDirection` - `ASC` or `DESC`

**Example:**
```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/all?orderBy=citation_count&orderDirection=DESC&count=20" `
  -Headers @{Authorization="Bearer $token"}
```

### Get Summary Statistics

```powershell
GET /api/v1/fast-stats/citations
```

**Response:**
```json
{
  "available": true,
  "totalCitations": 1250,
  "publicationsWithCitations": 180,
  "lastUpdated": "2026-02-14 14:30:00"
}
```

---

## 🔧 Advanced Options

### Clear Citation Cache (Before Refresh)

```powershell
# Clear all citations
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/clear" `
  -Headers @{Authorization="Bearer $token"}

# Then fetch fresh data
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?limit=500" `
  -Headers @{Authorization="Bearer $token"}
```

### Fetch Only Missing Citations

```powershell
# Only fetch for publications that don't have citation data yet
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?onlyMissing=true" `
  -Headers @{Authorization="Bearer $token"}
```

### Force Update All Citations

```powershell
# Fetch for all publications, even those with existing data
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?onlyMissing=false&limit=500" `
  -Headers @{Authorization="Bearer $token"}
```

---

## ⚙️ Rate Limits & Best Practices

### Crossref API
- **Default limit:** 50 requests/second
- **With polite pool (email):** Higher limits + priority queue
- **Built-in delay:** 100ms between requests (10/second) for safety
- **Best practice:** Always provide your email in requests

### OpenAlex API
- **Default limit:** ~10 requests/second
- **With polite pool (email):** 100 requests/second
- **Built-in delay:** 100ms between requests
- **Best practice:** 
  - Use for publications without DOIs only
  - Provide email for better rate limits
  - Title matching requires at least 10 characters

### Recommendations
1. **Provide your email** - Gets you into the "polite pool" with better limits
2. **Use scheduled tasks** - Automatic daily updates are better than bulk fetching
3. **Fetch Crossref first** - More accurate for DOI-based articles
4. **OpenAlex as backup** - Only for articles without DOIs
5. **Monitor rate limits** - The plugin respects rate limits automatically

---

## 📝 Example Workflow

### Initial Setup (One-time)

```powershell
# 1. Fetch all Crossref citations (publications with DOIs)
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?limit=500&email=admin@journal.com" `
  -Headers @{Authorization="Bearer $token"}

# 2. Fetch OpenAlex citations (publications without DOIs)
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch-openalex?limit=100&email=admin@journal.com" `
  -Headers @{Authorization="Bearer $token"}

# 3. View results
Invoke-RestMethod `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/all" `
  -Headers @{Authorization="Bearer $token"}
```

### Monthly Refresh

```powershell
# Update only new publications (onlyMissing=true)
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?onlyMissing=true" `
  -Headers @{Authorization="Bearer $token"}
```

### Complete Refresh (Annual)

```powershell
# 1. Clear cache
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/clear" `
  -Headers @{Authorization="Bearer $token"}

# 2. Fetch all citations again
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/citations/fetch?limit=500&onlyMissing=false" `
  -Headers @{Authorization="Bearer $token"}
```

---

## 🐛 Troubleshooting

### Citations Not Appearing

1. **Check if publications have DOIs:**
   ```powershell
   GET /api/v1/fast-stats/citations/dois
   ```

2. **Check for publications without DOIs:**
   ```powershell
   GET /api/v1/fast-stats/citations/no-doi
   ```

3. **Check citation fetch logs in response**

### Rate Limit Errors

- **Symptom:** "429 Too Many Requests" errors
- **Solution:** 
  - Add your email to requests
  - Reduce batch size (use smaller `limit`)
  - Wait a few minutes between batches

### No Citations Found

- **For Crossref:** Check if DOI is valid and exists in Crossref
- **For OpenAlex:** Check if title is at least 10 characters and publication is indexed

---

## 📧 Contact Information

When using the APIs, it's **highly recommended** to provide your email:

```powershell
# Good - with email
?email=admin@yourjournal.org

# Less good - without email (slower, lower limits)
```

**Why provide email?**
- ✅ Gets you into "polite pool" with higher rate limits
- ✅ Priority access during high traffic
- ✅ API providers can contact you if issues arise
- ✅ Shows you're using the API responsibly

---

## 🎯 Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/citations/fetch` | POST | Fetch Crossref citations (DOIs) |
| `/citations/fetch-openalex` | POST | Fetch OpenAlex citations (titles) |
| `/citations/all` | GET | View all citations |
| `/citations/dois` | GET | List publications with DOIs |
| `/citations/no-doi` | GET | List publications without DOIs |
| `/citations/clear` | POST | Clear citation cache |
| `/citations` | GET | Get citation summary |

---

**Last Updated:** February 14, 2026  
**Version:** 1.1.0

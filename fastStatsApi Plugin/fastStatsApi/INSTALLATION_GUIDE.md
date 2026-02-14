# Fast Stats API - Installation & Standalone Guide

## 📦 Installation as OJS Plugin (Recommended)

### Prerequisites
- Open Journal Systems (OJS) 3.3.0 or higher
- PHP 7.3 or higher
- MySQL 5.7+ or MariaDB 10.2+
- API key secret configured in OJS (`config.inc.php`)

### Installation Steps

#### Step 1: Copy Plugin Files

1. **Copy the plugin folder** to your OJS installation:
   ```bash
   cp -r fastStatsApi /path/to/ojs/plugins/generic/
   ```
   
   Or on Windows:
   ```powershell
   Copy-Item -Recurse fastStatsApi "C:\path\to\ojs\plugins\generic\"
   ```

2. **Copy the API endpoint handler**:
   ```bash
   cp -r fastStatsApi/api/v1/fast-stats /path/to/ojs/api/v1/
   ```
   
   Or on Windows:
   ```powershell
   Copy-Item -Recurse fastStatsApi\api\v1\fast-stats "C:\path\to\ojs\api\v1\"
   ```

#### Step 2: Install Database Schema

The plugin creates its database tables automatically when enabled. It adds:
- `fast_stats_citation_counts` - For storing citation data from Crossref/OpenAlex

#### Step 3: Enable the Plugin

1. Log in to OJS as **Site Administrator**
2. Navigate to: **Settings → Website → Plugins → Generic Plugins**
3. Find "**Fast Statistics API**" in the list
4. Click the checkbox to **Enable** the plugin

#### Step 4: Generate API Token

**Method 1: Via OJS UI**
```
1. Log in as admin
2. Go to: User Profile → API Key
3. Check: "Enable external applications with the API key to access this account"
4. Click: "Create API Key" or "Regenerate API Key"
5. Copy the JWT token displayed
```

**Method 2: Via PHP Script**
```php
<?php
// generate_token.php
require('lib/pkp/lib/vendor/autoload.php');
use Firebase\JWT\JWT;

$config = parse_ini_file('config.inc.php', true);
$secret = $config['security']['api_key_secret'];

$pdo = new PDO(
    "mysql:host={$config['database']['host']};dbname={$config['database']['name']}",
    $config['database']['username'],
    $config['database']['password']
);

// Replace with your user ID
$userId = 1;
$stmt = $pdo->prepare("SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_name = 'apiKey'");
$stmt->execute([$userId]);
$row = $stmt->fetch();
$apiKey = $row['setting_value'];

$jwt = JWT::encode($apiKey, $secret, 'HS256');
echo "JWT Token: " . $jwt . "\n";
```

#### Step 5: Test the API

```bash
# Test the counts endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://your-ojs.com/index.php/journal-path/api/v1/fast-stats/counts
```

PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/tjpsd/api/v1/fast-stats/counts" `
  -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

### Post-Installation Configuration

#### Optional: Enable Scheduled Tasks (Recommended)

For automatic cache warming and citation updates:

**Method 1: Using Acron Plugin (Easiest)**
1. Enable the `acron` plugin in OJS
2. The plugin will automatically run hourly

**Method 2: System Cron**
```bash
# Add to crontab
0 * * * * php /path/to/ojs/tools/runScheduledTasks.php plugins/generic/fastStatsApi/scheduledTasks.xml
```

---

## 🔧 Making Fast Stats API Standalone

To use the Fast Stats API **outside of OJS** as a standalone service, you need to:

### Architecture Overview

**Current Design:**
```
OJS Installation
├── OJS Core (Authentication, Database Access)
├── plugins/generic/fastStatsApi/
│   └── FastStatsApiPlugin.inc.php (depends on OJS classes)
└── api/v1/fast-stats/
    └── index.php (uses OJS routing)
```

**Standalone Design:**
```
Standalone API Service
├── FastStatsAPI/
│   ├── config.php (database, JWT secret)
│   ├── index.php (entry point)
│   ├── auth/
│   │   └── jwt.php (authentication)
│   ├── database/
│   │   └── connection.php
│   └── endpoints/
│       ├── counts.php
│       ├── downloads.php
│       └── publications.php
```

### Conversion Steps

#### Step 1: Extract Database Queries

The plugin uses `FastStatsDAO.inc.php` which extends OJS DAO classes. You need to:

1. **Extract raw SQL queries** from `classes/FastStatsDAO.inc.php`
2. **Replace OJS DAO methods** with plain PDO
3. **Remove OJS dependencies** like `DAORegistry`, `Application`

#### Step 2: Create Standalone Authentication

Create `auth/jwt.php`:
```php
<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTAuth {
    private $secret;
    
    public function __construct($secret) {
        $this->secret = $secret;
    }
    
    public function validateToken() {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            die(json_encode(['error' => 'No authorization header']));
        }
        
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        
        try {
            $decoded = JWT::decode($token, new Key($this->secret, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            die(json_encode(['error' => 'Invalid token']));
        }
    }
}
```

#### Step 3: Create Configuration File

Create `config.php`:
```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'name' => 'ojs_database',
        'username' => 'ojs_user',
        'password' => 'ojs_password',
        'charset' => 'utf8mb4'
    ],
    'jwt' => [
        'secret' => 'your-jwt-secret-from-ojs-config'
    ],
    'api' => [
        'version' => '1.0.0',
        'base_path' => '/api/v1/fast-stats'
    ]
];
```

#### Step 4: Create Database Connection

Create `database/connection.php`:
```php
<?php
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct($config) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $config['host'],
            $config['name'],
            $config['charset']
        );
        
        $this->pdo = new PDO(
            $dsn,
            $config['username'],
            $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
    }
    
    public static function getInstance($config) {
        if (self::$instance === null) {
            self::$instance = new self($config);
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}
```

#### Step 5: Create Standalone Endpoints

Create `endpoints/counts.php`:
```php
<?php
class CountsEndpoint {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getCounts($journalId = null) {
        $whereClause = $journalId ? "WHERE s.context_id = ?" : "";
        
        $sql = "
            SELECT 
                COUNT(DISTINCT s.submission_id) as totalSubmissions,
                SUM(CASE WHEN s.status = 3 THEN 1 ELSE 0 END) as publishedArticles,
                SUM(CASE WHEN s.status IN (1,4) THEN 1 ELSE 0 END) as activeSubmissions,
                SUM(CASE WHEN s.status = 4 THEN 1 ELSE 0 END) as declinedSubmissions
            FROM submissions s
            {$whereClause}
        ";
        
        $stmt = $this->db->prepare($sql);
        if ($journalId) {
            $stmt->execute([$journalId]);
        } else {
            $stmt->execute();
        }
        
        return $stmt->fetch();
    }
}
```

#### Step 6: Create Main Entry Point

Create `index.php`:
```php
<?php
require_once 'vendor/autoload.php';
require_once 'config.php';
require_once 'auth/jwt.php';
require_once 'database/connection.php';
require_once 'endpoints/counts.php';
// ... other endpoints

$config = require 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Authentication
$auth = new JWTAuth($config['jwt']['secret']);
$auth->validateToken();

// Get request path
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = $config['api']['base_path'];
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

// Database connection
$db = Database::getInstance($config['database'])->getConnection();

// Route requests
try {
    switch ($path) {
        case 'counts':
            $endpoint = new CountsEndpoint($db);
            $result = $endpoint->getCounts();
            echo json_encode($result);
            break;
            
        case 'downloads':
            // Implement downloads endpoint
            break;
            
        // ... other endpoints
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
```

#### Step 7: Install Dependencies

Create `composer.json`:
```json
{
    "name": "fast-stats/api",
    "description": "Standalone Fast Stats API",
    "require": {
        "php": ">=7.3",
        "firebase/php-jwt": "^6.0"
    },
    "autoload": {
        "psr-4": {
            "FastStats\\": "src/"
        }
    }
}
```

Install:
```bash
composer install
```

#### Step 8: Configure Web Server

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

**Nginx:**
```nginx
location /api/v1/fast-stats {
    try_files $uri $uri/ /index.php?$query_string;
}
```

**PHP Built-in Server (Development):**
```bash
php -S localhost:8000
```

---

## 🎯 Which Approach to Use?

### Use OJS Plugin When:
✅ You have an existing OJS installation  
✅ You want easy installation and updates  
✅ You need OJS authentication and permissions  
✅ You want automatic database schema management  

### Use Standalone API When:
✅ You need to serve multiple OJS instances  
✅ You want to host the API separately  
✅ You need custom authentication  
✅ You want to optimize infrastructure independently  

---

## 🔍 Key Differences

| Feature | OJS Plugin | Standalone |
|---------|-----------|------------|
| **Installation** | Copy to plugins folder | Deploy as separate app |
| **Authentication** | OJS JWT tokens | Custom JWT or other auth |
| **Database Access** | OJS DAO layer | Direct PDO |
| **Updates** | Via OJS plugin system | Manual deployment |
| **Performance** | Depends on OJS | Can be optimized independently |
| **Maintenance** | Minimal | More complex |

---

## 📝 Notes

### For OJS Plugin Installation:
- The plugin automatically creates database tables when enabled
- No OJS core modifications required
- Works with existing OJS authentication
- Respects OJS role-based permissions

### For Standalone Conversion:
- Requires significant PHP development work
- You'll need to maintain the codebase separately
- Must handle authentication independently
- Need to manage database schema migrations
- Consider using an API framework (Slim, Lumen) for better structure

---

## 🚀 Quick Start (OJS Plugin)

```bash
# 1. Copy files
cp -r fastStatsApi /var/www/ojs/plugins/generic/
cp -r fastStatsApi/api/v1/fast-stats /var/www/ojs/api/v1/

# 2. Enable in OJS admin panel

# 3. Generate token
php generate_token.php

# 4. Test
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-ojs.com/index.php/journal/api/v1/fast-stats/counts
```

---

## 📧 Support

For installation issues:
1. Check OJS error logs: `files/usageStats/`
2. Check PHP error log
3. Verify database credentials
4. Ensure JWT secret is configured in `config.inc.php`

---

**Last Updated:** February 14, 2026  
**Version:** 1.1.0

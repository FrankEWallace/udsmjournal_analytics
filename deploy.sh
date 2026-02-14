#!/bin/bash

# ============================================
# UDSM Global Reach Dashboard - Deploy Script
# ============================================
# This script builds the React app and deploys 
# the complete plugin to your OJS installation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
OJS_PATH="/Applications/MAMP/htdocs/journals_multiple"
PLUGIN_NAME="udsmGlobalReach"
PLUGIN_DEST="$OJS_PATH/plugins/generic/$PLUGIN_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  UDSM Global Reach Dashboard - Deploy Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if OJS exists
if [ ! -d "$OJS_PATH" ]; then
    echo -e "${RED}Error: OJS installation not found at $OJS_PATH${NC}"
    echo "Please update the OJS_PATH variable in this script."
    exit 1
fi

echo -e "${YELLOW}Step 1: Building React application...${NC}"
cd "$PROJECT_ROOT"
npm run build

if [ ! -d "$PROJECT_ROOT/dist" ]; then
    echo -e "${RED}Error: Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ React app built successfully${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating plugin directory...${NC}"
mkdir -p "$PLUGIN_DEST"
mkdir -p "$PLUGIN_DEST/handlers"
mkdir -p "$PLUGIN_DEST/forms"
mkdir -p "$PLUGIN_DEST/templates"
mkdir -p "$PLUGIN_DEST/locale/en_US"
mkdir -p "$PLUGIN_DEST/frontend"

echo -e "${GREEN}✓ Plugin directory structure created${NC}"
echo ""

echo -e "${YELLOW}Step 3: Copying plugin PHP files...${NC}"
cp "$PROJECT_ROOT/ojs-plugin/index.php" "$PLUGIN_DEST/"
cp "$PROJECT_ROOT/ojs-plugin/version.xml" "$PLUGIN_DEST/"
cp "$PROJECT_ROOT/ojs-plugin/UdsmGlobalReachPlugin.php" "$PLUGIN_DEST/"
cp "$PROJECT_ROOT/ojs-plugin/handlers/"*.php "$PLUGIN_DEST/handlers/"
cp "$PROJECT_ROOT/ojs-plugin/forms/"*.php "$PLUGIN_DEST/forms/"
cp "$PROJECT_ROOT/ojs-plugin/templates/"*.tpl "$PLUGIN_DEST/templates/"
cp "$PROJECT_ROOT/ojs-plugin/locale/en_US/"*.xml "$PLUGIN_DEST/locale/en_US/"

echo -e "${GREEN}✓ PHP files copied${NC}"
echo ""

echo -e "${YELLOW}Step 4: Copying built React app...${NC}"
cp -r "$PROJECT_ROOT/dist/"* "$PLUGIN_DEST/frontend/"

echo -e "${GREEN}✓ React app deployed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Setting permissions...${NC}"
chmod -R 755 "$PLUGIN_DEST"
chmod 644 "$PLUGIN_DEST"/*.php
chmod 644 "$PLUGIN_DEST"/*.xml
chmod 644 "$PLUGIN_DEST/handlers/"*.php
chmod 644 "$PLUGIN_DEST/forms/"*.php
chmod 644 "$PLUGIN_DEST/templates/"*.tpl

echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Plugin installed to: ${YELLOW}$PLUGIN_DEST${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Go to OJS Admin → Website → Plugins → Generic Plugins"
echo "2. Find 'UDSM Global Reach Dashboard' and enable it"
echo "3. Access the dashboard at: /[journal-path]/globalreach"
echo ""
echo -e "Example URL: ${BLUE}http://localhost:8888/journals_multiple/index.php/[journal]/globalreach${NC}"
echo ""

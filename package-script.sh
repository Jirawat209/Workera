#!/bin/bash

# Workera Package Script
# สร้าง package สำหรับย้ายไปเครื่องอื่น

echo "🚀 Creating Workera Package..."

# สร้างชื่อไฟล์ตามวันที่
DATE=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="workera-package-${DATE}.zip"

# สร้าง zip ไม่รวม node_modules, .git, dist, .env
echo "📦 Packaging files..."
zip -r "$PACKAGE_NAME" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x ".env" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "coverage/*" \
  -x ".vscode/*" \
  -x "*.zip"

echo "✅ Package created: $PACKAGE_NAME"
echo ""
echo "📋 Next Steps:"
echo "1. Copy $PACKAGE_NAME to your new machine"
echo "2. Extract: unzip $PACKAGE_NAME -d Workera"
echo "3. Follow instructions in SETUP_NEW_MACHINE.md"
echo ""
echo "📄 File size: $(du -h "$PACKAGE_NAME" | cut -f1)"

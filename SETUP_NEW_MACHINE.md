# 🚀 Setup Workera บนเครื่องใหม่

คู่มือนี้จะแนะนำวิธีการติดตั้ง Workera บนเครื่องใหม่ และเปลี่ยน Database Account

---

## 📋 สิ่งที่ต้องเตรียม

### 1. Software Requirements
- **Node.js** v18 หรือสูงกว่า ([ดาวน์โหลด](https://nodejs.org/))
- **Git** ([ดาวน์โหลด](https://git-scm.com/))
- **Code Editor** (แนะนำ VS Code)

### 2. Supabase Account (ถ้าต้องการเปลี่ยน Database)
- สร้าง account ที่ [supabase.com](https://supabase.com)
- สร้าง project ใหม่

---

## 📦 วิธีที่ 1: Clone จาก GitHub (แนะนำ)

### Step 1: Clone Repository

```bash
# Clone โปรเจค
git clone https://github.com/Jirawat209/Workera.git

# เข้าไปในโฟลเดอร์
cd Workera
```

### Step 2: ติดตั้ง Dependencies

```bash
# ติดตั้ง packages ทั้งหมด
npm install
```

### Step 3: Setup Environment Variables

```bash
# Copy .env.example เป็น .env
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **หา Supabase Credentials:**
> 1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
> 2. เลือก Project ของคุณ
> 3. ไปที่ Settings → API
> 4. Copy `URL` และ `anon public` key

### Step 4: Setup Database Schema

```bash
# ไปที่ Supabase SQL Editor
# Copy และรัน script นี้:
```

เลือก 1 ใน 2 วิธี:

**วิธีที่ 1: ใช้ All-in-One Script (แนะนำ)**
```bash
# รัน scripts/setup_complete.sql ใน Supabase SQL Editor
```

**วิธีที่ 2: รันทีละไฟล์**
```bash
# รันตามลำดับ:
1. db_schema.sql
2. scripts/activity_logs_schema.sql
3. scripts/delete_user_function.sql
4. scripts/trigger_user_signup_log.sql
5. scripts/trigger_workspace_board_logs.sql
```

### Step 5: รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173`

---

## 📦 วิธีที่ 2: ใช้ ZIP Package

### Step 1: สร้าง Package

```bash
# รันคำสั่งนี้ในเครื่องเดิม
npm run package
```

หรือสร้างด้วยตนเอง:

```bash
# สร้าง zip ไม่รวม node_modules และ .git
zip -r workera-package.zip . -x "node_modules/*" ".git/*" "dist/*" ".env"
```

### Step 2: ย้ายไปเครื่องใหม่

1. Copy `workera-package.zip` ไปเครื่องใหม่
2. แตก zip:
   ```bash
   unzip workera-package.zip -d Workera
   cd Workera
   ```

### Step 3: ติดตั้งและ Setup

```bash
# ติดตั้ง dependencies
npm install

# Copy .env.example เป็น .env
cp .env.example .env

# แก้ไข .env ให้ตรงกับ Supabase ของคุณ
```

### Step 4: Setup Database และรัน

ทำตาม Step 4-5 ของวิธีที่ 1

---

## 🔄 เปลี่ยน Database Account

### กรณีที่ 1: ใช้ Supabase Project ใหม่

1. **สร้าง Supabase Project ใหม่**
   - ไปที่ [Supabase Dashboard](https://app.supabase.com)
   - คลิก "New Project"
   - ตั้งชื่อและรอให้สร้างเสร็จ (~2 นาที)

2. **อัพเดท .env**
   ```env
   VITE_SUPABASE_URL=https://new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=new-anon-key-here
   ```

3. **Setup Database Schema**
   - ไปที่ SQL Editor ใน Supabase
   - รัน `scripts/setup_complete.sql`

4. **Restart Development Server**
   ```bash
   # หยุด server (Ctrl+C)
   npm run dev
   ```

### กรณีที่ 2: ใช้ Database เดิมแต่ต้องการ Reset

1. **ลบข้อมูลเก่า (ระวัง!)**
   ```sql
   -- รันใน Supabase SQL Editor
   TRUNCATE TABLE items CASCADE;
   TRUNCATE TABLE columns CASCADE;
   TRUNCATE TABLE groups CASCADE;
   TRUNCATE TABLE boards CASCADE;
   TRUNCATE TABLE workspaces CASCADE;
   TRUNCATE TABLE board_members CASCADE;
   TRUNCATE TABLE workspace_members CASCADE;
   TRUNCATE TABLE notifications CASCADE;
   TRUNCATE TABLE activity_logs CASCADE;
   ```

2. **รัน Schema ใหม่**
   ```bash
   # รัน scripts/setup_complete.sql
   ```

---

## 🏗️ Build สำหรับ Production

### Build Static Files

```bash
# Build โปรเจค
npm run build

# ไฟล์จะอยู่ในโฟลเดอร์ dist/
```

### Deploy ไป Vercel (แนะนำ)

```bash
# ติดตั้ง Vercel CLI
npm install -g vercel

# Deploy
vercel

# ตั้งค่า Environment Variables ใน Vercel Dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Deploy ไป Netlify

```bash
# ติดตั้ง Netlify CLI
npm install -g netlify-cli

# Build และ Deploy
npm run build
netlify deploy --prod --dir=dist

# ตั้งค่า Environment Variables ใน Netlify Dashboard
```

---

## 🔧 Troubleshooting

### ปัญหา: "Missing Supabase credentials"

**แก้ไข:**
- ตรวจสอบว่าไฟล์ `.env` มีอยู่
- ตรวจสอบว่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ถูกต้อง
- Restart development server

### ปัญหา: "npm install" ล้มเหลว

**แก้ไข:**
```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install
```

### ปัญหา: Database Schema Error

**แก้ไข:**
- ตรวจสอบว่ารัน SQL scripts ครบทุกไฟล์
- ลองรัน `scripts/setup_complete.sql` ใหม่
- ตรวจสอบ Supabase logs ใน Dashboard → Logs

### ปัญหา: Login ไม่ได้

**แก้ไข:**
- ตรวจสอบว่า Supabase Authentication เปิดอยู่
- ไปที่ Supabase Dashboard → Authentication → Providers
- เปิด Email provider

---

## 📝 Checklist การติดตั้ง

- [ ] ติดตั้ง Node.js v18+
- [ ] Clone/แตก ZIP โปรเจค
- [ ] รัน `npm install`
- [ ] สร้างไฟล์ `.env` และใส่ Supabase credentials
- [ ] รัน SQL schema ใน Supabase
- [ ] เปิด Email Authentication ใน Supabase
- [ ] รัน `npm run dev`
- [ ] ทดสอบ login/signup

---

## 🎯 Quick Start (สรุป)

```bash
# 1. Clone
git clone https://github.com/Jirawat209/Workera.git
cd Workera

# 2. Install
npm install

# 3. Setup .env
cp .env.example .env
# แก้ไข .env ให้ตรงกับ Supabase ของคุณ

# 4. Setup Database
# รัน scripts/setup_complete.sql ใน Supabase SQL Editor

# 5. Run
npm run dev
```

---

## 📞 ต้องการความช่วยเหลือ?

- **Documentation:** [README.md](./README.md)
- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **GitHub Issues:** [Workera Issues](https://github.com/Jirawat209/Workera/issues)

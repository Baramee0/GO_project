# Production Deployment Guide

## 🚀 Quick Start

### 1. Build และรัน Production Environment

```bash
# Stop development services ก่อน
docker-compose down

# Build และรัน production
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. ตรวจสอบสถานะ

```bash
# ดู logs
docker-compose -f docker-compose.prod.yml logs -f

# ดูสถานะ services
docker-compose -f docker-compose.prod.yml ps
```

### 3. เข้าใช้งาน

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Database:** localhost:5432 (ไม่ expose ออกนอก - ปลอดภัย)

---

## 📋 Migration และ Seed Data

### รัน Migration

```bash
# เข้าไปใน backend container
docker exec -it taskmanagement_backend_prod sh

# รัน migration
./server migrate

# หรือรันจากนอก
docker exec taskmanagement_backend_prod ./server migrate
```

### Seed Admin User

```bash
# เข้าไปใน backend container
docker exec -it taskmanagement_backend_prod sh

# รัน seed
go run cmd/seed_admin/main.go
```

---

## 🧪 Testing Checklist

- [ ] Database เชื่อมต่อได้
- [ ] Backend API ตอบกลับ (http://localhost:8080/health)
- [ ] Frontend โหลดได้
- [ ] Login ทำงาน
- [ ] สร้าง Project ได้
- [ ] สร้าง Task ได้
- [ ] Assign Task ได้
- [ ] Admin Panel ทำงาน

---

## 🛑 Stop Services

```bash
# Stop และลบ containers
docker-compose -f docker-compose.prod.yml down

# Stop และลบ volumes (ลบข้อมูลทั้งหมด)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 🔧 Troubleshooting

### Backend ไม่เชื่อม Database

```bash
# ดู logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Frontend ไม่เชื่อม Backend

```bash
# ตรวจสอบ environment variables
docker exec taskmanagement_frontend_prod env | grep API

# Rebuild frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### Database Migration ล้มเหลว

```bash
# เข้าไปใน database
docker exec -it taskmanagement_db_prod psql -U postgres -d taskmanagement

# ตรวจสอบ tables
\dt

# ออกจาก psql
\q
```

---

## 📊 Monitoring

### ดู Resource Usage

```bash
docker stats
```

### ดู Logs แบบ Real-time

```bash
# ทุก services
docker-compose -f docker-compose.prod.yml logs -f

# เฉพาะ backend
docker-compose -f docker-compose.prod.yml logs -f backend

# เฉพาะ frontend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

---

## 🔒 Security Notes

**สำคัญ! ก่อน Deploy จริง:**

1. เปลี่ยน `JWT_SECRET` ใน docker-compose.prod.yml
2. เปลี่ยน `POSTGRES_PASSWORD`
3. ใช้ HTTPS (ติดตั้ง SSL certificate)
4. ตั้งค่า firewall
5. ใช้ environment variables แทนค่าใน file

---

## 📝 Next Steps

1. ทดสอบทุก features
2. เช็ค performance
3. Setup CI/CD (GitHub Actions)
4. Deploy to cloud (AWS, GCP, Azure)
5. Setup monitoring (Prometheus, Grafana)

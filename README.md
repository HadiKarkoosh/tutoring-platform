# منصة الدروس الخصوصية

منصة حجز دروس: طلاب يتصفحون المدرّسين حسب المادة ويحجزون مواعيد متاحة، ومدرّسون يديرون مواعيدهم وحجوزاتهم.

## التقنيات

| الجزء | التقنية |
|---|---|
| Backend | Nest.js + TypeORM + SQLite (better-sqlite3) + JWT |
| Frontend | Next.js 14 (App Router) + React 18 |

## التشغيل

### 1. الباك اند (المنفذ 4000)

```bash
cd backend
npm install
npm run start:dev
```

قاعدة البيانات SQLite تُنشأ تلقائياً (`tutoring.sqlite`) مع بذر المواد الافتراضية.

### 2. الفرونت اند (المنفذ 3000)

```bash
cd frontend
npm install
npm run dev
```

افتح http://localhost:3000

## متغيرات البيئة (اختيارية)

- Backend: `PORT` (افتراضي 4000)، `JWT_SECRET`، `DB_PATH`
- Frontend: `NEXT_PUBLIC_API_URL` (افتراضي http://localhost:4000)

## الـ API

| Method | المسار | الوصف | الصلاحية |
|---|---|---|---|
| POST | /auth/register | تسجيل (طالب/مدرّس) | عام |
| POST | /auth/login | دخول | عام |
| GET | /subjects | قائمة المواد | عام |
| GET | /tutors?subject= | قائمة المدرّسين (فلترة بالمادة) | عام |
| GET | /tutors/:id | ملف مدرّس + مواعيده المتاحة | عام |
| GET/POST | /tutors/me/slots | إدارة مواعيد المدرّس | مدرّس |
| DELETE | /tutors/me/slots/:id | حذف موعد (غير محجوز) | مدرّس |
| GET | /tutors/me/bookings | الحجوزات الواردة | مدرّس |
| POST | /bookings | حجز موعد `{slotId}` | طالب |
| GET | /bookings/me | حجوزاتي | طالب |
| DELETE | /bookings/:id | إلغاء حجز (يحرّر الموعد) | طالب |

## منع التعارض (Double-booking)

الحجز يتم داخل Transaction واحدة:

1. **تحديث شرطي ذرّي**: `UPDATE slot SET isBooked = 1 WHERE id = ? AND isBooked = 0` — من طلبين متزامنين، واحد فقط يُصيب صفاً والثاني يستلم **409 Conflict**.
2. **قيد فريد** على `Booking.slotId` (unique JoinColumn) — شبكة أمان ثانية على مستوى قاعدة البيانات نفسها.

## اختبار سريع للسباق

شغّل الباك اند ثم نفّذ طلبين متزامنين على نفس الموعد بحسابي طالبين — النتيجة: واحد 201 والثاني 409، وحجز واحد فقط بقاعدة البيانات.

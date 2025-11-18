# 🚀 Quick Start Guide - Clinic CRM

## ⚡ Get Started in 5 Minutes

This guide will get your clinic CRM up and running with Supabase database.

---

## 📋 Prerequisites

- Python 3.10+ installed
- Node.js 18+ installed (for frontend)
- Supabase account (free tier works!)
- Git installed

---

## 🗄️ Step 1: Set Up Supabase Database

### **1.1 Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Log in
3. Click **New Project**
4. Fill in:
   - **Name:** `clinic-crm`
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to you
5. Click **Create New Project** (takes ~2 minutes)

### **1.2 Get Database Connection String**

1. Once project is ready, go to **Project Settings** (gear icon)
2. Click **Database** in left sidebar
3. Scroll to **Connection String** section
4. Copy the **URI** format (looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with the password you chose in step 1.1

---

## 🔧 Step 2: Configure Backend

### **2.1 Install Python Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

### **2.2 Set Up Environment Variables**

The `.env` file has been created at `backend/.env`. **Edit it now:**

```bash
# Open the file
nano backend/.env
# or
code backend/.env
# or use any text editor
```

**Replace this line:**
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

**With your actual Supabase connection string from Step 1.2:**
```bash
DATABASE_URL=postgresql://postgres:MyActualPassword123@db.abcdefghijk.supabase.co:5432/postgres
```

**Save the file!**

### **2.3 Run Database Migrations**

```bash
# Still in backend/ directory
python manage.py migrate
```

You should see output like:
```
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying users.0001_initial... OK
  Applying patients.0001_initial... OK
  Applying doctors.0001_initial... OK
  ...
```

✅ **Success!** Your database is now set up in Supabase!

### **2.4 Create Admin User**

```bash
python manage.py createsuperuser
```

Fill in:
- **Email:** `admin@clinic.local` (or your email)
- **First name:** `Admin`
- **Last name:** `User`
- **Password:** Choose a password

---

## 🚀 Step 3: Start Backend Server

```bash
# In backend/ directory
python manage.py runserver
```

Server starts at: **http://localhost:8000**

### **Test It:**

1. **Django Admin:** http://localhost:8000/admin
   - Login with your superuser credentials
   - You should see all the models!

2. **API Documentation:** http://localhost:8000/api/docs/
   - Interactive Swagger UI
   - Try the endpoints!

3. **API Root:** http://localhost:8000/api/
   - Shows all available endpoints

---

## 🎨 Step 4: Start Frontend (Optional)

```bash
# In new terminal, from project root
cd frontend
npm install
npm run dev
```

Frontend starts at: **http://localhost:3000**

---

## ✅ Verify Everything Works

### **Test 1: Create a User via API**

```bash
# Get JWT token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.local",
    "password": "your-password"
  }'
```

You should get:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### **Test 2: View API Docs**

Open http://localhost:8000/api/docs/ and you should see:

- 📚 **Clinic CRM API** documentation
- List of all endpoints organized by app
- "Try it out" buttons to test endpoints

### **Test 3: Check Database**

Go to Supabase Dashboard > **Table Editor** and you should see **35+ tables**:

- ✅ `users_user`
- ✅ `core_auditlog`
- ✅ `patients_patient`
- ✅ `doctors_doctor`
- ✅ `appointments_appointment`
- ✅ And 30+ more!

---

## 🔐 Step 5: Create Your First Doctor

### **Via Django Admin:**

1. Go to http://localhost:8000/admin
2. Click **Users** > **Add User**
3. Fill in:
   - Email: `doctor@clinic.local`
   - Password: `DoctorPass123!`
   - First name: `John`
   - Last name: `Smith`
   - Role: **Doctor**
4. Save

5. Click **Doctors** > **Add Doctor**
6. Fill in:
   - User: Select the doctor user you just created
   - License number: `LIC123456`
   - NPI number: `1234567890`
7. Save

✅ **First doctor created!**

### **Via API:**

```bash
# 1. Get admin token (from Test 1 above)
TOKEN="your-access-token-here"

# 2. Create user
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@clinic.local",
    "password": "DoctorPass123!",
    "password_confirm": "DoctorPass123!",
    "first_name": "John",
    "last_name": "Smith",
    "role": "doctor"
  }'

# 3. Create doctor profile (use user ID from response)
curl -X POST http://localhost:8000/api/doctors/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "USER_ID_HERE",
    "license_number": "LIC123456",
    "npi_number": "1234567890"
  }'
```

---

## 📊 Available Endpoints

Once running, you have access to:

### **Authentication:**
- `POST /api/token/` - Login (get JWT token)
- `POST /api/token/refresh/` - Refresh token
- `POST /api/register/` - Patient self-registration

### **User Management:**
- `GET /api/users/` - List users
- `POST /api/users/` - Create user (admin)
- `POST /api/users/{id}/change_role/` - Change user role
- `GET /api/users/me/` - Get current user

### **Medical Records:**
- `GET/POST /api/patients/` - Patients
- `GET/POST /api/doctors/` - Doctors
- `GET/POST /api/appointments/` - Appointments
- `GET/POST /api/prescriptions/` - Prescriptions
- `GET/POST /api/laboratory/orders/` - Lab orders
- `GET/POST /api/insurance/claims/` - Insurance claims

### **Documentation:**
- `GET /api/docs/` - Swagger UI
- `GET /api/redoc/` - ReDoc UI
- `GET /api/schema/` - OpenAPI schema

---

## 🎯 Common Tasks

### **Create a Patient:**

```bash
# 1. Patient self-registers
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "PatientPass123!",
    "password_confirm": "PatientPass123!",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone": "+19876543210",
    "date_of_birth": "1990-03-20"
  }'

# 2. Admin/Receptionist creates patient profile
curl -X POST http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "USER_ID_FROM_REGISTRATION",
    "medical_record_number": "MRN123456",
    "date_of_birth": "1990-03-20",
    "gender": "female"
  }'
```

### **Create an Appointment:**

```bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "PATIENT_ID",
    "doctor": "DOCTOR_ID",
    "appointment_datetime": "2024-12-01T10:00:00Z",
    "duration_minutes": 30,
    "appointment_type": "consultation",
    "reason": "Annual checkup"
  }'
```

---

## 🆘 Troubleshooting

### **Error: "No module named 'psycopg2'"**

```bash
pip install psycopg2-binary
```

### **Error: "FATAL: password authentication failed"**

- Check your `DATABASE_URL` password is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- No spaces or special characters need escaping

### **Error: "relation does not exist"**

```bash
# Run migrations
python manage.py migrate
```

### **Error: "ALLOWED_HOSTS"**

- In development, this should work automatically
- If not, check `backend/.env` has:
  ```
  ALLOWED_HOSTS=localhost,127.0.0.1
  ```

### **Can't connect to Supabase:**

1. Check Supabase project is not paused (free tier pauses after 7 days inactivity)
2. Verify connection string format
3. Test connection:
   ```bash
   python manage.py dbshell
   ```

---

## 📚 Next Steps

1. **Read Full Documentation:**
   - `SUPABASE_SETUP.md` - Detailed Supabase guide
   - `COMPLETE_PIPELINE.md` - Full development roadmap
   - `ALL_MODELS_COMPLETE.md` - Database schema reference

2. **Explore API:**
   - http://localhost:8000/api/docs/ - Interactive API documentation
   - Test all endpoints with Swagger UI

3. **Deploy to Vercel:**
   - Set environment variables in Vercel dashboard
   - Push code to trigger deployment
   - Vercel will automatically detect Django app

4. **Add Sample Data:**
   - Use Django admin to add doctors, patients
   - Create appointments, prescriptions
   - Test the full workflow

---

## ✅ Checklist

- [ ] Supabase project created
- [ ] DATABASE_URL set in `backend/.env`
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Migrations run (`python manage.py migrate`)
- [ ] Superuser created (`python manage.py createsuperuser`)
- [ ] Backend running (http://localhost:8000)
- [ ] Can access Django admin (http://localhost:8000/admin)
- [ ] Can access API docs (http://localhost:8000/api/docs/)
- [ ] JWT authentication working
- [ ] Created first doctor/patient
- [ ] Reviewed API documentation

---

## 🎉 You're Ready!

Your clinic CRM is now running with:
- ✅ Django backend on http://localhost:8000
- ✅ Supabase PostgreSQL database (35+ tables)
- ✅ JWT authentication
- ✅ 7 user roles (admin, doctor, patient, nurse, receptionist, lab_tech, pharmacist)
- ✅ HIPAA audit logging
- ✅ Interactive API documentation
- ✅ Full CRUD for all medical records

**Start building your clinic management system!** 🏥

# 🗄️ Supabase Database Setup Guide

## ✅ Current Status

**The Django backend is already configured for Supabase!**

- ✅ PostgreSQL engine configured (`django.db.backends.postgresql`)
- ✅ `dj-database-url` installed for parsing connection strings
- ✅ Connection pooling enabled (`conn_max_age=600`)
- ✅ Health checks enabled (`conn_health_checks=True`)
- ✅ Environment variable support (`DATABASE_URL`)

---

## 📋 Step-by-Step Supabase Setup

### **Step 1: Get Your Supabase Database Credentials**

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** (gear icon in sidebar)
3. Click **Database** tab
4. Scroll to **Connection String** section
5. Copy the **URI** connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### **Step 2: Set Environment Variables**

#### **For Vercel Deployment:**

1. Go to your Vercel project
2. Navigate to **Settings** > **Environment Variables**
3. Add these variables:

```bash
# Required
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
DJANGO_ENV=production
SECRET_KEY=your-super-secret-key-generate-this
ALLOWED_HOSTS=your-backend.vercel.app,your-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Optional but recommended
SENTRY_DSN=your-sentry-dsn-for-error-tracking
```

#### **For Local Development:**

Create a `.env` file in `backend/` directory:

```bash
# Copy from .env.example
cp backend/.env.example backend/.env

# Edit the .env file with your Supabase credentials
```

Example `.env` for local development:
```bash
DJANGO_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True

# Supabase Database
DATABASE_URL=postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Local settings
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🔧 Database Configuration (Already Done!)

The database is configured in `backend/config/settings/base.py`:

```python
# Supports DATABASE_URL (Supabase format)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,        # Connection pooling (10 minutes)
            conn_health_checks=True,  # Automatic health checks
        )
    }
else:
    # Fallback to individual environment variables
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'postgres'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
```

**This configuration works perfectly with Supabase!**

---

## 🚀 Running Database Migrations

### **Initial Setup (First Time):**

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Create migrations
python manage.py makemigrations

# 3. Apply migrations to Supabase
python manage.py migrate

# 4. Create superuser (admin account)
python manage.py createsuperuser
```

### **After Model Changes:**

```bash
# Create new migrations
python manage.py makemigrations

# Apply to database
python manage.py migrate
```

---

## 📊 Database Tables Created

When you run migrations, these tables will be created in Supabase:

### **Core Tables:**
- `users_user` - Custom user model with 7 roles
- `core_auditlog` - HIPAA audit logs (permanent, immutable)

### **Medical Tables:**
- `patients_patient` - Patient records
- `doctors_doctor` - Doctor profiles
- `doctors_specialization` - Medical specializations
- `doctors_doctorcredential` - Doctor credentials
- `doctors_doctoravailability` - Doctor schedules

### **Appointment Tables:**
- `appointments_appointment` - Appointments
- `appointments_appointmentreminder` - Reminders

### **Prescription Tables:**
- `prescriptions_medication` - Medication catalog
- `prescriptions_prescription` - Prescriptions
- `prescriptions_prescriptionrefill` - Refill requests

### **Laboratory Tables:**
- `laboratory_labtest` - Test catalog
- `laboratory_laborder` - Lab orders
- `laboratory_labresult` - Test results

### **Insurance Tables:**
- `insurance_insuranceprovider` - Insurance providers
- `insurance_insuranceplan` - Insurance plans
- `insurance_patientinsurance` - Patient insurance
- `insurance_insuranceclaim` - Claims

### **Employee Tables:**
- `employees_department` - Departments
- `employees_employee` - Staff employees
- `employees_employeetimeoff` - Time off requests
- `employees_employeeperformancereview` - Reviews

### **Clinical Notes Tables:**
- `clinical_notes_clinicalnote` - Clinical notes
- `clinical_notes_soapnote` - SOAP notes
- `clinical_notes_progressnote` - Progress notes
- `clinical_notes_clinicalnotetemplate` - Note templates

---

## 🔍 Verifying Connection

### **Test Database Connection:**

```bash
# Run this to test the connection
python manage.py dbshell

# Should connect to Supabase PostgreSQL
# Type \dt to see all tables
# Type \q to quit
```

### **Check Database via Django:**

```bash
python manage.py shell

>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("SELECT version();")
>>> print(cursor.fetchone())
# Should show PostgreSQL version from Supabase
```

---

## 🔐 Supabase Security Best Practices

### **1. Use Connection Pooling:**
Already enabled! (`conn_max_age=600`)

### **2. Enable Row Level Security (RLS):**

Since we're using Django's built-in permissions and authentication, you can:

**Option A:** Disable RLS on tables (Django handles it)
```sql
ALTER TABLE users_user DISABLE ROW LEVEL SECURITY;
-- Repeat for other tables
```

**Option B:** Keep RLS and use service role key
- Use `SUPABASE_SERVICE_KEY` instead of `SUPABASE_ANON_KEY`
- Service role bypasses RLS

### **3. Connection Limits:**

Supabase free tier: **500 concurrent connections**

For production, use connection pooling:
```python
DATABASES = {
    'default': {
        # ... your settings ...
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30 seconds
        }
    }
}
```

### **4. Backup Strategy:**

Supabase automatically backs up your database:
- **Free tier:** Daily backups (7 days retention)
- **Pro tier:** Daily backups (30 days retention) + Point-in-time recovery

---

## 📈 Database Performance Tips

### **1. Enable Database Indexes:**

Already done! Our models include indexes on:
- Foreign keys
- Frequently queried fields (email, status, dates)
- UUID primary keys

### **2. Use Select Related:**

Already implemented in all ViewSets:
```python
queryset = Appointment.objects.select_related(
    'patient', 'doctor'
).prefetch_related('reminders')
```

### **3. Monitor Query Performance:**

Enable query logging in development:
```python
# In settings/development.py
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
        }
    }
}
```

---

## 🌐 Supabase Storage (Optional)

For file uploads (profile pictures, lab results, etc.):

### **1. Create Storage Bucket:**

In Supabase Dashboard:
1. Go to **Storage**
2. Create new bucket: `clinic-uploads`
3. Set to **Private** (HIPAA compliance)

### **2. Configure Django:**

Install package:
```bash
pip install django-supabase-storage
```

Add to `settings.py`:
```python
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_BUCKET = 'clinic-uploads'

DEFAULT_FILE_STORAGE = 'supabase_storage.SupabaseStorage'
```

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database password obtained
- [ ] `DATABASE_URL` environment variable set
- [ ] Migrations run successfully
- [ ] Superuser created
- [ ] Can access Django admin
- [ ] Can create/view records via API
- [ ] Audit logs being created in `core_auditlog` table
- [ ] Connection pooling working (check Supabase dashboard)

---

## 🆘 Troubleshooting

### **Error: "FATAL: password authentication failed"**

**Solution:** Double-check your password in `DATABASE_URL`

### **Error: "could not connect to server"**

**Solution:**
1. Check Supabase project is not paused
2. Verify connection string format
3. Check firewall/network settings

### **Error: "relation does not exist"**

**Solution:** Run migrations
```bash
python manage.py migrate
```

### **Slow Queries:**

**Solution:**
1. Check Supabase dashboard > Database > Query Performance
2. Add indexes where needed
3. Use `select_related()` and `prefetch_related()`

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Django Docs:** https://docs.djangoproject.com/en/4.2/ref/databases/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## 🎉 You're All Set!

Your Django backend is now **fully configured for Supabase**!

Just set the `DATABASE_URL` environment variable and run migrations. 🚀

# Clinic CRM - Deployment Guide

Complete guide for deploying the Clinic CRM system to production using Vercel (frontend) and Supabase (database).

---

## Prerequisites

- [x] Vercel account (https://vercel.com)
- [x] Supabase account (https://supabase.com)
- [x] GitHub repository (for Vercel deployment)
- [x] Sentry account (optional - for error tracking)

---

## Part 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Enter project details:
   - **Name**: `clinic-crm-db`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users (e.g., `us-west-1`)
4. Click "Create new project" and wait for provisioning (~2 minutes)

### 1.2 Get Database Credentials

Once your project is ready:

1. Go to **Project Settings** → **Database**
2. Copy the following values:

```bash
# Connection String (URI format)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Individual values
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
```

3. Go to **Project Settings** → **API**
4. Copy the following:

```bash
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]
```

### 1.3 Configure Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Run this query to enable required extensions:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database user for Django (optional but recommended)
CREATE USER clinic_app WITH PASSWORD 'your-app-password';
GRANT ALL PRIVILEGES ON DATABASE postgres TO clinic_app;
```

---

## Part 2: Backend Deployment

### 2.1 Choose Backend Hosting

You have several options:

#### Option A: Railway (Recommended for Django)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Django
5. Configure environment variables (see Section 2.3)

#### Option B: Render

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `pip install -r backend/requirements/production.txt`
   - **Start Command**: `cd backend && gunicorn config.wsgi:application`
   - **Environment**: Python 3.11

#### Option C: Heroku

1. Install Heroku CLI
2. Create new app:
```bash
heroku create clinic-crm-api
heroku addons:create heroku-postgresql:mini
```

### 2.2 Create Django Configuration Files

You'll need to create these files first (not yet implemented):

```
backend/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── manage.py
```

**Note**: These files are mentioned in `IMPLEMENTATION_COMPLETE.md` but not yet created. You'll need to create them before deploying.

### 2.3 Backend Environment Variables

Configure these environment variables in your hosting platform:

```bash
# Django Core
SECRET_KEY=generate-a-strong-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com,your-frontend.vercel.app
DJANGO_SETTINGS_MODULE=config.settings.production

# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# CORS (allow frontend)
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Sentry
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

### 2.4 Run Database Migrations

After deployment, run migrations:

```bash
# Railway
railway run python manage.py migrate

# Render (use Shell access)
python manage.py migrate

# Heroku
heroku run python manage.py migrate -a clinic-crm-api
```

### 2.5 Create Superuser

```bash
# Railway
railway run python manage.py createsuperuser

# Render
python manage.py createsuperuser

# Heroku
heroku run python manage.py createsuperuser -a clinic-crm-api
```

---

## Part 3: Frontend Deployment (Vercel)

### 3.1 Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js

### 3.2 Configure Project Settings

1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)

### 3.3 Configure Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

#### Production Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
API_URL=https://your-backend-domain.com

# Environment
NEXT_PUBLIC_ENVIRONMENT=production

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

#### Preview/Development Variables

Set the same variables for `Preview` and `Development` environments, but with different URLs:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://clinic-crm.vercel.app`

### 3.5 Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `clinic.example.com`)
3. Follow DNS configuration instructions

---

## Part 4: Post-Deployment Configuration

### 4.1 Update CORS Settings

Update your backend's `CORS_ALLOWED_ORIGINS` to include your Vercel URL:

```python
# config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    'https://clinic-crm.vercel.app',
    'https://clinic.example.com',  # if you have custom domain
]
```

### 4.2 Update Backend URL in Frontend

If your backend URL changes, update Vercel environment variables:

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` and `API_URL`
3. Trigger a new deployment

### 4.3 Test the Application

1. Visit your Vercel URL: `https://clinic-crm.vercel.app`
2. Try logging in with the superuser you created
3. Test creating a new patient
4. Verify all CRUD operations work
5. Check that audit logs are being created

---

## Part 5: Security Checklist

Before going to production:

- [ ] **Environment Variables**: All secrets stored securely (not in code)
- [ ] **HTTPS**: Both frontend and backend use HTTPS
- [ ] **CORS**: Only allow your frontend domain
- [ ] **Debug Mode**: `DEBUG=False` in production
- [ ] **Secret Key**: Generate a strong, unique secret key
- [ ] **Database Password**: Use a strong password
- [ ] **Allowed Hosts**: Only include your actual domains
- [ ] **HSTS**: Enable HTTP Strict Transport Security
- [ ] **Content Security Policy**: Configure CSP headers (already in vercel.json)
- [ ] **Sentry**: Error tracking enabled and working
- [ ] **Audit Logs**: Verify PHI access is being logged
- [ ] **Backups**: Configure database backups in Supabase

---

## Part 6: Monitoring & Maintenance

### 6.1 Supabase Monitoring

1. Go to Supabase Dashboard → **Database** → **Logs**
2. Monitor:
   - Query performance
   - Connection pool usage
   - Error logs

### 6.2 Vercel Monitoring

1. Go to Vercel Dashboard → **Analytics**
2. Monitor:
   - Page load times
   - Core Web Vitals
   - Error rates

### 6.3 Sentry Error Tracking

1. Go to Sentry Dashboard
2. Monitor:
   - Error frequency
   - Performance issues
   - User impact

### 6.4 Database Backups

Supabase automatically backs up your database daily. To create manual backup:

1. Go to Supabase Dashboard → **Database** → **Backups**
2. Click "Create backup"
3. Download backup if needed

---

## Part 7: Troubleshooting

### Common Issues

#### Frontend can't connect to Backend

**Symptoms**: API calls fail, CORS errors in browser console

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
2. Check backend's `CORS_ALLOWED_ORIGINS` includes frontend URL
3. Ensure backend is running and accessible
4. Check browser console for specific error messages

#### Database Connection Errors

**Symptoms**: Backend crashes, "could not connect to server" errors

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is running (not paused)
3. Verify database password is correct
4. Check connection pooling settings

#### Build Failures on Vercel

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies in `package.json`
3. Ensure TypeScript has no type errors (`npm run type-check`)
4. Check that all imported files exist

#### 500 Errors from Backend

**Symptoms**: API returns 500 status codes

**Solutions**:
1. Check Sentry for error details
2. Review backend logs in Railway/Render
3. Verify all migrations have been run
4. Check that environment variables are set correctly

---

## Part 8: HIPAA Compliance Notes

### Required for HIPAA Compliance

1. **Business Associate Agreement (BAA)**:
   - Vercel: Contact sales for BAA (enterprise feature)
   - Supabase: Contact for BAA (available on paid plans)
   - Railway/Render: Check if BAA is available

2. **Encryption**:
   - [x] Data in transit: HTTPS everywhere (enforced by Vercel and Supabase)
   - [x] Data at rest: Supabase encrypts at rest by default
   - [ ] Additional encryption: Consider encrypting sensitive fields in Django

3. **Audit Logging**:
   - [x] Already implemented in backend (`core/audit.py`)
   - [x] Logs all PHI access (who, what, when, where)
   - [ ] Ensure logs are stored securely and retained for 6+ years

4. **Access Controls**:
   - [x] Role-based permissions implemented
   - [ ] Enable multi-factor authentication (MFA)
   - [ ] Regular access reviews

5. **Backups**:
   - [x] Supabase daily backups enabled
   - [ ] Test restore procedures regularly
   - [ ] Store backups in different geographic region

---

## Part 9: Cost Estimate

### Free Tier (Good for Development/Testing)

- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Railway/Render**: Free tier (500 hours/month)
- **Total**: $0/month

### Production Tier (Recommended)

- **Supabase Pro**: $25/month (8GB database, 50GB bandwidth, daily backups)
- **Vercel Pro**: $20/month (1TB bandwidth, analytics, priority support)
- **Railway**: ~$10/month (pay-as-you-go for backend hosting)
- **Sentry**: $26/month (50k errors, 100k transactions)
- **Total**: ~$81/month

### HIPAA-Compliant Tier

- **Supabase**: Contact sales (requires BAA)
- **Vercel Enterprise**: Contact sales (requires BAA)
- **Railway/Render**: Verify HIPAA compliance
- **Total**: Varies, expect $200-500/month minimum

---

## Part 10: Next Steps After Deployment

1. **Add Authentication**:
   - Implement JWT authentication
   - Add login/logout pages
   - Protect routes requiring authentication

2. **Build More Features**:
   - Doctor management module
   - Appointment scheduling
   - Clinical notes
   - Laboratory results
   - Billing/insurance

3. **Improve UI**:
   - Add shadcn/ui components
   - Improve responsive design
   - Add loading skeletons
   - Implement optimistic updates

4. **Performance Optimization**:
   - Add caching (Redis)
   - Optimize database queries
   - Implement pagination
   - Add image optimization

5. **Testing**:
   - Write frontend tests (Jest, React Testing Library)
   - Add E2E tests (Playwright)
   - Set up CI/CD pipeline
   - Automated security scanning

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Questions or Issues?**

Open an issue in the GitHub repository or contact the development team.

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0

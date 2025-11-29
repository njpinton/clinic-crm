# User Management Commands

This directory contains Django management commands for creating and managing users with different roles in the Clinic CRM.

## Available Commands

### 1. `createuser` - Create a Single User

Create a new user with a specific role.

**Usage:**
```bash
python manage.py createuser <email> \
  --first-name <name> \
  --last-name <name> \
  --password <password> \
  [--role <role>] \
  [--phone <phone>] \
  [--superuser]
```

**Arguments:**
- `email` (required): User's email address (used for login)
- `--first-name` (required): User's first name
- `--last-name` (required): User's last name
- `--password` (required): User's password
- `--role` (optional): User role - choices: `admin`, `doctor`, `patient`, `nurse`, `receptionist`, `lab_tech`, `pharmacist` (default: `patient`)
- `--phone` (optional): Phone number in format `+12125551234`
- `--superuser` (optional): Make user a Django superuser with admin access

**Examples:**

Create a doctor:
```bash
python manage.py createuser doctor@example.com \
  --first-name "John" \
  --last-name "Smith" \
  --password "securepassword123" \
  --role doctor \
  --phone "+12125551234"
```

Create an admin superuser:
```bash
python manage.py createuser admin@example.com \
  --first-name "Admin" \
  --last-name "User" \
  --password "admin123" \
  --role admin \
  --superuser
```

Create a patient:
```bash
python manage.py createuser patient@example.com \
  --first-name "Jane" \
  --last-name "Doe" \
  --password "patient123"
```

---

### 2. `seed_users` - Seed Test Users

Create multiple test users with all different roles for development and testing.

**Usage:**
```bash
python manage.py seed_users [--clear]
```

**Options:**
- `--clear` (optional): Delete all existing users before seeding (DANGEROUS!)

**Test Users Created:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinic.com | admin123 |
| Doctor | doctor@clinic.com | doctor123 |
| Doctor | doctor2@clinic.com | doctor123 |
| Nurse | nurse@clinic.com | nurse123 |
| Receptionist | receptionist@clinic.com | reception123 |
| Lab Tech | labtech@clinic.com | lab123 |
| Pharmacist | pharmacist@clinic.com | pharmacy123 |
| Patient | patient@clinic.com | patient123 |
| Patient | patient2@clinic.com | patient123 |

**Examples:**

Seed test users (safe - skips existing):
```bash
python manage.py seed_users
```

Clear all users and reseed (DANGEROUS):
```bash
python manage.py seed_users --clear
# You'll be prompted to type "yes" to confirm
```

---

## Available Roles

The system supports 7 user roles:

1. **admin** - Administrator
   - Full system access
   - Can view all audit logs
   - Superuser permissions

2. **doctor** - Doctor
   - Clinical access to patient records
   - Can create/update clinical notes, prescriptions
   - Can view their own audit logs

3. **patient** - Patient (default)
   - Limited access to own records
   - Can view their own audit logs

4. **nurse** - Nurse
   - Clinical staff access
   - Can view their own audit logs

5. **receptionist** - Receptionist
   - Front desk operations
   - Can view their own audit logs

6. **lab_tech** - Laboratory Technician
   - Laboratory management
   - Can view their own audit logs

7. **pharmacist** - Pharmacist
   - Pharmacy operations
   - Can view their own audit logs

---

## Notes

- All users authenticate using their **email address** (not username)
- Passwords are automatically hashed for security
- The `username` field is automatically set to the email address
- Email addresses are converted to lowercase
- Users are assigned the `patient` role by default if no role is specified
- The admin role should be used sparingly and only for system administrators

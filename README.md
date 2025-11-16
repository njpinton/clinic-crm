# Clinic CRM System

A comprehensive clinic management system for patient care, scheduling, and operations.

## Project Overview

**Purpose:** Modern CRM solution for healthcare clinics to manage patients, doctors, appointments, clinical notes, and laboratory results while maintaining HIPAA compliance.

## Tech Stack

### Backend
- **Framework:** Django + Django REST Framework
- **Language:** Python 3.11+
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Task Queue:** Celery

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query / Zustand

## Core Features

- Patient Management (demographics, medical history, insurance)
- Doctor/Provider Management (credentials, specializations)
- Appointment Scheduling (calendar, conflicts, reminders)
- Clinical Notes (SOAP notes, progress notes)
- Laboratory Results (orders, results, file uploads)
- Employee Management (HR data, roles, permissions)
- Comprehensive Audit Logging (HIPAA compliance)

## Project Structure

```
clinic/
├── backend/          # Django backend API
├── frontend/         # Next.js frontend application
├── docs/            # Project documentation
├── .claude/         # Claude Code configuration
│   └── skills/      # Project management agent
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis

### Development Setup

(To be added once implementation begins)

## Security & Compliance

This application handles Protected Health Information (PHI) and must comply with HIPAA regulations:

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Role-based access control (RBAC)
- Comprehensive audit logging
- Automatic session timeout
- Secure authentication with JWT tokens

## Project Management

This project includes a Claude Code skill for project oversight. To activate:

```
/skill clinic-crm-manager
```

The agent will guide you through:
- Implementation phases
- Code reviews
- Security compliance
- Architecture decisions
- Best practices

## Development Roadmap

- **Phase 1:** Foundation & Authentication (Weeks 1-4)
- **Phase 2:** Core Features (Weeks 5-10)
- **Phase 3:** Advanced Features (Weeks 11-16)
- **Phase 4:** Integration & Polish (Weeks 17-20)
- **Phase 5:** Testing & Deployment (Weeks 21-24)

## Contributing

(To be added)

## License

(To be determined)

---

**Note:** This is a healthcare application. Patient safety and data security are paramount.

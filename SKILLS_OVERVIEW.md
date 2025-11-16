# Clinic CRM - Claude Code Skills Overview

This document provides an overview of all available Claude Code skills for the Clinic CRM project, adapted from production-tested patterns.

## What Are Skills?

Skills are specialized knowledge bases that Claude loads when needed. They provide domain-specific guidelines, best practices, code examples, and anti-patterns to avoid. The skills in this project are configured to auto-activate based on context.

---

## Available Skills

### 1. clinic-crm-manager (Project Oversight)

**Purpose:** Overall project management and HIPAA compliance oversight

**Activate when:**
- Starting new features or modules
- Making architectural decisions
- Reviewing security/compliance
- Planning sprints
- Deploying to production

**Command:**
```
/skill clinic-crm-manager
```

**What it provides:**
- Complete 5-phase implementation roadmap
- HIPAA compliance checklist
- Security requirements
- Database schema design
- Code review guidelines
- Performance targets

---

### 2. django-backend-guidelines (Backend Development)

**Purpose:** Django + Django REST Framework development patterns

**Activate when:**
- Creating API endpoints
- Building models or serializers
- Implementing authentication/permissions
- Working with Django ORM
- Adding business logic

**Auto-activates for:**
- Files in `backend/**/*.py`, `apps/**/*.py`
- Keywords: django, api, viewset, serializer, model
- Content patterns: `from rest_framework`, `class.*ViewSet`

**Command:**
```
/skill django-backend-guidelines
```

**Key patterns:**
- Layered architecture (URLs → ViewSets → Services → Models)
- Serializer-based validation
- Role-based permissions
- Audit logging for HIPAA
- Service layer for complex logic
- Performance optimization

---

### 3. nextjs-frontend-guidelines (Frontend Development)

**Purpose:** Next.js 14+ with App Router and TypeScript patterns

**Activate when:**
- Creating components or pages
- Building forms
- Implementing data fetching
- Adding routing
- Working with authentication

**Auto-activates for:**
- Files in `frontend/**/*.tsx`, `app/**/*.tsx`, `components/**/*.tsx`
- Keywords: component, react, nextjs, frontend, ui
- Content patterns: `'use client'`, `'use server'`, `import.*from 'react'`

**Command:**
```
/skill nextjs-frontend-guidelines
```

**Enforcement:** BLOCK (guardrail) - Prevents common Next.js mistakes

**Key patterns:**
- Server Components by default
- Client Components only when needed
- Server Actions for mutations
- React Hook Form + Zod validation
- Proper loading/error states
- HIPAA-compliant audit logging

---

### 4. django-api-tester (API Testing)

**Purpose:** Testing Django REST API endpoints with pytest

**Activate when:**
- Writing API tests
- Testing authentication
- Verifying CRUD operations
- Debugging endpoints
- Checking audit logs

**Auto-activates for:**
- Files in `**/tests/**/*.py`, `**/*test*.py`
- Keywords: test, testing, pytest, api test
- Content patterns: `from rest_framework.test`, `@pytest`, `def test_`

**Command:**
```
/skill django-api-tester
```

**Key patterns:**
- Pytest fixtures for test data
- Factory pattern for test objects
- Testing authentication/permissions
- Verifying audit logs
- Integration testing
- Testing HIPAA compliance

---

### 5. sentry-integration (Error Tracking)

**Purpose:** Sentry error tracking for Django and Next.js

**Activate when:**
- Setting up error tracking
- Implementing exception handling
- Adding performance monitoring
- Debugging production issues
- Ensuring HIPAA-compliant logging

**Auto-activates for:**
- Files matching `**/sentry*.py`, `**/sentry*.ts`
- Keywords: sentry, error tracking, exception, monitoring
- Content patterns: `import.*sentry`, `captureException`

**Command:**
```
/skill sentry-integration
```

**Critical rule:** ALL ERRORS MUST BE CAPTURED TO SENTRY

**Key patterns:**
- Django Sentry integration
- Next.js Sentry setup
- Scrubbing PHI from errors (HIPAA)
- Performance monitoring
- Custom error context
- User tracking

---

## Skill Auto-Activation System

Skills automatically activate based on:

1. **Keywords in prompts** - Mentioning specific terms triggers relevant skills
2. **File patterns** - Editing certain files activates related skills
3. **Code content** - Detecting specific imports or patterns
4. **User intent** - Regex patterns match user questions

Configuration is in `.claude/skills/skill-rules.json`

### Example: Automatic Activation

When you edit `backend/apps/patients/views.py`, the system:
1. Detects file path matches `backend/**/*.py`
2. Checks file content for `from rest_framework`
3. Automatically suggests `django-backend-guidelines` skill

---

## Enforcement Levels

### SUGGEST (Advisory)
- Skill appears as suggestion
- Doesn't block your work
- Provides helpful guidance
- **Used by:** clinic-crm-manager, django-backend-guidelines, django-api-tester, sentry-integration

### BLOCK (Guardrail)
- Prevents file edits until skill is reviewed
- Critical for avoiding common mistakes
- Can be skipped with `// @skip-validation` comment
- **Used by:** nextjs-frontend-guidelines

---

## How to Use Skills

### Method 1: Manual Activation
```
/skill django-backend-guidelines
```

### Method 2: Automatic Activation
Just start working - skills activate automatically based on context!

### Method 3: Ask Questions
```
"How do I create a new patient API endpoint?"
→ Auto-activates django-backend-guidelines
```

---

## Quick Reference

| Working on... | Use this skill |
|--------------|----------------|
| Django API endpoint | `django-backend-guidelines` |
| Next.js component | `nextjs-frontend-guidelines` |
| API tests | `django-api-tester` |
| Error handling | `sentry-integration` |
| Project planning | `clinic-crm-manager` |
| HIPAA compliance | `clinic-crm-manager` |

---

## Skill Development

Want to create new skills? The patterns used here are from [claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase).

Key principles:
- Keep main skill file under 500 lines
- Use progressive disclosure (link to resource files)
- Include real code examples
- Define clear trigger patterns
- Test with multiple scenarios

---

## Benefits of This Skill System

✅ **Automatic knowledge loading** - Context-aware guidance appears when you need it
✅ **Production-tested patterns** - Based on real-world microservices development
✅ **HIPAA compliance** - Built-in healthcare security guidance
✅ **Prevents common mistakes** - Guardrails for critical patterns
✅ **Consistent codebase** - Everyone follows the same patterns

---

## Next Steps

1. **Start with clinic-crm-manager** to understand the project structure
2. **Use django-backend-guidelines** when building APIs
3. **Use nextjs-frontend-guidelines** when building UI
4. **Test with django-api-tester**
5. **Monitor with sentry-integration**

For questions about the skill system itself, see the patterns in the [claude-code-infrastructure-showcase repository](https://github.com/diet103/claude-code-infrastructure-showcase/.claude/skills/).

---

**Last Updated:** 2025-11-16
**Skill Version:** 1.0
**Project:** Clinic CRM

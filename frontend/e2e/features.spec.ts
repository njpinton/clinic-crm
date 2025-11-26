import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Clinic CRM - All Features UI Testing', () => {
  test.describe('Feature 1: Dashboard Page', () => {
    test('should render dashboard page with all components', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Dashboard');

      // Check stat cards exist
      const statCards = page.locator('[class*="bg-white"][class*="p-6"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display dashboard statistics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Check for stat card titles
      await expect(page.getByText('Total Patients')).toBeVisible();
      await expect(page.getByText('Active Appointments')).toBeVisible();
      await expect(page.getByText('Total Revenue')).toBeVisible();
    });
  });

  test.describe('Feature 2: Patient Management', () => {
    test('should load patients page with list view', async ({ page }) => {
      await page.goto(`${BASE_URL}/patients`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Patients');

      // Check view toggle buttons exist
      const viewToggle = page.locator('button').filter({ hasText: /Grid|Table|List/ });
      expect(await viewToggle.count()).toBeGreaterThan(0);
    });

    test('should search patients by name', async ({ page }) => {
      await page.goto(`${BASE_URL}/patients`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('John');

      // Wait for results to update
      await page.waitForTimeout(500);

      // Verify search worked
      const results = page.locator('table tbody tr, [class*="grid"]');
      expect(await results.count()).toBeGreaterThan(0);
    });

    test('should switch between view modes', async ({ page }) => {
      await page.goto(`${BASE_URL}/patients`);

      // Look for view toggle buttons
      const tableButton = page.locator('button').filter({ hasText: 'Table' }).first();
      if (await tableButton.isVisible()) {
        await tableButton.click();
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  test.describe('Feature 3: Appointments', () => {
    test('should load appointments page', async ({ page }) => {
      await page.goto(`${BASE_URL}/appointments`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Appointments');
    });

    test('should display appointments list with data', async ({ page }) => {
      await page.goto(`${BASE_URL}/appointments`);

      // Wait for page to load
      await page.waitForTimeout(1000);

      // Check for appointment elements
      const appointmentElements = page.locator('[class*="bg-white"][class*="border"]');
      expect(await appointmentElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Feature 4: Doctor Management', () => {
    test('should load doctors page with full CRUD UI', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Doctors');

      // Check for "Add Doctor" button
      await expect(page.locator('button').filter({ hasText: /Add Doctor|New/ })).toBeVisible();
    });

    test('should display doctors table with data', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Specialty' })).toBeVisible();
    });

    test('should search doctors by name', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Sarah');

      await page.waitForTimeout(500);

      // Verify results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should filter doctors by specialty', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Find specialty filter
      const specialtySelect = page.locator('select').nth(1);
      await specialtySelect.selectOption('Cardiology');

      await page.waitForTimeout(500);

      // Verify filtered results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display doctor stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Doctors')).toBeVisible();
      await expect(page.getByText('Active')).toBeVisible();
      await expect(page.getByText('Specialties')).toBeVisible();
    });
  });

  test.describe('Feature 5: Laboratory Orders', () => {
    test('should load laboratory page with full CRUD UI', async ({ page }) => {
      await page.goto(`${BASE_URL}/laboratory`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Laboratory');

      // Check for "New Order" button
      await expect(page.locator('button').filter({ hasText: /New Order|Order/ })).toBeVisible();
    });

    test('should display lab orders table', async ({ page }) => {
      await page.goto(`${BASE_URL}/laboratory`);

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table structure
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Patient' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    });

    test('should filter lab orders by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/laboratory`);

      // Find status filter
      const statusSelect = page.locator('select').nth(1);
      await statusSelect.selectOption('completed');

      await page.waitForTimeout(500);

      // Verify filtered results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display laboratory stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/laboratory`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Orders')).toBeVisible();
      await expect(page.getByText('Pending')).toBeVisible();
      await expect(page.getByText('Completed')).toBeVisible();
    });
  });

  test.describe('Feature 6: Pharmacy Management', () => {
    test('should load prescriptions page with full CRUD UI', async ({ page }) => {
      await page.goto(`${BASE_URL}/prescriptions`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Prescriptions');

      // Check for "New Prescription" button
      await expect(page.locator('button').filter({ hasText: /New Prescription|Prescription/ })).toBeVisible();
    });

    test('should display prescriptions table with medication info', async ({ page }) => {
      await page.goto(`${BASE_URL}/prescriptions`);

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Medication' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Patient' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    });

    test('should search prescriptions by medication', async ({ page }) => {
      await page.goto(`${BASE_URL}/prescriptions`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Lisinopril');

      await page.waitForTimeout(500);

      // Verify results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display prescription stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/prescriptions`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Prescriptions')).toBeVisible();
      await expect(page.getByText('Pending')).toBeVisible();
      await expect(page.getByText('Dispensed')).toBeVisible();
    });
  });

  test.describe('Feature 7: Insurance Management', () => {
    test('should load insurance page with data', async ({ page }) => {
      await page.goto(`${BASE_URL}/insurance`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Insurance');

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table structure
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display insurance policies table', async ({ page }) => {
      await page.goto(`${BASE_URL}/insurance`);

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Patient' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Provider' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    });

    test('should search insurance by provider', async ({ page }) => {
      await page.goto(`${BASE_URL}/insurance`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Blue Cross');

      await page.waitForTimeout(500);

      // Verify results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display insurance stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/insurance`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Policies')).toBeVisible();
      await expect(page.getByText('Active Policies')).toBeVisible();
    });
  });

  test.describe('Feature 7: Clinical Notes', () => {
    test('should load clinical notes page with read-only view', async ({ page }) => {
      await page.goto(`${BASE_URL}/clinical-notes`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Clinical Notes');

      // Wait for notes to load
      await page.waitForTimeout(1000);

      // Check for notes display
      const notes = page.locator('[class*="bg-white"][class*="rounded"]');
      expect(await notes.count()).toBeGreaterThan(0);
    });

    test('should filter clinical notes by type', async ({ page }) => {
      await page.goto(`${BASE_URL}/clinical-notes`);

      // Find type filter
      const typeSelect = page.locator('select').nth(1);
      await typeSelect.selectOption('soap');

      await page.waitForTimeout(500);

      // Verify filtered results
      const notes = page.locator('[class*="bg-white"][class*="rounded"]');
      expect(await notes.count()).toBeGreaterThan(0);
    });

    test('should search clinical notes', async ({ page }) => {
      await page.goto(`${BASE_URL}/clinical-notes`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('patient');

      await page.waitForTimeout(500);

      // Verify results
      const notes = page.locator('[class*="bg-white"][class*="rounded"]');
      expect(await notes.count()).toBeGreaterThan(0);
    });

    test('should display clinical notes stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/clinical-notes`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Notes')).toBeVisible();
      await expect(page.getByText('Unique Patients')).toBeVisible();
    });
  });

  test.describe('Feature 7: Employees', () => {
    test('should load employees page with staff directory', async ({ page }) => {
      await page.goto(`${BASE_URL}/employees`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Employees');

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table structure
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display employees table with roles', async ({ page }) => {
      await page.goto(`${BASE_URL}/employees`);

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Role' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Department' })).toBeVisible();
    });

    test('should search employees by name', async ({ page }) => {
      await page.goto(`${BASE_URL}/employees`);

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Sarah');

      await page.waitForTimeout(500);

      // Verify results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display employee stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/employees`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Employees')).toBeVisible();
      await expect(page.getByText('Active Staff')).toBeVisible();
      await expect(page.getByText('Departments')).toBeVisible();
    });
  });

  test.describe('Feature 7: Audit Logs', () => {
    test('should load audit logs page with compliance logging', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit-logs`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Audit Logs');

      // Wait for table to load
      await page.waitForTimeout(1000);

      // Check for table structure
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display audit logs table with action column', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit-logs`);

      // Check for table headers
      await expect(page.locator('th').filter({ hasText: 'Timestamp' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'User' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Action' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Resource' })).toBeVisible();
    });

    test('should filter audit logs by action', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit-logs`);

      // Find action filter
      const actionSelect = page.locator('select').nth(1);
      await actionSelect.selectOption('create');

      await page.waitForTimeout(500);

      // Verify filtered results
      const tableRows = page.locator('table tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });

    test('should display audit logs stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit-logs`);

      // Wait for stats to load
      await page.waitForTimeout(1000);

      // Check for stat cards
      await expect(page.getByText('Total Events')).toBeVisible();
      await expect(page.getByText('Unique Users')).toBeVisible();
    });
  });

  test.describe('Feature 7: Settings', () => {
    test('should load settings page with configuration options', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Check page title
      await expect(page.locator('h1')).toContainText('Settings');

      // Check for settings sections
      await expect(page.getByText('Clinic Information')).toBeVisible();
      await expect(page.getByText('System Settings')).toBeVisible();
      await expect(page.getByText('Security Settings')).toBeVisible();
    });

    test('should display and allow clinic info editing', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Check for clinic name input
      const clinicNameInput = page.locator('input[value*="Advanced Medical"]');
      await expect(clinicNameInput).toBeVisible();
    });

    test('should allow checkbox toggles for security settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Find checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      expect(await checkboxes.count()).toBeGreaterThan(0);
    });

    test('should display save settings button', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Check for save button
      await expect(page.locator('button').filter({ hasText: 'Save Settings' })).toBeVisible();
    });
  });

  test.describe('Navigation & UI Quality', () => {
    test('should have responsive layout on desktop', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Check viewport size
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeGreaterThan(1024);

      // Check main content is visible
      const mainContent = page.locator('main, [role="main"], [class*="max-w"]');
      expect(await mainContent.count()).toBeGreaterThan(0);
    });

    test('should have accessible form labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Check for form labels
      const labels = page.locator('label');
      expect(await labels.count()).toBeGreaterThan(0);
    });

    test('should have working navigation between pages', async ({ page }) => {
      // Start at dashboard
      await page.goto(`${BASE_URL}/dashboard`);

      // Navigate to different pages
      const pages = [
        '/patients',
        '/appointments',
        '/doctors',
        '/laboratory',
        '/prescriptions',
        '/insurance',
        '/clinical-notes',
        '/employees',
        '/audit-logs',
        '/settings'
      ];

      for (const pagePath of pages) {
        await page.goto(`${BASE_URL}${pagePath}`);
        // Just verify page loads without error
        const pageElement = page.locator('h1');
        expect(await pageElement.count()).toBeGreaterThan(0);
      }
    });

    test('should display loading states', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Initially should load
      await page.waitForTimeout(500);

      // Search should show results
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('test');

      // Results should update
      await page.waitForTimeout(500);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty search results gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Search for non-existent doctor
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('ZZZZZZZZZ_NOT_FOUND');

      await page.waitForTimeout(500);

      // Page should still be functional
      const pageTitle = page.locator('h1');
      await expect(pageTitle).toBeVisible();
    });

    test('should handle filter selections', async ({ page }) => {
      await page.goto(`${BASE_URL}/doctors`);

      // Select a filter option
      const filterSelect = page.locator('select').nth(1);
      const options = await filterSelect.locator('option').count();
      expect(options).toBeGreaterThan(1);
    });
  });
});

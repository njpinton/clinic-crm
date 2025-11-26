#!/bin/bash

# UI Testing Script - Verify all pages load correctly

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Clinic CRM - UI Testing"
echo "================================================"
echo ""

test_page() {
  local page=$1
  local expected_text=$2
  local description=$3

  echo -n "Testing $description... "

  response=$(curl -s "$BASE_URL$page")

  if echo "$response" | grep -q "$expected_text"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    echo "  Expected text not found: $expected_text"
  fi
}

# Test all pages
test_page "/" "Clinic CRM" "Home/Dashboard page"
test_page "/dashboard" "Dashboard" "Dashboard page"
test_page "/patients" "Patients" "Patients management page"
test_page "/appointments" "Appointments" "Appointments page"
test_page "/doctors" "Doctors" "Doctors management page"
test_page "/laboratory" "Laboratory" "Laboratory orders page"
test_page "/prescriptions" "Prescriptions" "Prescriptions/Pharmacy page"
test_page "/insurance" "Insurance" "Insurance management page"
test_page "/clinical-notes" "Clinical Notes" "Clinical notes page"
test_page "/employees" "Employees" "Employees page"
test_page "/audit-logs" "Audit Logs" "Audit logs page"
test_page "/settings" "Settings" "Settings page"

echo ""
echo "================================================"
echo "  Test Results Summary"
echo "================================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi

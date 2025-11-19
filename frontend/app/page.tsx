/**
 * Home Page - Redirects to Dashboard
 * Professional Clinic CRM landing
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  redirect('/dashboard');
}

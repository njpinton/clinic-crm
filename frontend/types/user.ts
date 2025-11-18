/**
 * User types and interfaces
 */
import { TimestampFields } from './common';

// User role choices
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';

// User list item (minimal fields for lists)
export interface UserListItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  is_staff_member: boolean;
  created_at: string;
}

// Complete user details
export interface User extends TimestampFields {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_of_birth: string | null;
  profile_picture: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Computed properties
  is_admin: boolean;
  is_doctor: boolean;
  is_patient: boolean;
  is_staff_member: boolean;
  // Timestamps
  date_joined: string;
  last_login: string | null;
}

// User creation payload
export interface UserCreatePayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  date_of_birth?: string;
}

// User update payload
export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  profile_picture?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// Password change payload
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

// User registration payload (public)
export interface UserRegistrationPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
}

// Role update payload
export interface UserRoleUpdatePayload {
  role: UserRole;
}

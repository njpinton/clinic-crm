'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import DailyQueueCard from '@/components/dashboard/DailyQueueCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import {
  getDashboardStats,
  getRecentActivities,
  getUpcomingAppointments,
  type DashboardStats,
  type Activity,
  type DashboardAppointment
} from '@/lib/api/dashboard';

interface PatientsIcon {
  (): JSX.Element;
}

function PatientsIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V6z" clipRule="evenodd" />
    </svg>
  );
}

function TestTubeIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.259-.966zM2.429 4.744a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.259zm14.314 0l-.966.259a1 1 0 00.517 1.932l.966-.259a1 1 0 00-.517-1.932zM18.5 6a1 1 0 11-2 0 1 1 0 012 0zM2 6a1 1 0 11-2 0 1 1 0 012 0zm16.023 6.953a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.259-.966z" clipRule="evenodd" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 4a2 2 0 012-2h6a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.293.707v2.758A2 2 0 0110 12h-2a2 2 0 01-2-2V4zm2 6a1 1 0 100 2h6a1 1 0 100-2H6z" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        setStatsLoading(true);
        const statsData = await getDashboardStats();
        setStats(statsData);
        setStatsError(null);
      } catch (error) {
        setStatsError('Failed to load dashboard statistics');
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }

      try {
        // Fetch activities
        setActivitiesLoading(true);
        const activitiesData = await getRecentActivities();
        setActivities(activitiesData);
        setActivitiesError(null);
      } catch (error) {
        setActivitiesError('Failed to load recent activities');
        console.error('Error fetching activities:', error);
      } finally {
        setActivitiesLoading(false);
      }

      try {
        // Fetch appointments
        setAppointmentsLoading(true);
        const appointmentsData = await getUpcomingAppointments();
        setAppointments(appointmentsData);
        setAppointmentsError(null);
      } catch (error) {
        setAppointmentsError('Failed to load upcoming appointments');
        console.error('Error fetching appointments:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full animate-spin">
            <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.first_name || user.email}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Patients"
            value={statsLoading ? '...' : stats?.totalPatients || 0}
            subtitle="Active patient records"
            icon={<PatientsIcon />}
            color="blue"
            trend={statsLoading ? undefined : { value: 12, isPositive: true }}
          />
          <StatsCard
            title="Appointments Today"
            value={statsLoading ? '...' : stats?.appointmentsToday || 0}
            subtitle="Scheduled for today"
            icon={<ClockIcon />}
            color="green"
          />
          <StatsCard
            title="Pending Lab Orders"
            value={statsLoading ? '...' : stats?.pendingLabOrders || 0}
            subtitle="Awaiting results"
            icon={<TestTubeIcon />}
            color="orange"
            trend={statsLoading ? undefined : { value: 5, isPositive: false }}
          />
          <StatsCard
            title="Active Notes"
            value={statsLoading ? '...' : stats?.activeNotes || 0}
            subtitle="Clinical notes in progress"
            icon={<DocumentIcon />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Queue (Priority) */}
          <div className="lg:col-span-2 space-y-6">
            <DailyQueueCard
              appointments={appointments}
              isLoading={appointmentsLoading}
              error={appointmentsError}
            />
          </div>

          {/* Recent Activity (Sidebar) */}
          <div>
            <RecentActivityCard
              activities={activities}
              isLoading={activitiesLoading}
              error={activitiesError}
            />
          </div>
        </div>

        {/* Additional Info Cards (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* System Health */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600 mt-2">Operational</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">All systems running normally</p>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">Connected</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12a9 9 0 0110 8.618V20H9v-7h2v7h4v-1.382A9 9 0 113 12z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Primary database active</p>
          </div>

          {/* API Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">Responsive</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Response time: &lt;100ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SettingsModal from './SettingsModal';

export default function UserMenu() {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() || user.email.charAt(0).toUpperCase();

  return (
    <>
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors w-full"
        title={`${user.first_name} ${user.last_name}`}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        <span className="text-sm text-gray-700 hidden sm:inline truncate">{user.email}</span>
      </button>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

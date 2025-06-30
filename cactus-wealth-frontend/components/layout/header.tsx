'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="brand-shadow border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-2xl">🌵</span>
            <h1 className="text-xl font-bold text-cactus-700">
              Cactus Wealth
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 
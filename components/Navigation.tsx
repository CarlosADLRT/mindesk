'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'calendar', label: 'Agenda', href: '/calendar' },
    { id: 'clients', label: 'Pacientes', href: '/clients' },
    { id: 'finance', label: 'Finanzas', href: '/finance' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      await signOut();
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xl font-bold text-slate-900">Mindesk</span>
            <span className="text-xs text-slate-400 font-semibold tracking-[0.2em] uppercase">Clinics</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primaryDark transition"
          >
            Hoy
          </Link>

          <Link
            href="/settings"
            className="hidden md:flex w-11 h-11 rounded-full border border-slate-200 items-center justify-center text-slate-500 hover:text-slate-900 hover:border-primary/50 transition"
          >
            <Settings size={18} />
          </Link>

          <div className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-3 py-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="hidden lg:flex flex-col leading-tight pr-1">
              <span className="text-sm font-semibold text-slate-900">
                {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
              </span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primaryDark transition"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Mobile nav links */}
      <div className="md:hidden px-4 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                active ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

import { AppRoute } from '@/lib/AppRoute';
import clsx from 'clsx';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';

function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

export const ProtectedLayout: React.FC = () => {
  if (!isAuthenticated()) {
    return <Navigate to={AppRoute.Login()} replace />;
  }

  return (
    <>
      <div className={clsx('flex', 'mx-auto h-svh max-w-400', 'bg-background')}>
        <Sidebar />
        <main className={clsx('flex-1', 'overflow-y-auto pb-16 md:pb-0')}>
          <div className="px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
      <TabBar />
    </>
  );
};

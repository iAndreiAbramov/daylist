import clsx from 'clsx';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';

export const AppLayout: React.FC = () => {
  return (
    <>
      <div
        className={clsx('flex', 'max-w-content mx-auto h-svh', 'bg-background')}
      >
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

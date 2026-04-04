import clsx from 'clsx';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems, profileNavItem } from '../navItems';

export const Sidebar: React.FC = () => {
  return (
    <aside
      className={clsx(
        'hidden shrink-0 flex-col md:flex',
        'w-56 border-r',
        'border-border bg-sidebar',
      )}
    >
      <div
        className={clsx(
          'flex items-center',
          'h-14 border-b px-4',
          'border-border',
        )}
      >
        <span className="text-sidebar-foreground text-base font-semibold">
          Daylist
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3',
                'rounded-md px-3 py-2',
                'text-sm',
                'transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-border border-t p-2">
        <NavLink
          to={profileNavItem.to}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3',
              'rounded-md px-3 py-2',
              'text-sm',
              'transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-sidebar-foreground',
            )
          }
        >
          <profileNavItem.icon size={16} />
          {profileNavItem.label}
        </NavLink>
      </div>
    </aside>
  );
};

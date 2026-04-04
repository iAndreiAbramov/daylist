import clsx from 'clsx';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems, profileNavItem } from '../navItems';

const allItems = [...navItems, profileNavItem];

export const TabBar: React.FC = () => {
  return (
    <nav
      className={clsx(
        'fixed right-0 bottom-0 left-0 z-50',
        'flex',
        'border-t md:hidden',
        'border-border bg-sidebar',
      )}
    >
      {allItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center justify-center gap-1',
              'py-3',
              'text-xs',
              'transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

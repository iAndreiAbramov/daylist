import { AppRoute } from '@/lib/AppRoute';
import { CheckSquare, FileText, User, Wallet } from 'lucide-react';

export const navItems = [
  { to: AppRoute.Tasks(), label: 'Задачи', icon: CheckSquare },
  { to: AppRoute.Notes(), label: 'Заметки', icon: FileText },
  { to: AppRoute.Finance(), label: 'Финансы', icon: Wallet },
];

export const profileNavItem = {
  to: AppRoute.Profile(),
  label: 'Профиль',
  icon: User,
};

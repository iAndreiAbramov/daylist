import { AppRoute } from '@/lib/AppRoute';
import { FinancePage } from '@/pages/FinancePage';
import { NotesPage } from '@/pages/NotesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TasksPage } from '@/pages/TasksPage';
import { AppLayout } from '@/pages/_layout';
import { Navigate, createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={AppRoute.Tasks()} replace /> },
      { path: AppRoute.Tasks(), element: <TasksPage /> },
      { path: AppRoute.Notes(), element: <NotesPage /> },
      { path: AppRoute.Finance(), element: <FinancePage /> },
      { path: AppRoute.Profile(), element: <ProfilePage /> },
    ],
  },
]);

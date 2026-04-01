import { AppRoute } from '@/lib/AppRoute';
import { FinancePage } from '@/pages/protected/FinancePage';
import { NotesPage } from '@/pages/protected/NotesPage';
import { ProfilePage } from '@/pages/protected/ProfilePage';
import { TasksPage } from '@/pages/protected/TasksPage';
import { ProtectedLayout } from '@/pages/protected/_layout';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { PublicLayout } from '@/pages/public/_layout';
import { Navigate, createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to={AppRoute.Tasks()} replace /> },
      { path: AppRoute.Tasks(), element: <TasksPage /> },
      { path: AppRoute.Notes(), element: <NotesPage /> },
      { path: AppRoute.Finance(), element: <FinancePage /> },
      { path: AppRoute.Profile(), element: <ProfilePage /> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: AppRoute.Login(), element: <LoginPage /> },
      { path: AppRoute.Register(), element: <RegisterPage /> },
    ],
  },
]);

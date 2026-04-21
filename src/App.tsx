import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, applyTheme } from '@/store/themeStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CreateTournamentPage } from '@/pages/CreateTournamentPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { ParticipantsPage } from '@/pages/ParticipantsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { BracketPage } from '@/pages/BracketPage';
import { StandingsPage } from '@/pages/StandingsPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/new',
    element: <ProtectedRoute><CreateTournamentPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/:id',
    element: <ProtectedRoute><TournamentDetailPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/:id/participants',
    element: <ProtectedRoute><ParticipantsPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/:id/groups',
    element: <ProtectedRoute><GroupsPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/:id/bracket',
    element: <ProtectedRoute><BracketPage /></ProtectedRoute>,
  },
  {
    path: '/tournaments/:id/standings',
    element: <ProtectedRoute><StandingsPage /></ProtectedRoute>,
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    applyTheme(isDark);
    return initialize();
  }, [initialize, isDark]);

  return <RouterProvider router={router} />;
}

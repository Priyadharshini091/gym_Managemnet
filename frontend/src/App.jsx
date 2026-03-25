import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ChatWidget from './components/chat/ChatWidget';
import AppShell from './components/layout/AppShell';
import ClassesPage from './pages/ClassesPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MemberPortalPage from './pages/MemberPortalPage';
import MembersPage from './pages/MembersPage';
import PaymentsPage from './pages/PaymentsPage';
import TrainerPortalPage from './pages/TrainerPortalPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRoute({ roles, children }) {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    const fallback =
      user.role === 'owner'
        ? '/dashboard'
        : user.role === 'trainer'
        ? '/trainer-portal'
        : '/member-portal';
    return <Navigate to={fallback} replace />;
  }
  return children;
}

function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'owner') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.role === 'trainer') {
    return <Navigate to="/trainer-portal" replace />;
  }
  return <Navigate to="/member-portal" replace />;
}

function ChatLayer() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!token || location.pathname === '/login') {
    return null;
  }
  return <ChatWidget />;
}

export default function App() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'gymflow-auth' && !event.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={['owner']}>
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route path="/classes" element={<ClassesPage />} />
          <Route
            path="/members"
            element={
              <RoleRoute roles={['owner']}>
                <MembersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <RoleRoute roles={['owner']}>
                <PaymentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/trainer-portal"
            element={
              <RoleRoute roles={['owner', 'trainer']}>
                <TrainerPortalPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route
          path="/member-portal"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['member']}>
                <MemberPortalPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ChatLayer />
    </>
  );
}

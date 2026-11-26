import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LeaderboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="bottom-right"
            // Colors come from the theme CSS variables, so toasts follow the light/dark toggle.
            toastOptions={{
              style: {
                background: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}

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
            theme="dark"
            toastOptions={{
              style: {
                background: '#141416',
                borderColor: '#2A2A2E',
                color: '#FAFAF8',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  );
}

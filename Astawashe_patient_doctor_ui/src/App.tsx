import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/Toast';
import { AppDataProvider } from './data/appStore';
import DoctorPage from './pages/DoctorPage';
import PatientPage from './pages/PatientPage';
import RoleSelectPage from './pages/RoleSelectPage';

/** Routing and providers only — each experience lives in its own page file. */
export default function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
          Skip to content
        </a>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RoleSelectPage />} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/doctor" element={<DoctorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </ToastProvider>
    </AppDataProvider>
  );
}

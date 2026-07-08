import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { AdherencePage } from './pages/AdherencePage';
import { CaregiversPage } from './pages/CaregiversPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { RemindersPage } from './pages/RemindersPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/adherence" element={<AdherencePage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/caregivers" element={<CaregiversPage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

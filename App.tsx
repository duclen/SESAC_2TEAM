import React from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import DashboardPage from './pages/DashboardPage';
import CallbackPage from './pages/CallbackPage';

// 루트 경로에서 code 파라미터 있으면 CallbackPage, 없으면 LandingPage
const RootRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  if (code) {
    return <CallbackPage />;
  }
  return <LandingPage />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/select-role" element={<RoleSelectPage />} />
      <Route path="/owner/*" element={<OwnerDashboardPage />} />
      <Route path="/app/*" element={<DashboardPage />} />
    </Routes>
  );
};

export default App;

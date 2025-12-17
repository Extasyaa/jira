import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BoardPage from './pages/BoardPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Navigate to="/board" replace />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  </Layout>
);

export default App;

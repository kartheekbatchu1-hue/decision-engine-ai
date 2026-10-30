import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateDecisionPage from './pages/CreateDecisionPage.jsx';
import DecisionDetailPage from './pages/DecisionDetailPage.jsx';
import SimulationPage from './pages/SimulationPage.jsx';
import HistoryAuditPage from './pages/HistoryAuditPage.jsx';
import Navbar from './components/Navbar.jsx';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/decisions/new" element={<Layout><CreateDecisionPage /></Layout>} />
        <Route path="/decisions/:id" element={<Layout><DecisionDetailPage /></Layout>} />
        <Route path="/decisions/:id/simulate" element={<Layout><SimulationPage /></Layout>} />
        <Route path="/history" element={<Layout><HistoryAuditPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}


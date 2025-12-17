import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate('/board')}>
          <span className="logo-icon">✦</span>
          <div>
            <div className="logo-title">Analyst Ops</div>
            <div className="logo-sub">Jira Control</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/board" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Board
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Analytics
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Settings
          </NavLink>
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <motion.div layoutId="topbar-pill" className="topbar-pill">
            <span className="crumb">{location.pathname.replace('/', '') || 'board'}</span>
          </motion.div>
          <div className="actions">
            <button className="ghost">Refresh</button>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

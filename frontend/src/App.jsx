import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './hooks/useAuth';
import { ToastProvider }          from './hooks/useToast';
import Sidebar                    from './components/Sidebar';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import Dashboard                   from './pages/Dashboard';
import WardrobePage                from './pages/WardrobePage';
import AccessoriesPage             from './pages/AccessoriesPage';
import LooksPage                   from './pages/LooksPage';
import AIGeneratePage              from './pages/AIGeneratePage';
import TipsPage                    from './pages/TipsPage';
import ProfilePage                 from './pages/ProfilePage';
import FloatingGuide               from './components/FloatingGuide';
import './index.css';

// ── Protected layout with sidebar ──
function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex-center" style={{ minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, letterSpacing:8, color:'var(--rose-deep)' }}>
        AURA
      </div>
      <span className="spinner spinner-dark" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/"          element={<Dashboard />}   />
          <Route path="/wardrobe"  element={<Navigate to="/wardrobe/page/1" replace />}/>
          <Route path="/wardrobe/page/:page" element={<WardrobePage />}/>
          <Route path="/accessories" element={<Navigate to="/accessories/page/1" replace />}/>
          <Route path="/accessories/page/:page" element={<AccessoriesPage />}/>
          <Route path="/looks"     element={<LooksPage />}   />
          <Route path="/tips"      element={<TipsPage />}    />
          <Route path="/ai-generate" element={<AIGeneratePage />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingGuide />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"    element={<LoginPage />}    />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*"        element={<AppLayout />}    />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

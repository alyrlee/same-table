import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useAppContext';
import LangBar from './components/LangBar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ChatBot from './components/ChatBot';
import Home from './views/Home';
import Compare from './views/Compare';
import Pantry from './views/Pantry';
import Submit from './views/Submit';
import Terms from './views/Terms';
import Privacy from './views/Privacy';

function OfflineBanner() {
  const { isOnline, t } = useApp();
  if (isOnline) return null;
  return <div className="offline-banner">{t('offline_banner')}</div>;
}

function AppShell() {
  return (
    <>
      <OfflineBanner />
      <LangBar />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compare/:id" element={<Compare />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/saved" element={<Home />} />
        <Route path="/profile" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
      <BottomNav />
      <ChatBot />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}

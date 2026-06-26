import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tema flash'ı önlemek için React render'dan önce sınıfı uygula
try {
  const raw = localStorage.getItem('wattly_settings');
  const mode = raw ? JSON.parse(raw).themeMode : 'dark';
  document.documentElement.dataset.theme = mode;
} catch {
  document.documentElement.dataset.theme = 'dark';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

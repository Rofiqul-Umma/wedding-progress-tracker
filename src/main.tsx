import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@infrastructure/i18n/config';
import { App } from '@presentation/app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

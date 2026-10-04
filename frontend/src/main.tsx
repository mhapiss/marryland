// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Font bawaan situs, hanya subset latin dan bobot yang dipakai (font-display: swap dari fontsource):
// Display "Gloock" 400, Sans "Hanken Grotesk" 400/500/600/700
import '@fontsource/gloock/latin-400.css';
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-500.css';
import '@fontsource/hanken-grotesk/latin-600.css';
import '@fontsource/hanken-grotesk/latin-700.css';

// Pilihan font preset (hanya subset latin dan bobot yang dimuat)
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/bodoni-moda/latin-400.css';
import '@fontsource/bodoni-moda/latin-700.css';
import '@fontsource/inter-tight/latin-400.css';
import '@fontsource/inter-tight/latin-500.css';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-600.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-600.css';

import './styles/tokens.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

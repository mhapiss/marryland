// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Default site fonts: Serif Display "Gloock" + Sans "Hanken Grotesk"
import '@fontsource/gloock/400.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';

// Preset font choices (only loaded weights)
import '@fontsource/instrument-serif/400.css';
import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/700.css';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';

import './styles/tokens.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConnectionStatus } from './components/ConnectionStatus';
import { UpdateBanner } from './components/UpdateBanner';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/intranet">
        <div className="min-h-screen relative app-shell">
          <div className="relative z-10">
            <AppRoutes />
          </div>
          <UpdateBanner />
          <ConnectionStatus />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

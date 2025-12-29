
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DevModeProvider } from './src/contexts/DevModeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DevModeProvider>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
          }}
        />
      </AuthProvider>
    </DevModeProvider>
  </React.StrictMode>
);

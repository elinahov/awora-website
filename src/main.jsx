import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CatalogProvider } from './lib/catalog.jsx';
import { CartProvider } from './cart.jsx';
import { AuthProvider } from './lib/auth.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

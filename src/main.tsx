import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setApiClient } from './api/client';
import { mockApiClient } from './api/mock';
import { SupabaseApiClient } from './api/supabase';
import { supabase } from './api/supabaseClient';

// If Supabase environment variables are provided, connect to live cloud Postgres.
// Otherwise, fall back cleanly to the typed in-memory mock client.
if (supabase) {
  console.log('⚡ Initializing Supabase cloud backend');
  setApiClient(new SupabaseApiClient(supabase));
} else {
  console.log('📦 Using in-memory mock client with seed data');
  setApiClient(mockApiClient);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

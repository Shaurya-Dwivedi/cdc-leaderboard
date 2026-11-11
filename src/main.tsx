import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setApiClient } from './api/client';
import { mockApiClient } from './api/mock';
import { SupabaseApiClient } from './api/supabase';

// If Supabase environment variables are provided, connect to live cloud Postgres.
// Otherwise, fall back cleanly to the typed in-memory mock client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('⚡ Initializing Supabase cloud backend');
  setApiClient(new SupabaseApiClient(supabaseUrl, supabaseKey));
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

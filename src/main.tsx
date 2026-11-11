import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setApiClient } from './api/client';
import { mockApiClient } from './api/mock';

// Initialize the API client with our typed mock layer
setApiClient(mockApiClient);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

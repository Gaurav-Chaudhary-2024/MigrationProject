import React from 'react';
import ReactDOM from 'react-dom/client';

// Core styles
import './index.css';
import 'katex/dist/katex.min.css';

// Main App Component
import App from './App';

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
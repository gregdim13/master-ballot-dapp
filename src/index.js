import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.css';
import App from './components/App.js'; // <-- Πρόσθεσε .js στην εισαγωγή
import reportWebVitals from './reportWebVitals.js'; // <-- Πρόσθεσε .js στην εισαγωγή

//window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';                               // Εισαγωγή του βασικού αρχείου CSS της εφαρμογής
import 'bootstrap/dist/css/bootstrap.css';          // Εισαγωγή του Bootstrap για στυλιστική διαμόρφωση
import App from './components/App.js';              // Εισαγωγή του βασικού component της εφαρμογής
import reportWebVitals from './reportWebVitals.js'; // Εισαγωγή του εργαλείου καταγραφής επιδόσεων

// Δημιουργία της root για την απόδοση της εφαρμογής στο DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

// Απόδοση της εφαρμογής μέσα σε StrictMode για εντοπισμό πιθανών προβλημάτων
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Κλήση της συνάρτησης καταγραφής επιδόσεων (μπορεί να χρησιμοποιηθεί για ανάλυση απόδοσης)
reportWebVitals();

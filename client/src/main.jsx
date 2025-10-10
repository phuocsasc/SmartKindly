import CssBaseline from '@mui/material/CssBaseline';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Config react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Config react-router-dom with BrowserRouter
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter basename="/">
        <CssBaseline />
        <App />
        <ToastContainer position="top-right" theme="colored" />
    </BrowserRouter>,
);

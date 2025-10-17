import CssBaseline from '@mui/material/CssBaseline';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import theme from './theme';

// Config react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Config react-router-dom with BrowserRouter
import { BrowserRouter } from 'react-router-dom';

// Import DatePickerProvider
import DatePickerProvider from './components/common/DatePickerProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter basename="/">
        <CssVarsProvider theme={theme}>
            <CssBaseline />
            <DatePickerProvider>
                <App />
                <ToastContainer position="top-right" theme="colored" />
            </DatePickerProvider>
        </CssVarsProvider>
    </BrowserRouter>,
);

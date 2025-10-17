import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '~/config/dayjsConfig';
import 'dayjs/locale/vi';

function DatePickerProvider({ children }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            {children}
        </LocalizationProvider>
    );
}

export default DatePickerProvider;

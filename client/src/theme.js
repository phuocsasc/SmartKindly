import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import { teal, deepOrange, cyan, orange } from '@mui/material/colors';

// Create a theme instance.
const theme = extendTheme({
    colorSchemes: {
        light: {
            palette: {
                primary: teal,
                secondary: deepOrange,
            },
        },
        dark: {
            palette: {
                primary: cyan,
                secondary: orange,
            },
        },
    },
    // ...other properties
    // typography: {
    //     fontFamily: ['"TikTok Sans", sans-serif', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'].join(','),
    //     h1: {
    //         fontWeight: 700,
    //     },
    //     h2: {
    //         fontWeight: 700,
    //     },
    //     h3: {
    //         fontWeight: 600,
    //     },
    //     h4: {
    //         fontWeight: 600,
    //     },
    //     h5: {
    //         fontWeight: 600,
    //     },
    //     h6: {
    //         fontWeight: 600,
    //     },
    //     button: {
    //         fontWeight: 600,
    //     },
    // },
});

export default theme;

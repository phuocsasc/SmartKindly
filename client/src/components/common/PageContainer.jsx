import { Box } from '@mui/material';

function PageContainer({ children, maxWidth = 1400 }) {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth,
                mx: 'auto',
                px: { xs: 1.5, sm: 2.5, md: 3 },
                py: { xs: 1.5, md: 1 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            {children}
        </Box>
    );
}

export default PageContainer;

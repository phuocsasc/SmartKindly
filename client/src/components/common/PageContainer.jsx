import { Box } from '@mui/material';

function PageContainer({ children, maxWidth = 2600 }) {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth,
                mx: 'auto',
                px: { xs: 1.5, sm: 2, md: 2 },
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

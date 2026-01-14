import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

function PageBreadcrumb({ items }) {
    return (
        <Breadcrumbs sx={{ mb: 0 }}>
            <Link color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Tổng quan
            </Link>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                if (isLast) {
                    return (
                        <Typography key={index} color="text.primary">
                            {item.text}
                        </Typography>
                    );
                }

                return (
                    <Link
                        key={index}
                        color="inherit"
                        href={item.href || '/#'}
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        {item.icon && <item.icon sx={{ mr: 0.5 }} fontSize="inherit" />}
                        {item.text}
                    </Link>
                );
            })}
        </Breadcrumbs>
    );
}

export default PageBreadcrumb;

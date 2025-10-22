import { Breadcrumbs, Link, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

function PageBreadcrumb({ items }) {
    return (
        <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="#" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Trang chủ
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

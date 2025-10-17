import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { ROLES, ROLE_DISPLAY, PERMISSIONS } from './rbacConfig';

export const ROLE_CONFIG = {
    [ROLES.BAN_GIAM_HIEU]: {
        color: '#d32f2f',
        bgColor: '#ffebee',
        icon: SchoolIcon,
    },
    [ROLES.TO_TRUONG]: {
        color: '#f57c00',
        bgColor: '#fff3e0',
        icon: GroupsIcon,
    },
    [ROLES.GIAO_VIEN]: {
        color: '#1976d2',
        bgColor: '#e3f2fd',
        icon: PersonIcon,
    },
    [ROLES.KE_TOAN]: {
        color: '#388e3c',
        bgColor: '#e8f5e9',
        icon: AccountBalanceIcon,
    },
    [ROLES.PHU_HUYNH]: {
        color: '#7b1fa2',
        bgColor: '#f3e5f5',
        icon: FamilyRestroomIcon,
    },
};

export { ROLES, ROLE_DISPLAY, PERMISSIONS };

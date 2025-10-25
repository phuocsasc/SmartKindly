import { StatusCodes } from 'http-status-codes';

const access = async (req, res) => {
    try {
        // console.log('req.jwtDecoded: ', req.jwtDecoded);
        const userInfo = {
            id: req.jwtDecoded.id,
            username: req.jwtDecoded.username,
            fullName: req.jwtDecoded.fullName,
            role: req.jwtDecoded.role,
            isRoot: req.jwtDecoded.isRoot || false,
            schoolId: req.jwtDecoded.schoolId,
            schoolName: req.jwtDecoded.schoolName,
            status: req.jwtDecoded.status,
        };

        res.status(StatusCodes.OK).json(userInfo);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
    }
};

export const dashboardController = {
    access,
};

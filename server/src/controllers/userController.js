import { StatusCodes } from 'http-status-codes';
import { userServices } from '~/services/userServices';

const login = async (req, res, next) => {
    try {
        const result = await userServices.login(req.body);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const result = await userServices.logout();
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const result = await userServices.refreshToken(req.body.refreshToken);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const userController = {
    login,
    logout,
    refreshToken,
};

import {RequestHandler} from "express";
import Logger from '../../config/logger';

const register: RequestHandler = async (req, res): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented!";
        res.status(501).send();
        return;
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const login: RequestHandler = async (req, res): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented!";
        res.status(501).send();
        return;
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const logout: RequestHandler = async (req, res): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented!";
        res.status(501).send();
        return;
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const view: RequestHandler = async (req, res): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented!";
        res.status(501).send();
        return;
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const update: RequestHandler = async (req, res): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented!";
        res.status(501).send();
        return;
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {register, login, logout, view, update}

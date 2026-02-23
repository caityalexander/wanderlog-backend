import Logger from "../../config/logger";
import {RequestHandler} from "express";

export const getBlogImage: RequestHandler = async (req, res): Promise<void> => {
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

export const setBlogImage: RequestHandler = async (req, res): Promise<void> => {
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

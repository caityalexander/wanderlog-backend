import {RequestHandler} from "express";
import Logger from "../../config/logger";

const getImage: RequestHandler = async (req, res): Promise<void> => {
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

const setImage: RequestHandler = async (req, res): Promise<void> => {
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

const deleteImage: RequestHandler = async (req, res): Promise<void> => {
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

export {getImage, setImage, deleteImage}

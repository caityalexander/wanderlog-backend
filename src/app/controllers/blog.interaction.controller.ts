import Logger from "../../config/logger";
import {RequestHandler} from "express";


export const getAllBlogReactions: RequestHandler = async (req, res) => {
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

export const reactToBlog: RequestHandler = async (req, res) => {
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

export const deleteReactionFromBlog: RequestHandler = async (req, res) => {
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

export const getAllBlogComments: RequestHandler = async (req, res) => {
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

export const addCommentToBlog: RequestHandler = async (req, res) => {
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

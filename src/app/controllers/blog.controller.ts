import {RequestHandler} from "express";
import Logger from "../../config/logger";

export const getAllBlogs: RequestHandler = async (req, res) => {
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

export const getBlog: RequestHandler = async (req, res) => {
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

export const addBlog: RequestHandler = async (req, res) => {
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

export const updateBlog: RequestHandler = async (req, res) => {
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

export const deleteBlog: RequestHandler = async (req, res) => {
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

export const getCategories: RequestHandler = async(req, res): Promise<void> => {
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

export const getCities: RequestHandler = async(req, res): Promise<void> => {
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

export const getSeries: RequestHandler = async (req, res): Promise<void> => {
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

import { RequestHandler } from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.model";
import path from "path";
import fs from "mz/fs";

const imageDirectory = path.join(__dirname, "../../../storage/images");

const getImage: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const user = await users.getById(id);

        if (!user) {
            res.status(404).send();
            return;
        }

        if (!user.image_filename) {
            res.status(404).send();
            return;
        }

        const imagePath = path.join(imageDirectory, user.image_filename);

        const exists = await fs.exists(imagePath);
        if (!exists) {
            res.status(404).send();
            return;
        }

        const extension = path.extname(user.image_filename).toLowerCase();

        if (extension === ".png") {
            res.contentType("image/png");
        } else if (extension === ".jpg" || extension === ".jpeg") {
            res.contentType("image/jpeg");
        } else if (extension === ".gif") {
            res.contentType("image/gif");
        } else {
            res.status(404).send();
            return;
        }

        const image = await fs.readFile(imagePath);
        res.status(200).send(image);
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

const setImage: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const token = req.header("X-Authorization");
        if (!token) {
            res.status(401).send();
            return;
        }

        const authUser = await users.getByToken(token);
        if (!authUser) {
            res.status(401).send();
            return;
        }

        const user = await users.getById(id);
        if (!user) {
            res.status(404).send();
            return;
        }

        if (authUser.id !== id) {
            res.status(403).send();
            return;
        }

        const contentType = req.header("Content-Type");
        let extension = "";

        if (contentType === "image/png") {
            extension = ".png";
        } else if (contentType === "image/jpeg") {
            extension = ".jpg";
        } else if (contentType === "image/gif") {
            extension = ".gif";
        } else {
            res.status(400).send();
            return;
        }

        const filename = `user_${id}${extension}`;
        const imagePath = path.join(imageDirectory, filename);

        const hadImageBefore = !!user.image_filename;

        await fs.mkdir(imageDirectory, { recursive: true });
        await fs.writeFile(imagePath, req.body);

        await users.setImageFilename(id, filename);

        res.status(hadImageBefore ? 200 : 201).send();
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

const deleteImage: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const token = req.header("X-Authorization");
        if (!token) {
            res.status(401).send();
            return;
        }

        const authUser = await users.getByToken(token);
        if (!authUser) {
            res.status(401).send();
            return;
        }

        const user = await users.getById(id);
        if (!user) {
            res.status(404).send();
            return;
        }

        if (authUser.id !== id) {
            res.status(403).send();
            return;
        }

        if (!user.image_filename) {
            res.status(404).send();
            return;
        }

        const imagePath = path.join(imageDirectory, user.image_filename);

        if (await fs.exists(imagePath)) {
            await fs.unlink(imagePath);
        }

        await users.removeImageFilename(id);

        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

export { getImage, setImage, deleteImage };
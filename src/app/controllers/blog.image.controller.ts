import Logger from "../../config/logger";
import { RequestHandler } from "express";
import * as blogs from "../models/blog.model";
import path from "path";
import fs from "mz/fs";
import * as users from "../models/user.model";

const imageDirectory = path.join(__dirname, "../../../storage/images");

export const getBlogImage: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const blogImage = await blogs.getBlogImage(id);
        if (!blogImage) {
            res.status(404).send();
            return;
        }

        if (!blogImage.image_filename) {
            res.status(404).send();
            return;
        }

        const imagePath = path.join(imageDirectory, blogImage.image_filename);

        const exists = await fs.exists(imagePath);
        if (!exists) {
            res.status(404).send();
            return;
        }

        const extension = path.extname(blogImage.image_filename).toLowerCase();

        if (extension === ".png") {
            res.contentType("image/png");
        } else if (extension === ".jpg" || extension === ".jpeg") {
            res.contentType("image/jpeg");
        } else if (extension === ".gif") {
            res.contentType("image/gif");
        } else {
            res.status(400).send();
            return;
        }

        const image = await fs.readFile(imagePath);
        res.status(200).send(image);
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

export const setBlogImage: RequestHandler = async (req, res): Promise<void> => {
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

        const existingBlog = await blogs.getBlogById(id);
        if (!existingBlog) {
            res.status(404).send();
            return;
        }

        if (existingBlog.creatorId !== authUser.id) {
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

        const existingBlogImage = await blogs.getBlogImage(id);
        const hadImageBefore = !!existingBlogImage?.image_filename;

        const filename = `blog_${id}${extension}`;
        const imagePath = path.join(imageDirectory, filename);

        await fs.mkdir(imageDirectory, { recursive: true });
        await fs.writeFile(imagePath, req.body);

        await blogs.setImageFilename(id, filename);

        res.status(hadImageBefore ? 200 : 201).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

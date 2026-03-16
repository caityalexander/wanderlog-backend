import Logger from "../../config/logger";
import { RequestHandler } from "express";
import * as blogs from "../models/blog.model";
import * as users from "../models/user.model";

const reactions = [
    "REACTION_1",
    "REACTION_2",
    "REACTION_3",
    "REACTION_4",
    "REACTION_5"
];

export const getAllBlogReactions: RequestHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const existingBlog = await blogs.getBlogById(id);
        if (!existingBlog) {
            res.status(404).send();
            return;
        }

        const blogReactions = await blogs.getReactions(id);
        res.status(200).json(blogReactions);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const reactToBlog: RequestHandler = async (req, res) => {
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

        if (existingBlog.creatorId === authUser.id) {
            res.status(403).send();
            return;
        }

        const reaction = req.body.reaction;

        if (typeof reaction !== "string" || !reactions.includes(reaction)) {
            res.status(400).send();
            return;
        }

        await blogs.react(id, authUser.id, reaction);
        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const deleteReactionFromBlog: RequestHandler = async (req, res) => {
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

        const existingReaction = await blogs.getReactionByUser(id, authUser.id);
        if (!existingReaction) {
            res.status(403).send();
            return;
        }

        await blogs.deleteReaction(id, authUser.id);
        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const getAllBlogComments: RequestHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const existingBlog = await blogs.getBlogById(id);
        if (!existingBlog) {
            res.status(404).send();
            return;
        }

        const comments = await blogs.getComments(id);
        res.status(200).json(comments);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const addCommentToBlog: RequestHandler = async (req, res) => {
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

        const comment = req.body.comment;
        const parentId = req.body.parentId;

        if (typeof comment !== "string" || comment.trim() === "" || comment.length > 512) {
            res.status(400).send();
            return;
        }

        if (
            parentId !== undefined &&
            parentId !== null &&
            (!Number.isInteger(parentId) || parentId < 0)
        ) {
            res.status(400).send();
            return;
        }

        if (parentId !== undefined && parentId !== null) {
            const parentComment = await blogs.getCommentById(parentId);

            if (!parentComment || Number(parentComment.blog_id) !== id) {
                res.status(404).send();
                return;
            }

            if (parentComment.parent_id !== null) {
                res.status(403).send();
                return;
            }
        }

        await blogs.makeComment(
            id,
            authUser.id,
            comment.trim(),
            parentId === undefined ? null : parentId
        );

        res.status(201).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};
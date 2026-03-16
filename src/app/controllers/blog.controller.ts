import {RequestHandler} from "express";
import Logger from "../../config/logger";
import * as blogs from "../models/blog.model";
import * as users from "../models/user.model"

export const getAllBlogs: RequestHandler = async (req, res): Promise<void> => {
    try {
        let categoryIds: number[] | undefined;
        let cityIds: number[] | undefined;

        const startIndex =
            req.query.startIndex !== undefined ? Number(req.query.startIndex) : undefined;
        const count =
            req.query.count !== undefined ? Number(req.query.count) : undefined;
        const q =
            req.query.q !== undefined ? String(req.query.q) : undefined;
        const numReactions =
            req.query.numReactions !== undefined ? Number(req.query.numReactions) : undefined;
        const creatorId =
            req.query.creatorId !== undefined ? Number(req.query.creatorId) : undefined;
        const sortBy =
            req.query.sortBy !== undefined ? String(req.query.sortBy) : undefined;
        const interactedByMe =
            req.query.interactedByMe !== undefined ? String(req.query.interactedByMe) : undefined;

        if (req.query.categoryIds !== undefined) {
            if (Array.isArray(req.query.categoryIds)) {
                categoryIds = req.query.categoryIds
                    .flatMap((value) => String(value).split(','))
                    .filter((value) => value !== "")
                    .map((value) => Number(value));
            } else {
                categoryIds = String(req.query.categoryIds)
                    .split(',')
                    .filter((value) => value !== "")
                    .map((value) => Number(value));
            }

            if (categoryIds.some((id) => isNaN(id) || id < 0)) {
                res.status(400).send();
                return;
            }
        }
        if (categoryIds !== undefined && categoryIds.length > 0) {
            const existingCount = await blogs.countExistingCategoryIds(categoryIds);
            const uniqueCount = new Set(categoryIds).size;

            if (existingCount !== uniqueCount) {
                res.status(400).send();
                return;
            }
        }

        if (req.query.cityIds !== undefined) {
            if (Array.isArray(req.query.cityIds)) {
                cityIds = req.query.cityIds
                    .flatMap((value) => String(value).split(','))
                    .filter((value) => value !== "")
                    .map((value) => Number(value));
            } else {
                cityIds = String(req.query.cityIds)
                    .split(',')
                    .filter((value) => value !== "")
                    .map((value) => Number(value));
            }

            if (cityIds.some((id) => isNaN(id) || id < 0)) {
                res.status(400).send();
                return;
            }
        }
        if (cityIds !== undefined && cityIds.length > 0) {
            const existingCount = await blogs.countExistingCityIds(cityIds);
            const uniqueCount = new Set(cityIds).size;

            if (existingCount !== uniqueCount) {
                res.status(400).send();
                return;
            }
        }

        let interactedUserId: number | undefined;

        if (interactedByMe !== undefined) {
            if (interactedByMe !== "true" && interactedByMe !== "false") {
                res.status(400).send();
                return;
            }

            if (interactedByMe === "true") {
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

                interactedUserId = authUser.id;
            }
        }


        if (startIndex !== undefined && (isNaN(startIndex) || startIndex < 0)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }

        if (count !== undefined && (isNaN(count) || count < 0)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }

        if (numReactions !== undefined && (isNaN(numReactions) || numReactions < 0)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }

        if (creatorId !== undefined && (isNaN(creatorId) || creatorId < 0)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }

        const validSortValues = [
            "ALPHABETICAL_ASC",
            "ALPHABETICAL_DESC",
            "REACTIONS_ASC",
            "REACTIONS_DESC",
            "CREATED_ASC",
            "CREATED_DESC"
        ];

        if (sortBy !== undefined && !validSortValues.includes(sortBy)) {
            res.status(400).send();
            return;
        }

        const blogsList = await blogs.getAllBlogs(
            startIndex,
            count,
            q,
            numReactions,
            creatorId,
            categoryIds,
            cityIds,
            sortBy,
            interactedUserId
        );

        const totalCount = await blogs.getBlogsCount(
            q,
            numReactions,
            creatorId,
            categoryIds,
            cityIds,
            interactedUserId
        );

        res.status(200).json({
            blogs: blogsList,
            count: totalCount
        });
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};
export const getBlog: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const blog = await blogs.getBlogById(id);

        if (!blog) {
            res.status(404).send();
            return;
        }

        res.status(200).json(blog);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};
export const addBlog: RequestHandler = async (req, res): Promise<void> => {
    try {
        const token = req.header("X-Authorization");
        if (!token) {
            res.status(401).send();
            return;
        }

        const user = await users.getByToken(token);
        if (!user) {
            res.status(401).send();
            return;
        }

        const title = req.body.title;
        const description = req.body.description;
        const series = req.body.series;
        const cityId = req.body.cityId;
        const categoryIds = req.body.categoryIds;

        if (
            title === undefined ||
            description === undefined ||
            cityId === undefined ||
            categoryIds === undefined
        ) {
            res.status(400).send();
            return;
        }

        if (
            typeof title !== "string" ||
            typeof description !== "string" ||
            typeof cityId !== "number" ||
            !Array.isArray(categoryIds)
        ) {
            res.status(400).send();
            return;
        }

        if (series !== undefined && typeof series !== "string") {
            res.status(400).send();
            return;
        }

        if (title.trim() === "" || description.trim() === "") {
            res.status(400).send();
            return;
        }

        if (description.length > 1024) {
            res.status(400).send();
            return;
        }

        if (categoryIds.length === 0) {
            res.status(400).send();
            return;
        }

        if (
            categoryIds.some(
                (id: any) => typeof id !== "number" || !Number.isInteger(id) || id < 0
            )
        ) {
            res.status(400).send();
            return;
        }

        if (!Number.isInteger(cityId) || cityId < 0) {
            res.status(400).send();
            return;
        }

        const existingCategoryCount = await blogs.countExistingCategoryIds(categoryIds);
        const uniqueCategoryCount = new Set(categoryIds).size;
        if (existingCategoryCount !== uniqueCategoryCount) {
            res.status(400).send();
            return;
        }

        const existingCityCount = await blogs.countExistingCityIds([cityId]);
        if (existingCityCount !== 1) {
            res.status(400).send();
            return;
        }

        if (series !== undefined && series.trim() !== "") {
            const alreadyUsed = await blogs.seriesUsedByAnotherUser(series.trim(), user.id);
            if (alreadyUsed) {
                res.status(403).send();
                return;
            }
        }

        const blogId = await blogs.postBlog(
            title.trim(),
            description.trim(),
            series !== undefined && series.trim() !== "" ? series.trim() : null,
            cityId,
            user.id,
            categoryIds
        );

        res.status(201).json({ blogId });
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const updateBlog: RequestHandler = async (req, res): Promise<void> => {
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

        const title = req.body.title;
        const description = req.body.description;
        const cityId = req.body.cityId;
        const categoryIds = req.body.categoryIds;
        const series = req.body.series;

        if (
            title === undefined &&
            description === undefined &&
            cityId === undefined &&
            categoryIds === undefined &&
            series === undefined
        ) {
            res.status(400).send();
            return;
        }

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim() === "" || title.length > 128) {
                res.status(400).send();
                return;
            }
        }

        if (description !== undefined) {
            if (
                typeof description !== "string" ||
                description.trim() === "" ||
                description.length > 1024
            ) {
                res.status(400).send();
                return;
            }
        }

        if (cityId !== undefined) {
            if (!Number.isInteger(cityId) || cityId < 0) {
                res.status(400).send();
                return;
            }

            const existingCityCount = await blogs.countExistingCityIds([cityId]);
            if (existingCityCount !== 1) {
                res.status(400).send();
                return;
            }
        }

        if (categoryIds !== undefined) {
            if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
                res.status(400).send();
                return;
            }

            if (
                categoryIds.some(
                    (categoryId: any) =>
                        typeof categoryId !== "number" ||
                        !Number.isInteger(categoryId) ||
                        categoryId < 0
                )
            ) {
                res.status(400).send();
                return;
            }

            const existingCategoryCount = await blogs.countExistingCategoryIds(categoryIds);
            const uniqueCategoryCount = new Set(categoryIds).size;

            if (existingCategoryCount !== uniqueCategoryCount) {
                res.status(400).send();
                return;
            }
        }

        if (series !== undefined) {
            if (typeof series !== "string") {
                res.status(400).send();
                return;
            }

            if (series.trim() === "") {
                res.status(400).send();
                return;
            }

            if (existingBlog.series !== null && existingBlog.series !== undefined && existingBlog.series !== "") {
                if (series.trim().toLowerCase() !== String(existingBlog.series).trim().toLowerCase()) {
                    res.status(403).send();
                    return;
                }
            } else {
                const alreadyUsed = await blogs.seriesUsedByAnotherUser(series.trim(), authUser.id);
                if (alreadyUsed) {
                    res.status(403).send();
                    return;
                }
            }
        }

        await blogs.updateBlogById(
            id,
            title !== undefined ? title.trim() : undefined,
            description !== undefined ? description.trim() : undefined,
            cityId,
            series !== undefined ? series.trim() : undefined,
            categoryIds
        );

        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const deleteBlog: RequestHandler = async (req, res): Promise<void> => {
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

        const commentCount = await blogs.getCommentCountForBlog(id);
        if (commentCount > 0) {
            res.status(403).send();
            return;
        }

        await blogs.deleteBlogById(id);

        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const getCategories: RequestHandler = async (req, res): Promise<void> => {
    try {
        const categories = await blogs.getAllCategories();

        res.status(200).json(categories);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const getCities: RequestHandler = async (req, res): Promise<void> => {
    try {
        const cities = await blogs.getAllCities();
        res.status(200).json(cities);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export const getSeries: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id < 0) {
            res.status(400).send();
            return;
        }

        const existingUser = await users.getById(id);
        if (!existingUser) {
            res.status(404).send();
            return;
        }

        const series = await blogs.getSeriesByUser(id);

        res.status(200).json(series);
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};




import {RequestHandler} from "express";
import Logger from '../../config/logger';
import * as users from '../models/user.model';
import crypto from "crypto";

const register: RequestHandler = async (req, res): Promise<void> => {
    try {
        const {firstName, lastName, email, password} = req.body;

                if (
                    firstName === undefined ||
                    lastName === undefined ||
                    email === undefined ||
                    password === undefined
                ) {
                    res.status(400).send();
                    return;
                }

        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            res.status(400).send();
            return;
        }

        if (
            firstName.trim() === "" ||
            lastName.trim() === "" ||
            email.trim() === ""
        ) {
            res.status(400).send();
            return;
        }

        if (
            firstName.length > 64 ||
            lastName.length > 64 ||
            email.length > 256 ||
            password.length < 6 ||
            password.length > 64
        ) {
            res.status(400).send();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).send();
            return;
        }

        const existingUser = await users.getByEmail(email);
        if (existingUser) {
            res.status(403).send();
            return;
        }

        const userId = await users.insert(firstName, lastName, email, null, password);

        res.status(201).json({userId});
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

const view: RequestHandler = async (req, res): Promise<void> => {
    try {

        const id = parseInt(req.params.id as string);

        if (isNaN(id)) {
            res.status(400).send();
            return;
        }

        const user = await users.getById(id);

        if (!user) {
            res.status(404).send();
            return;
        }

        const token = req.header("X-Authorization");

        let viewer = null;

        if (token) {
            viewer = await users.getByToken(token);
        }

        // if viewing own profile
        if (viewer && viewer.id === id) {
            res.status(200).json({
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            });
        } else {
            // viewing another user
            res.status(200).json({
                firstName: user.first_name,
                lastName: user.last_name
            });
        }

    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};
const login: RequestHandler = async (req, res): Promise<void> => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            res.status(400).send();
            return;
        }

        const user = await users.getByEmail(email);

        if (!user) {
            res.status(401).send();
            return;
        }

        if (user.password !== password) {
            res.status(401).send();
            return;
        }

        const token = crypto.randomBytes(16).toString("hex");

        await users.setAuthToken(user.id, token);

        res.status(200).json({
            userId: user.id,
            token: token
        });

    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};

const logout: RequestHandler = async (req, res): Promise<void> => {
    try {
        const token = req.header("X-Authorization");
        if (!token) {
            res.status(401).send();
            return;
        }
        await users.removeAuthToken(token);
        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const update: RequestHandler = async (req, res): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);

        if (isNaN(id)) {
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

        const targetUser = await users.getById(id);
        if (!targetUser) {
            res.status(404).send();
            return;
        }

        if (authUser.id !== id) {
            res.status(403).send();
            return;
        }

        const {
            firstName,
            lastName,
            email,
            password,
            currentPassword
        } = req.body;

        if (
            firstName === undefined &&
            lastName === undefined &&
            email === undefined &&
            password === undefined &&
            currentPassword === undefined
        ) {
            res.status(400).send();
            return;
        }

        if (firstName !== undefined) {
            if (
                typeof firstName !== "string" ||
                firstName.trim() === "" ||
                firstName.length > 64
            ) {
                res.status(400).send();
                return;
            }
        }

        if (lastName !== undefined) {
            if (
                typeof lastName !== "string" ||
                lastName.trim() === "" ||
                lastName.length > 64
            ) {
                res.status(400).send();
                return;
            }
        }

        if (email !== undefined) {
            if (
                typeof email !== "string" ||
                email.trim() === "" ||
                email.length > 256
            ) {
                res.status(400).send();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).send();
                return;
            }

            const existingUser = await users.getByEmail(email);
            if (existingUser && existingUser.id !== id) {
                res.status(403).send();
                return;
            }
        }
        if (password !== undefined || currentPassword !== undefined) {
            if (
                password === undefined ||
                currentPassword === undefined ||
                typeof password !== "string" ||
                typeof currentPassword !== "string" ||
                password.length < 6 ||
                password.length > 64 ||
                currentPassword.length < 6 ||
                currentPassword.length > 64
            ) {
                res.status(400).send();
                return;
            }

            if (password === currentPassword) {
                res.status(403).send();
                return;
            }

            if (targetUser.password !== currentPassword) {
                res.status(401).send();
                return;
            }
        }

        await users.updateUser(id, {
            firstName,
            lastName,
            email,
            password
        });

        res.status(200).send();
    } catch (error) {
        Logger.error(error);
        res.status(500).send();
    }
};


export {register, login, logout, view, update}

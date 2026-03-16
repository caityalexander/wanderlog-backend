import {getPool} from '../../config/db';
import Logger from '../../config/logger';
import {ResultSetHeader, RowDataPacket} from 'mysql2';

const getByEmail = async (email: string): Promise<RowDataPacket | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT *
        FROM user
        WHERE email = ?
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [email]);
    conn.release();
    return rows.length > 0 ? rows[0] : null;
};

const insert = async (
    firstName: string,
    lastName: string,
    email: string,
    imageFilename: string | null,
    password: string
): Promise<number> => {
    Logger.info(`Adding user ${email} to the database`);
    const conn = await getPool().getConnection();

    const query = `
        INSERT INTO user (first_name, last_name, email, image_filename, password)
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await conn.query<ResultSetHeader>(query, [
        firstName,
        lastName,
        email,
        imageFilename,
        password
    ]);

    conn.release();
    return result.insertId;
};

const getById = async (id: number): Promise<RowDataPacket | null> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT *
        FROM user
        WHERE id = ?
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    conn.release();
    return rows.length > 0 ? rows[0] : null;
};
const removeAuthToken = async (token: string): Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `
        UPDATE user
        SET auth_token = NULL
        WHERE auth_token = ?
    `;
    await conn.query(query, [token]);
    conn.release();
};

const setAuthToken = async (userId: number, token: string): Promise<void> => {
    const conn = await getPool().getConnection();

    const query = `
        UPDATE user
        SET auth_token = ?
        WHERE id = ?
    `;

    await conn.query(query, [token, userId]);

    conn.release();
};

const getByToken = async (token: string): Promise<any | null> => {

    const conn = await getPool().getConnection();

    const query = `
        SELECT *
        FROM user
        WHERE auth_token = ?
    `;

    const [rows] = await conn.query(query, [token]);

    conn.release();

    if ((rows as any[]).length === 0) {
        return null;
    }

    return (rows as any[])[0];
};

const updateUser = async (
    id: number,
    fields: {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
    }
): Promise<void> => {
    const conn = await getPool().getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (fields.firstName !== undefined) {
        updates.push("first_name = ?");
        values.push(fields.firstName);
    }
    if (fields.lastName !== undefined) {
        updates.push("last_name = ?");
        values.push(fields.lastName);
    }
    if (fields.email !== undefined) {
        updates.push("email = ?");
        values.push(fields.email);
    }
    if (fields.password !== undefined) {
        updates.push("password = ?");
        values.push(fields.password);
    }

    if (updates.length === 0) {
        conn.release();
        return;
    }

    values.push(id);

    const query = `
        UPDATE user
        SET ${updates.join(", ")}
        WHERE id = ?
    `;

    await conn.query<ResultSetHeader>(query, values);
    conn.release();
};
const setImageFilename = async (id: number, filename: string): Promise<void> => {
    const conn = await getPool().getConnection();

    const query = `
        UPDATE user
        SET image_filename = ?
        WHERE id = ?
    `;

    await conn.query(query, [filename, id]);
    conn.release();
};

const removeImageFilename = async (id: number): Promise<void> => {
    const conn = await getPool().getConnection();

    const query = `
        UPDATE user
        SET image_filename = NULL
        WHERE id = ?
    `;

    await conn.query(query, [id]);
    conn.release();
};



export {getByEmail, insert, getById, removeAuthToken, setAuthToken, getByToken, updateUser, setImageFilename, removeImageFilename };
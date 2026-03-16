import { getPool } from '../../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const getAllBlogs = async (
    startIndex?: number,
    count?: number,
    q?: string,
    numReactions?: number,
    creatorId?: number,
    categoryIds?: number[],
    cityIds?: number[],
    sortBy?: string,
    interactedUserId?: number
): Promise<any[]> => {
    const conn = await getPool().getConnection();

    let query = `
        SELECT
            b.id AS blogId,
            b.title AS title,
            b.city_id AS cityId,
            b.creator_id AS creatorId,
            u.first_name AS creatorFirstName,
            u.last_name AS creatorLastName,
            (
                SELECT COUNT(*)
                FROM blog_reactions br
                WHERE br.blog_id = b.id
            ) AS numReactions,
            (
                SELECT JSON_ARRAYAGG(bc.category_id ORDER BY bc.category_id)
                FROM blog_categories bc
                WHERE bc.blog_id = b.id
            ) AS categoryIds,
            b.series AS series,
            b.creation_date AS creationDate
        FROM blog b
                 JOIN user u ON b.creator_id = u.id
        WHERE 1=1
    `;

    const params: any[] = [];

    if (q !== undefined && q !== "") {
        query += ` AND (b.title LIKE ? OR b.description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
    }

    if (numReactions !== undefined) {
        query += `
            AND (
                SELECT COUNT(*)
                FROM blog_reactions br
                WHERE br.blog_id = b.id
            ) >= ?
        `;
        params.push(numReactions);
    }

    if (creatorId !== undefined) {
        query += ` AND b.creator_id = ?`;
        params.push(creatorId);
    }

    if (categoryIds !== undefined && categoryIds.length > 0) {
        query += `
            AND EXISTS (
                SELECT 1
                FROM blog_categories bc
                WHERE bc.blog_id = b.id
                  AND bc.category_id IN (${categoryIds.map(() => '?').join(',')})
            )
        `;
        params.push(...categoryIds);
    }

    if (cityIds !== undefined && cityIds.length > 0) {
        query += ` AND b.city_id IN (${cityIds.map(() => '?').join(',')})`;
        params.push(...cityIds);
    }

    if (interactedUserId !== undefined) {
        query += `
            AND (
                EXISTS (
                    SELECT 1
                    FROM blog_reactions br2
                    WHERE br2.blog_id = b.id
                      AND br2.user_id = ?
                )
                OR
                EXISTS (
                    SELECT 1
                    FROM blog_comments bc2
                    WHERE bc2.blog_id = b.id
                      AND bc2.user_id = ?
                )
            )
        `;
        params.push(interactedUserId, interactedUserId);
    }

    if (sortBy === "ALPHABETICAL_ASC") {
        query += ` ORDER BY b.title ASC, b.id ASC`;
    } else if (sortBy === "ALPHABETICAL_DESC") {
        query += ` ORDER BY b.title DESC, b.id ASC`;
    } else if (sortBy === "REACTIONS_ASC") {
        query += ` ORDER BY numReactions ASC, b.id ASC`;
    } else if (sortBy === "REACTIONS_DESC") {
        query += ` ORDER BY numReactions DESC, b.id ASC`;
    } else if (sortBy === "CREATED_ASC") {
        query += ` ORDER BY b.creation_date ASC, b.id ASC`;
    } else {
        query += ` ORDER BY b.creation_date DESC, b.id ASC`;
    }

    if (count !== undefined && startIndex !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(count, startIndex);
    } else if (count !== undefined) {
        query += ` LIMIT ?`;
        params.push(count);
    } else if (startIndex !== undefined) {
        query += ` LIMIT 18446744073709551615 OFFSET ?`;
        params.push(startIndex);
    }

    const [rows] = await conn.query<RowDataPacket[]>(query, params);
    conn.release();

    return rows.map((row) => ({
        blogId: row.blogId,
        title: row.title,
        cityId: row.cityId,
        creatorId: row.creatorId,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        numReactions: Number(row.numReactions),
        categoryIds: row.categoryIds ? JSON.parse(row.categoryIds) : [],
        series: row.series,
        creationDate: new Date(row.creationDate).toISOString()
    }));
};

const countExistingCategoryIds = async (categoryIds: number[]): Promise<number> => {
    const conn = await getPool().getConnection();
    const uniqueIds = [...new Set(categoryIds)];

    const query = `
        SELECT COUNT(*) AS count
        FROM category
        WHERE id IN (${uniqueIds.map(() => '?').join(',')})
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, uniqueIds);
    conn.release();
    return Number(rows[0].count);
};

const countExistingCityIds = async (cityIds: number[]): Promise<number> => {
    const conn = await getPool().getConnection();
    const uniqueIds = [...new Set(cityIds)];

    const query = `
        SELECT COUNT(*) AS count
        FROM city
        WHERE id IN (${uniqueIds.map(() => '?').join(',')})
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, uniqueIds);
    conn.release();
    return Number(rows[0].count);
};

const seriesUsedByAnotherUser = async (series: string, creatorId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();

    const query = `
        SELECT COUNT(*) AS count
        FROM blog
        WHERE LOWER(series) = LOWER(?)
          AND creator_id <> ?
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, [series, creatorId]);
    conn.release();

    return Number(rows[0].count) > 0;
};

const postBlog = async (
    title: string,
    description: string,
    series: string | null,
    cityId: number,
    creatorId: number,
    categoryIds: number[]
): Promise<number> => {
    const conn = await getPool().getConnection();

    try {
        await conn.beginTransaction();

        const insertBlogQuery = `
            INSERT INTO blog (title, description, series, creator_id, city_id, creation_date)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await conn.query<ResultSetHeader>(insertBlogQuery, [
            title,
            description,
            series,
            creatorId,
            cityId
        ]);

        const blogId = result.insertId;

        const insertCategoryQuery = `
            INSERT INTO blog_categories (blog_id, category_id)
            VALUES (?, ?)
        `;

        for (const categoryId of categoryIds) {
            await conn.query(insertCategoryQuery, [blogId, categoryId]);
        }

        await conn.commit();
        return blogId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getBlogsCount = async (
    q?: string,
    numReactions?: number,
    creatorId?: number,
    categoryIds?: number[],
    cityIds?: number[],
    interactedUserId?: number
): Promise<number> => {
    const conn = await getPool().getConnection();

    let query = `
        SELECT COUNT(*) AS count
        FROM blog b
        WHERE 1=1
    `;

    const params: any[] = [];

    if (q !== undefined && q !== "") {
        query += ` AND (b.title LIKE ? OR b.description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
    }

    if (numReactions !== undefined) {
        query += `
            AND (
                SELECT COUNT(*)
                FROM blog_reactions br
                WHERE br.blog_id = b.id
            ) >= ?
        `;
        params.push(numReactions);
    }

    if (creatorId !== undefined) {
        query += ` AND b.creator_id = ?`;
        params.push(creatorId);
    }

    if (categoryIds !== undefined && categoryIds.length > 0) {
        query += `
            AND EXISTS (
                SELECT 1
                FROM blog_categories bc
                WHERE bc.blog_id = b.id
                  AND bc.category_id IN (${categoryIds.map(() => '?').join(',')})
            )
        `;
        params.push(...categoryIds);
    }

    if (cityIds !== undefined && cityIds.length > 0) {
        query += ` AND b.city_id IN (${cityIds.map(() => '?').join(',')})`;
        params.push(...cityIds);
    }

    if (interactedUserId !== undefined) {
        query += `
            AND (
                EXISTS (
                    SELECT 1
                    FROM blog_reactions br2
                    WHERE br2.blog_id = b.id
                      AND br2.user_id = ?
                )
                OR
                EXISTS (
                    SELECT 1
                    FROM blog_comments bc2
                    WHERE bc2.blog_id = b.id
                      AND bc2.user_id = ?
                )
            )
        `;
        params.push(interactedUserId, interactedUserId);
    }

    const [rows] = await conn.query<RowDataPacket[]>(query, params);
    conn.release();

    return Number(rows[0].count);
};

const getAllCategories = async (): Promise<any[]> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT id AS categoryId, name
        FROM category
        ORDER BY name ASC
    `;
    const [rows] = await conn.query(query);
    conn.release();
    return rows as any[];
};

const getAllCities = async (): Promise<any[]> => {
    const conn = await getPool().getConnection();
    const query = `
        SELECT id AS cityId, name
        FROM city
        ORDER BY name ASC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(query);
    conn.release();
    return rows as any[];
};

const getBlogById = async (id: number): Promise<any | null> => {
    const conn = await getPool().getConnection();

    const query = `
        SELECT
            b.id AS blogId,
            b.title AS title,
            b.description AS description,
            b.city_id AS cityId,
            b.creator_id AS creatorId,
            u.first_name AS creatorFirstName,
            u.last_name AS creatorLastName,
            (
                SELECT COUNT(*)
                FROM blog_reactions br
                WHERE br.blog_id = b.id
            ) AS numReactions,
            (
                SELECT JSON_ARRAYAGG(bc.category_id ORDER BY bc.category_id)
                FROM blog_categories bc
                WHERE bc.blog_id = b.id
            ) AS categoryIds,
            b.series AS series,
            b.creation_date AS creationDate,
            (
                SELECT COUNT(DISTINCT bc2.user_id)
                FROM blog_comments bc2
                WHERE bc2.blog_id = b.id
            ) AS numberOfUniqueCommenters
        FROM blog b
                 JOIN user u ON b.creator_id = u.id
        WHERE b.id = ?
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, [id]);
    conn.release();

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0];

    return {
        blogId: row.blogId,
        title: row.title,
        description: row.description,
        cityId: row.cityId,
        creatorId: row.creatorId,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        numReactions: Number(row.numReactions),
        categoryIds: row.categoryIds ? JSON.parse(row.categoryIds) : [],
        series: row.series,
        creationDate: new Date(row.creationDate).toISOString(),
        numberOfUniqueCommenters: Number(row.numberOfUniqueCommenters)
    };
};

const updateBlogById = async (
    id: number,
    title?: string,
    description?: string,
    cityId?: number,
    series?: string | null,
    categoryIds?: number[]
): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        await conn.beginTransaction();

        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) {
            updates.push("title = ?");
            values.push(title);
        }

        if (description !== undefined) {
            updates.push("description = ?");
            values.push(description);
        }

        if (cityId !== undefined) {
            updates.push("city_id = ?");
            values.push(cityId);
        }

        if (series !== undefined) {
            updates.push("series = ?");
            values.push(series);
        }

        if (updates.length > 0) {
            const query = `
                UPDATE blog
                SET ${updates.join(", ")}
                WHERE id = ?
            `;
            values.push(id);
            await conn.query(query, values);
        }

        if (categoryIds !== undefined) {
            await conn.query(
                `DELETE FROM blog_categories WHERE blog_id = ?`,
                [id]
            );

            const insertCategoryQuery = `
                INSERT INTO blog_categories (blog_id, category_id)
                VALUES (?, ?)
            `;

            for (const categoryId of categoryIds) {
                await conn.query(insertCategoryQuery, [id, categoryId]);
            }
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getCommentCountForBlog = async (blogId: number): Promise<number> => {
    const conn = await getPool().getConnection();

    const query = `
        SELECT COUNT(*) AS count
        FROM blog_comments
        WHERE blog_id = ?
    `;

    const [rows] = await conn.query<RowDataPacket[]>(query, [blogId]);
    conn.release();

    return Number(rows[0].count);
};

const deleteBlogById = async (blogId: number): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        await conn.beginTransaction();

        await conn.query(
            `DELETE FROM blog_categories WHERE blog_id = ?`,
            [blogId]
        );

        await conn.query(
            `DELETE FROM blog WHERE id = ?`,
            [blogId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getSeriesByUser = async (creatorId: number): Promise<string[]> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT DISTINCT series
            FROM blog
            WHERE creator_id = ?
              AND series IS NOT NULL
              AND series <> ''
            ORDER BY series ASC
        `;

        const [rows] = await conn.query<RowDataPacket[]>(query, [creatorId]);
        return rows.map((row) => row.series as string);
    } finally {
        conn.release();
    }
};

const getBlogImage = async (blogId: number): Promise<RowDataPacket | null> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT image_filename
            FROM blog
            WHERE id = ?
        `;
        const [rows] = await conn.query<RowDataPacket[]>(query, [blogId]);
        return rows.length > 0 ? rows[0] : null;
    } finally {
        conn.release();
    }
};

const setImageFilename = async (blogId: number, filename: string): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            UPDATE blog
            SET image_filename = ?
            WHERE id = ?
        `;
        await conn.query(query, [filename, blogId]);
    } finally {
        conn.release();
    }
};

const getReactions = async (blogId: number): Promise<RowDataPacket[]> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT user_id AS userId, reaction
            FROM blog_reactions
            WHERE blog_id = ?
        `;
        const [rows] = await conn.query<RowDataPacket[]>(query, [blogId]);
        return rows;
    } finally {
        conn.release();
    }
};

const react = async (blogId: number, userId: number, reaction: string): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            INSERT INTO blog_reactions (blog_id, user_id, reaction)
            VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)
        `;
        await conn.query(query, [blogId, userId, reaction]);
    } finally {
        conn.release();
    }
};

const getReactionByUser = async (blogId: number, userId: number): Promise<RowDataPacket | null> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT *
            FROM blog_reactions
            WHERE blog_id = ? AND user_id = ?
        `;
        const [rows] = await conn.query<RowDataPacket[]>(query, [blogId, userId]);
        return rows.length > 0 ? rows[0] : null;
    } finally {
        conn.release();
    }
};

const deleteReaction = async (blogId: number, userId: number): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            DELETE FROM blog_reactions
            WHERE blog_id = ? AND user_id = ?
        `;
        await conn.query(query, [blogId, userId]);
    } finally {
        conn.release();
    }
};

const getComments = async (blogId: number): Promise<any[]> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT
                bc.id AS commentId,
                bc.user_id AS commenterId,
                bc.comment AS comment,
                u.first_name AS commenterFirstName,
                u.last_name AS commenterLastName,
                bc.timestamp AS timestamp,
                bc.parent_id AS parentId
            FROM blog_comments bc
                JOIN user u ON bc.user_id = u.id
            WHERE bc.blog_id = ?
            ORDER BY bc.timestamp DESC, bc.id DESC
        `;
        const [rows] = await conn.query<RowDataPacket[]>(query, [blogId]);

        return rows.map((row) => ({
            commentId: row.commentId,
            commenterId: row.commenterId,
            comment: row.comment,
            commenterFirstName: row.commenterFirstName,
            commenterLastName: row.commenterLastName,
            timestamp: new Date(row.timestamp).toISOString(),
            parentId: row.parentId
        }));
    } finally {
        conn.release();
    }
};

const getCommentById = async (commentId: number): Promise<RowDataPacket | null> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            SELECT *
            FROM blog_comments
            WHERE id = ?
        `;
        const [rows] = await conn.query<RowDataPacket[]>(query, [commentId]);
        return rows.length > 0 ? rows[0] : null;
    } finally {
        conn.release();
    }
};

const makeComment = async (
    blogId: number,
    userId: number,
    comment: string,
    parentId?: number | null
): Promise<void> => {
    const conn = await getPool().getConnection();

    try {
        const query = `
            INSERT INTO blog_comments (blog_id, user_id, parent_id, comment, timestamp)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await conn.query(query, [blogId, userId, parentId ?? null, comment]);
    } finally {
        conn.release();
    }
};
export {
    getAllBlogs,
    getBlogsCount,
    getAllCategories,
    getAllCities,
    countExistingCategoryIds,
    countExistingCityIds,
    getBlogById,
    postBlog,
    seriesUsedByAnotherUser,
    updateBlogById,
    getCommentCountForBlog,
    deleteBlogById,
    getSeriesByUser,
    getBlogImage,
    setImageFilename,
    getReactions,
    react,
    getReactionByUser,
    deleteReaction,
    getComments,
    getCommentById,
    makeComment
};
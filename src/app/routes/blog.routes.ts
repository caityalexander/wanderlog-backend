import {Express} from "express";
import {rootUrl} from "./base.routes";
import {
    addBlog,
    deleteBlog,
    getAllBlogs,
    getBlog,
    getCategories,
    getCities,
    updateBlog
} from "../controllers/blog.controller";
import {
    addCommentToBlog,
    deleteReactionFromBlog,
    getAllBlogComments,
    getAllBlogReactions,
    reactToBlog
} from "../controllers/blog.interaction.controller";
import {getBlogImage, setBlogImage} from "../controllers/blog.image.controller";


module.exports = (app: Express) => {
    app.route(rootUrl + '/blogs')
        .get(getAllBlogs)
        .post(addBlog);

    app.route(rootUrl + '/blogs/categories')
        .get(getCategories);

    app.route(rootUrl + '/blogs/cities')
        .get(getCities);

    app.route(rootUrl+'/blogs/:id')
        .get(getBlog)
        .patch(updateBlog)
        .delete(deleteBlog);

    app.route(rootUrl + '/blogs/:id/react')
        .get(getAllBlogReactions)
        .post(reactToBlog)
        .delete(deleteReactionFromBlog);

    app.route(rootUrl + '/blogs/:id/comments')
        .get(getAllBlogComments)
        .post(addCommentToBlog);

    app.route(rootUrl + '/blogs/:id/image')
        .get(getBlogImage)
        .put(setBlogImage);

}

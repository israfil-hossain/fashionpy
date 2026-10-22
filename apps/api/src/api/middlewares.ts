import { defineMiddlewares } from "@medusajs/medusa";
import { storeWishlistMiddlewares } from "./store/wishlist/middlewares";

export default defineMiddlewares({
    routes: [...storeWishlistMiddlewares],
});

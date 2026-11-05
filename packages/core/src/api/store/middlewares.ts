import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCartsMiddlewares } from "./carts/middlewares"
import { storeCollectionsMiddlewares } from "./collections/middlewares"
import { storeHeroBannersMiddlewares } from "./hero-banners/middlewares"
import { storeBlogPostsMiddlewares } from "./blog-posts/middlewares"
import { storeOffersMiddlewares } from "./offers/middlewares"
import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { storeProductAttributesMiddlewares } from "./product-attributes/middlewares"
import { storeProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { storeProductsMiddlewares } from "./products/middlewares"
import { storeSellersMiddlewares } from "./sellers/middlewares"
import { storeReviewsMiddlewares } from "./reviews/middlewares"
import { storeStoreSettingsMiddlewares } from "./store-settings/middlewares"
import { storeNotificationFeedMiddlewares } from "./notifications/middlewares"
import { storeMessagingMiddlewares } from "./messages/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeCollectionsMiddlewares,
  ...storeHeroBannersMiddlewares,
  ...storeBlogPostsMiddlewares,
  ...storeMessagingMiddlewares,
  ...storeOffersMiddlewares,
  ...storeOrderGroupsMiddlewares,
  ...storeProductAttributesMiddlewares,
  ...storeProductCategoriesMiddlewares,
  ...storeProductsMiddlewares,
  ...storeSellersMiddlewares,
  ...storeReviewsMiddlewares,
  ...storeStoreSettingsMiddlewares,
  ...storeNotificationFeedMiddlewares,
]

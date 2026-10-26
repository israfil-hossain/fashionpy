import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCartsMiddlewares } from "./carts/middlewares"
import { storeCollectionsMiddlewares } from "./collections/middlewares"
import { storeHeroBannersMiddlewares } from "./hero-banners/middlewares"
import { storeOffersMiddlewares } from "./offers/middlewares"
import { storeOrderGroupsMiddlewares } from "./order-groups/middlewares"
import { storeProductAttributesMiddlewares } from "./product-attributes/middlewares"
import { storeProductCategoriesMiddlewares } from "./product-categories/middlewares"
import { storeProductsMiddlewares } from "./products/middlewares"
import { storeSellersMiddlewares } from "./sellers/middlewares"
import { storeReviewsMiddlewares } from "./reviews/middlewares"
import { storeStoreSettingsMiddlewares } from "./store-settings/middlewares"

export const storeMiddlewares: MiddlewareRoute[] = [
  ...storeCartsMiddlewares,
  ...storeCollectionsMiddlewares,
  ...storeHeroBannersMiddlewares,
  ...storeOffersMiddlewares,
  ...storeOrderGroupsMiddlewares,
  ...storeProductAttributesMiddlewares,
  ...storeProductCategoriesMiddlewares,
  ...storeProductsMiddlewares,
  ...storeSellersMiddlewares,
  ...storeReviewsMiddlewares,
  ...storeStoreSettingsMiddlewares,
]

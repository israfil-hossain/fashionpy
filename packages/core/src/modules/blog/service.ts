import { MedusaService } from "@medusajs/framework/utils"

import { BlogCategory, BlogPost } from "./models"

class BlogModuleService extends MedusaService({
  BlogPost,
  BlogCategory,
}) {}

export default BlogModuleService

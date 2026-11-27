import { authenticate } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })

export const storeUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/uploads",
    middlewares: [authenticate("customer", ["session", "bearer"]), upload.array("files")],
  },
]

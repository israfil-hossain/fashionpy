import { uploadFilesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const files = (req.files ?? []) as Express.Multer.File[]

  if (!files.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No files were uploaded"
    )
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only JPG, PNG, WEBP and GIF images are allowed"
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Each image must be smaller than 5 MB"
      )
    }
  }

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: files.map(file => ({
        filename: file.originalname,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
        access: "public",
      })),
    },
  })

  res.json({ files: result })
}

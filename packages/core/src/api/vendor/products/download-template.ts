import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import path from "path"
import fs from "fs"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const templatePath = path.join(
    __dirname,
    "product-notification-template.csv"
  )

  if (!fs.existsSync(templatePath)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Notification template file not found"
    )
  }

  res.setHeader("Content-Type", "text/csv")
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="product-import-template.csv"'
  )
  res.send(fs.readFileSync(templatePath))
}
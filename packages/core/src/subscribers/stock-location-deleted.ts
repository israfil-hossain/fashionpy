import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { updateStoresWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function stockLocationDeletedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_location_id"],
  })

  const affectedIds = stores
    .filter((store) => store.default_location_id === event.data.id)
    .map((store) => store.id as string)

  if (!affectedIds.length) {
    return
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: affectedIds },
      update: { default_location_id: null },
    },
  })

  logger.info(
    `Cleared default location ${event.data.id} from ${affectedIds.length} store(s)`
  )
}

export const config: SubscriberConfig = {
  event: "stock_location.stock-location.deleted",
}

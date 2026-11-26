import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { deleteWishlistEntryWorkflow } from "../../../../../workflows/wishlist/workflows/delete-wishlist";
import { getWishlistFromCustomerId } from "../../../../../modules/wishlist/utils";

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const wishlist = await getWishlistFromCustomerId(
    req.scope,
    req.auth_context.actor_id
  );

  if (!wishlist) {
    res.json({
      id: null,
      reference_id: req.params.reference_id,
      object: "wishlist",
      deleted: true,
    });
    return;
  }

  await deleteWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      id: wishlist.id,
      reference_id: req.params.reference_id,
    },
  });

  res.json({
    id: wishlist.id,
    reference_id: req.params.reference_id,
    object: "wishlist",
    deleted: true,
  });
};

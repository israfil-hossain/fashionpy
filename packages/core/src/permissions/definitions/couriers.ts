import { defineMercurPermissions } from "../registry"

export const couriersPermissions = defineMercurPermissions([
  { key: "courier_accounts", group: "courier", surface: ["admin", "vendor"], rights: ["view", "edit"] },
])

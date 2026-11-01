import { defineMercurPermissions } from "../registry"

export const notificationsPermissions = defineMercurPermissions([
  { key: "notifications", group: "notifications", surface: ["admin", "vendor"], rights: ["view", "edit"] },
])

import { defineMercurPermissions } from "../registry"

export const messagesPermissions = defineMercurPermissions([
  {
    key: "messages",
    group: "messages",
    surface: ["admin", "vendor"],
    rights: ["view", "edit", "manage"],
  },
])

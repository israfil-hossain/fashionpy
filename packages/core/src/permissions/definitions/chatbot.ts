import { defineMercurPermissions } from "../registry"

export const chatbotPermissions = defineMercurPermissions([
  {
    key: "chatbot",
    group: "chatbot",
    surface: ["admin"],
    rights: ["view", "edit", "manage"],
  },
])

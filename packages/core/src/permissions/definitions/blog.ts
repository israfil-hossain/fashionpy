import { defineMercurPermissions } from "../registry"

export const blogPermissions = defineMercurPermissions([
  { key: "blog", group: "blog", surface: ["admin"], rights: ["view", "edit", "manage"] },
])

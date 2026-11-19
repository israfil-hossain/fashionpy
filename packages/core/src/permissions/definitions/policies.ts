import { defineMercurPermissions } from "../registry"

export const policyPermissions = defineMercurPermissions([
  { key: "policy", group: "policy", surface: ["admin"], rights: ["view", "edit", "manage"] },
])

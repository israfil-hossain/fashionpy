export type StudioRailTab = {
  key: string;
  label: string;
  handle: string;
  matches: string[];
};

export type StudioRailCategoryNode = {
  id: string;
  handle: string;
  name: string;
  parent_category_id?: string | null;
  rank?: number | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
};

export const STUDIO_RAIL_CATEGORY_KEY = 'show_in_studio_rail';

export const STUDIO_RAIL_TABS: StudioRailTab[] = [
  {
    key: 'men',
    label: 'Men',
    handle: 'men',
    matches: ['men', 'mens', 'menswear']
  },
  {
    key: 'women',
    label: 'Women',
    handle: 'women',
    matches: ['women', 'womens', 'womenswear', 'woman']
  },
  {
    key: 'baby',
    label: 'Baby',
    handle: 'baby',
    matches: ['baby', 'babies', 'kids', 'kidswear']
  }
];

export const STUDIO_RAIL_MATCHERS = STUDIO_RAIL_TABS.flatMap(tab => tab.matches);

const normalizeTokens = (value?: string | null): string[] =>
  (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

const tokensOf = (category: { handle?: string | null; name?: string | null }) =>
  new Set([...normalizeTokens(category.handle), ...normalizeTokens(category.name)]);

export const matchesStudioRail = (
  category: { handle?: string | null; name?: string | null } | null | undefined,
  matchers: string[] = STUDIO_RAIL_MATCHERS
): boolean => {
  if (!category) return false;
  const tokens = tokensOf(category);
  return matchers.some(matcher => tokens.has(matcher));
};

const readFlag = (value: unknown): boolean => value === true || value === 'true';

const legacyTabFor = (category: StudioRailCategoryNode | null | undefined) =>
  category ? STUDIO_RAIL_TABS.find(tab => matchesStudioRail(category, tab.matches)) : undefined;

export const isStudioRailCategory = (
  category: StudioRailCategoryNode | null | undefined
): boolean => {
  if (!category) return false;
  return (
    readFlag(category.metadata?.[STUDIO_RAIL_CATEGORY_KEY]) ||
    Boolean(legacyTabFor(category))
  );
};

const railKeyFor = (category: StudioRailCategoryNode): string =>
  legacyTabFor(category)?.key ?? `category:${category.id}`;

export const getStudioRailKey = (
  category: (StudioRailCategoryNode & { id: string }) | null | undefined,
  allCategories: StudioRailCategoryNode[]
): string | null => {
  if (!category) return null;

  const byId = new Map(allCategories.map(item => [item.id, item]));
  const visited = new Set<string>();
  let current: StudioRailCategoryNode | undefined = category;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (isStudioRailCategory(current)) {
      return railKeyFor(current);
    }
    current = current.parent_category_id ? byId.get(current.parent_category_id) : undefined;
  }

  return null;
};

export const resolveStudioRailCategories = (
  categories: StudioRailCategoryNode[]
): { tab: StudioRailTab; category: StudioRailCategoryNode }[] => {
  const active = categories.filter(category => category.is_active !== false);
  const entries: { tab: StudioRailTab; category: StudioRailCategoryNode }[] = [];

  for (const tab of STUDIO_RAIL_TABS) {
    const candidates = active.filter(category => matchesStudioRail(category, tab.matches));
    if (!candidates.length) continue;

    const score = (category: StudioRailCategoryNode) => {
      if (category.handle === tab.handle) return -1;
      const index = tab.matches.findIndex(matcher => tokensOf(category).has(matcher));
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    const best = [...candidates].sort((a, b) => {
      const scoreDiff = score(a) - score(b);
      if (scoreDiff !== 0) return scoreDiff;
      const rootDiff =
        Number(Boolean(a.parent_category_id)) - Number(Boolean(b.parent_category_id));
      if (rootDiff !== 0) return rootDiff;
      return (a.rank ?? 0) - (b.rank ?? 0);
    })[0];

    entries.push({ tab, category: best });
  }

  const flagged = active
    .filter(
      category =>
        readFlag(category.metadata?.[STUDIO_RAIL_CATEGORY_KEY]) &&
        !legacyTabFor(category)
    )
    .sort(
      (a, b) =>
        (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)
    );

  for (const category of flagged) {
    entries.push({
      tab: {
        key: `category:${category.id}`,
        label: category.name,
        handle: category.handle,
        matches: []
      },
      category
    });
  }

  return entries;
};

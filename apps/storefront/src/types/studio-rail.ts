export type StudioRailVariant = {
  id: string;
  title?: string | null;
  options?:
    | Array<{
        value: string;
        option?: { title?: string | null } | null;
      }>
    | null;
};

export type StudioRailItem = {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  /** First image that differs from the hanging thumbnail — shown on hover. */
  frontImage?: string | null;
  /** Second distinct image — the quick view's Back tab. */
  backImage?: string | null;
  variants?: StudioRailVariant[];
  price?: string;
  originalPrice?: string;
};

export type StudioRailGroup = {
  key: string;
  label: string;
  items: StudioRailItem[];
};

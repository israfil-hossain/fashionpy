export type StudioRailItem = {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price?: string;
  originalPrice?: string;
};

export type StudioRailGroup = {
  key: string;
  label: string;
  items: StudioRailItem[];
};

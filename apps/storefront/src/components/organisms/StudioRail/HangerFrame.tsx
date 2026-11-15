const METAL = '#7d7d76';
const METAL_HIGHLIGHT = '#c9c9c1';
const WOOD = '#b08355';
const WOOD_DARK = '#8a6440';

export const HangerFrame = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 210 100"
    fill="none"
    preserveAspectRatio="xMidYMin meet"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="105"
      cy="11"
      r="9"
      stroke={METAL}
      strokeWidth="4.5"
      fill="none"
    />
    <path
      d="M99.5 4.5a9 9 0 0 1 11 0"
      stroke={METAL_HIGHLIGHT}
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M105 20V36"
      stroke={METAL}
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M105 36L45 78"
      stroke={WOOD_DARK}
      strokeWidth="9"
      strokeLinecap="round"
    />
    <path
      d="M105 36L165 78"
      stroke={WOOD_DARK}
      strokeWidth="9"
      strokeLinecap="round"
    />
    <path
      d="M105 36L45 78"
      stroke={WOOD}
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    <path
      d="M105 36L165 78"
      stroke={WOOD}
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    <circle
      cx="105"
      cy="36"
      r="6"
      fill={WOOD_DARK}
    />
    <circle
      cx="105"
      cy="34.5"
      r="4.5"
      fill={WOOD}
    />
  </svg>
);

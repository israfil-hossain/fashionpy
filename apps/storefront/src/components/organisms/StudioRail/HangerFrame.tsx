const METAL_DARK = '#3d3e42';
const METAL = '#55565b';
const METAL_HIGHLIGHT = '#a3a4a8';

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
      stroke={METAL_DARK}
      strokeWidth="3.2"
      fill="none"
    />
    <path
      d="M99.5 4.8a9 9 0 0 1 11 0"
      stroke={METAL_HIGHLIGHT}
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M105 20V36"
      stroke={METAL_DARK}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M30 76C52 70 78 46 105 38C132 46 158 70 180 76"
      stroke={METAL_DARK}
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M31 73.5C53 67.5 79 43.5 105 35.5C131 43.5 157 67.5 179 73.5"
      stroke={METAL_HIGHLIGHT}
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M56 61H154"
      stroke={METAL}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle
      cx="105"
      cy="37.5"
      r="4"
      fill={METAL_DARK}
    />
    <circle
      cx="105"
      cy="36.5"
      r="2.4"
      fill={METAL}
    />
  </svg>
);

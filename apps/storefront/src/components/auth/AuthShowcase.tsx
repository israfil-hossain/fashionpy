import type { CSSProperties } from 'react';

/**
 * Storefront copy of the light-mode clothes-rail auth showcase.
 * Kept local because storefront does not depend on dashboard-shared.
 */

export type AuthShowcaseProps = {
  headline: string;
  subline: string;
  className?: string;
};

const KEYFRAMES = `
@keyframes auth-showcase-swing{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}
@keyframes auth-showcase-drop{from{transform:translateY(-420px)}}
@keyframes auth-showcase-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes auth-showcase-tw{0%,100%{transform:scale(.4);opacity:.3}50%{transform:scale(1);opacity:1}}
.auth-showcase-orb{animation:auth-showcase-float 7s ease-in-out infinite}
.auth-showcase-sw{transform-box:view-box;transform-origin:0 0;animation:auth-showcase-swing 5s ease-in-out infinite;animation-delay:var(--s,0s)}
.auth-showcase-drop{animation:auth-showcase-drop 1s cubic-bezier(.2,.9,.3,1.15) backwards;animation-delay:var(--d,0s)}
.auth-showcase-tw{transform-box:fill-box;transform-origin:center;animation:auth-showcase-tw 3.2s ease-in-out infinite;animation-delay:var(--s,0s)}
@media (prefers-reduced-motion:reduce){
  .auth-showcase-orb,.auth-showcase-sw,.auth-showcase-drop,.auth-showcase-tw{animation:none}
}
`;

const sw = (delay: string): CSSProperties =>
  ({ ['--s' as string]: delay }) as CSSProperties;

const drop = (delay: string): CSSProperties =>
  ({ ['--d' as string]: delay }) as CSSProperties;

export const AuthShowcase = ({
  headline,
  subline,
  className = '',
}: AuthShowcaseProps) => {
  return (
    <div
      className={`relative flex h-full min-h-[480px] w-full flex-col overflow-hidden rounded-[28px] border border-[#d9d4e8] bg-[#FAF8FD] p-[clamp(24px,3vw,44px)] ${className}`}
      data-testid="auth-showcase"
    >
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg
          viewBox="0 0 700 560"
          aria-hidden="true"
          className="h-auto max-h-full w-full max-w-[640px] overflow-visible"
        >
          <circle
            className="auth-showcase-orb"
            cx="350"
            cy="380"
            r="205"
            fill="#F3EAFB"
          />
          <circle
            cx="350"
            cy="380"
            r="248"
            fill="none"
            stroke="#DA107D"
            strokeOpacity=".55"
            strokeWidth="2"
            strokeDasharray="3 12"
            strokeLinecap="round"
          />
          <g stroke="#191F38" strokeOpacity=".35" strokeLinecap="round">
            <path d="M30 0V110M670 0V110" strokeWidth="3" />
            <path d="M14 110H686" strokeWidth="5" />
          </g>
          {/* dress */}
          <g transform="translate(90 110)">
            <g className="auth-showcase-drop" style={drop('.1s')}>
              <g className="auth-showcase-sw" style={sw('-.5s')}>
                <path
                  d="M-22 54L-12 54L0 68L12 54L22 54L30 118L66 262Q0 286 -66 262L-30 118Z"
                  fill="#DA107D"
                />
                <path
                  d="M-30 118L30 118"
                  stroke="#191F38"
                  strokeOpacity=".35"
                  strokeWidth="3"
                />
                <path
                  d="M0 0V30M-46 62L0 30L46 62"
                  fill="none"
                  stroke="#191F38"
                  strokeOpacity=".7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </g>
          {/* tee */}
          <g transform="translate(225 110)">
            <g className="auth-showcase-drop" style={drop('.25s')}>
              <g className="auth-showcase-sw" style={sw('-1.8s')}>
                <path
                  d="M-34 58L-14 60Q0 76 14 60L34 58L68 94L50 114L36 104L36 208L-36 208L-36 104L-50 114L-68 94Z"
                  fill="#F3EAFB"
                />
                <path
                  d="M-14 60Q0 76 14 60"
                  fill="none"
                  stroke="#DA107D"
                  strokeWidth="3"
                />
                <path
                  d="M0 0V30M-46 62L0 30L46 62"
                  fill="none"
                  stroke="#191F38"
                  strokeOpacity=".7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </g>
          {/* coat */}
          <g transform="translate(365 110)">
            <g className="auth-showcase-drop" style={drop('.4s')}>
              <g className="auth-showcase-sw" style={sw('-3s')}>
                <path
                  d="M-36 56L-12 60L0 92L12 60L36 56L70 98L62 242L44 248L44 332L-44 332L-44 248L-62 242L-70 98Z"
                  fill="#013186"
                  stroke="#191F38"
                  strokeOpacity=".25"
                  strokeWidth="2"
                />
                <path
                  d="M-12 60L-24 124L0 154L24 124L12 60M0 154V332"
                  fill="none"
                  stroke="#F3EAFB"
                  strokeOpacity=".7"
                  strokeWidth="2"
                />
                <circle cx="9" cy="190" r="3.5" fill="#DA107D" />
                <circle cx="9" cy="230" r="3.5" fill="#DA107D" />
                <circle cx="9" cy="270" r="3.5" fill="#DA107D" />
                <path
                  d="M0 0V30M-46 62L0 30L46 62"
                  fill="none"
                  stroke="#191F38"
                  strokeOpacity=".7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </g>
          {/* tote */}
          <g transform="translate(495 110)">
            <g className="auth-showcase-drop" style={drop('.55s')}>
              <g className="auth-showcase-sw" style={sw('-4.2s')}>
                <path
                  d="M0 0V38"
                  stroke="#191F38"
                  strokeOpacity=".7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M-28 92C-28 40 28 40 28 92"
                  fill="none"
                  stroke="#DA107D"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <rect
                  x="-54"
                  y="90"
                  width="108"
                  height="108"
                  rx="12"
                  fill="#FFC2E0"
                />
                <path
                  d="M-54 126H54"
                  stroke="#590695"
                  strokeOpacity=".35"
                  strokeWidth="3"
                />
              </g>
            </g>
          </g>
          {/* trousers */}
          <g transform="translate(615 110)">
            <g className="auth-showcase-drop" style={drop('.7s')}>
              <g className="auth-showcase-sw" style={sw('-2.4s')}>
                <path
                  d="M-36 58L36 58L44 304L10 304L0 134L-10 304L-44 304Z"
                  fill="#7B3FD0"
                />
                <path
                  d="M-36 76H36"
                  stroke="#F3EAFB"
                  strokeOpacity=".7"
                  strokeWidth="3"
                />
                <path
                  d="M0 0V30M-40 62L0 30L40 62"
                  fill="none"
                  stroke="#191F38"
                  strokeOpacity=".7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </g>
          {/* sparkles */}
          <g>
            <path
              className="auth-showcase-tw"
              style={sw('0s')}
              transform="translate(70 450)"
              d="M0-14C2-4 4-2 14 0C4 2 2 4 0 14C-2 4-4 2-14 0C-4-2-2-4 0-14Z"
              fill="#DA107D"
            />
            <path
              className="auth-showcase-tw"
              style={sw('-1s')}
              transform="translate(640 420)"
              d="M0-10C2-3 3-2 10 0C3 2 2 3 0 10C-2 3-3 2-10 0C-3-2-2-3 0-10Z"
              fill="#FF6FB4"
            />
            <path
              className="auth-showcase-tw"
              style={sw('-2s')}
              transform="translate(200 535)"
              d="M0-9C2-3 3-2 9 0C3 2 2 3 0 9C-2 3-3 2-9 0C-3-2-2-3 0-9Z"
              fill="#590695"
            />
            <path
              className="auth-showcase-tw"
              style={sw('-0.6s')}
              transform="translate(560 530)"
              d="M0-12C2-4 3-3 12 0C3 3 2 4 0 12C-2 4-3 3-12 0C-3-3-2-4 0-12Z"
              fill="#FF6FB4"
            />
          </g>
        </svg>
      </div>
      <div className="mt-8 shrink-0">
        <h2
          className="mb-2.5 max-w-[15ch] text-[clamp(1.7rem,2.5vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.01em] text-[#191F38]"
          style={{ fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}
          data-testid="auth-showcase-headline"
        >
          {headline}
        </h2>
        <p
          className="m-0 max-w-[42ch] text-[#5d6280]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          data-testid="auth-showcase-subline"
        >
          {subline}
        </p>
      </div>
    </div>
  );
};

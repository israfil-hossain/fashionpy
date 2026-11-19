/**
 * Pink fox assistant mascot — animated cycle from the operator SVG:
 * 1) thinking (dots)  2) "How can I help you?"
 * 3) "আমি কিভাবে তোমাকে সাহায্য করতে পারি?"
 * 4) "কী কেনাকাটা করতে চাও আমাকে বলো"
 *
 * Loop ≈ 18s. `showBubbles=false` renders a static face crop (chat avatars).
 */
export function FoxAssistantIcon({
  size = 64,
  className = "",
  showBubbles = true,
  title = "Shopping assistant",
  animate = true,
}: {
  size?: number
  className?: string
  /** Full scene with think/speech bubbles (launcher). */
  showBubbles?: boolean
  title?: string
  animate?: boolean
}) {
  // Full scene includes speech bubble above the head — viewBox must start
  // above the bubble (y=-280) or the top line gets clipped.
  const fluid = /\bw-\[/.test(className) || /\bw-/.test(className)
  const viewBox = showBubbles ? "0 -280 464 740" : "30 130 404 320"
  const height = showBubbles ? Math.round(size * (740 / 464)) : Math.round(size * (320 / 404))
  const animateClass = animate && showBubbles ? "fx-anim" : ""

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      {...(fluid ? {} : { width: size, height })}
      role="img"
      aria-label={title}
      className={`${className} ${animateClass}`.trim()}
      data-testid="fox-assistant-icon"
    >
      <defs>
        <linearGradient id="fxEarFur" gradientUnits="userSpaceOnUse" x1="50" y1="40" x2="180" y2="230">
          <stop offset="0" stopColor="#e2578c" />
          <stop offset=".45" stopColor="#d84077" />
          <stop offset="1" stopColor="#d23a72" />
        </linearGradient>
        <linearGradient id="fxLining" gradientUnits="userSpaceOnUse" x1="82" y1="100" x2="142" y2="200">
          <stop offset="0" stopColor="#e9e2e2" />
          <stop offset=".5" stopColor="#cdc0c2" />
          <stop offset="1" stopColor="#d9d9d6" />
        </linearGradient>
        <linearGradient id="fxEarRim" gradientUnits="userSpaceOnUse" x1="90" y1="95" x2="150" y2="230">
          <stop offset="0" stopColor="#c52d68" />
          <stop offset="1" stopColor="#e0558a" />
        </linearGradient>
        <radialGradient id="fxFace" gradientUnits="userSpaceOnUse" cx="232" cy="215" r="210">
          <stop offset="0" stopColor="#e8679a" />
          <stop offset=".55" stopColor="#df5088" />
          <stop offset="1" stopColor="#d4407a" />
        </radialGradient>
        <radialGradient id="fxBridge" gradientUnits="userSpaceOnUse" cx="232" cy="184" r="48">
          <stop offset="0" stopColor="#f08fb5" />
          <stop offset="1" stopColor="#f08fb5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fxForeheadHi" gradientUnits="userSpaceOnUse" cx="232" cy="205" r="95">
          <stop offset="0" stopColor="#ee7fab" stopOpacity=".7" />
          <stop offset="1" stopColor="#ee7fab" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fxMuz" gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="426">
          <stop offset="0" stopColor="#d3d3d2" />
          <stop offset=".35" stopColor="#bdbdbc" />
          <stop offset="1" stopColor="#9c9d9c" />
        </linearGradient>
        <radialGradient id="fxEyeW" gradientUnits="objectBoundingBox" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6eae8" />
        </radialGradient>
        <radialGradient id="fxPupilR" gradientUnits="objectBoundingBox" cx=".4" cy=".35" r=".85">
          <stop offset="0" stopColor="#2d302f" />
          <stop offset=".55" stopColor="#101110" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <radialGradient id="fxNoseR" gradientUnits="userSpaceOnUse" cx="222" cy="311" r="38">
          <stop offset="0" stopColor="#6f7a76" />
          <stop offset=".4" stopColor="#2f3533" />
          <stop offset="1" stopColor="#111010" />
        </radialGradient>
        <linearGradient id="fxFadeG" gradientUnits="userSpaceOnUse" x1="0" y1="222" x2="0" y2="262">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="fxEarFade" maskUnits="userSpaceOnUse" x="0" y="0" width="232" height="300">
          <rect x="0" y="0" width="232" height="300" fill="url(#fxFadeG)" />
        </mask>
        <clipPath id="fxClipMsg">
          <rect x="24" y="-246" width="416" height="196" rx="16" />
        </clipPath>

        <g id="fxHeadHalf">
          <path
            d="M233,158 C214,158 196,157 184,152 L176,168 L150,205 L100,205 C84,206 74,208 68,213 C76,232 92,250 112,262 C96,278 64,294 38,312 C22,322 8,326 10,337 C13,347 26,353 40,360 C44,372 62,384 80,392 C104,404 140,414 175,420 C200,424 216,425 233,425 Z"
            fill="url(#fxFace)"
          />
          <ellipse cx="232" cy="228" rx="90" ry="58" fill="url(#fxForeheadHi)" />
        </g>
        <g id="fxMuzzleHalf">
          <path
            d="M233,326 C216,324 196,321 184,331 C176,340 172,350 150,353 C132,355 118,347 112,338 C102,329 74,327 56,335 C48,339 42,349 40,359 C44,372 62,384 80,392 C104,404 140,414 175,420 C200,424 216,425 233,425 Z"
            fill="url(#fxMuz)"
          />
          <path
            d="M233,326 C216,324 196,321 184,331 C176,340 172,350 150,353 C132,355 118,347 112,338 C102,329 74,327 56,335 C48,339 42,349 40,359"
            fill="none"
            stroke="#e3ece7"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".85"
          />
        </g>
        <g id="fxEarHalf" mask="url(#fxEarFade)">
          <path
            d="M64,38 C72,37 90,52 114,76 C142,100 166,124 186,152 L178,170 L152,207 L132,238 L110,264 C94,250 80,235 68,213 C56,190 47,160 45,128 C43,96 47,66 54,52 C57,44 60,39 64,38 Z"
            fill="url(#fxEarFur)"
          />
          <path
            d="M90,92 C112,104 138,128 150,146 C156,154 154,162 146,166 C136,174 136,196 144,226 C128,224 108,206 98,182 C90,164 76,152 76,124 C76,106 80,96 90,92 Z"
            fill="url(#fxEarRim)"
            opacity=".85"
          />
          <path
            d="M92,102 C106,110 126,130 140,149 C145,155 144,159 138,162 C128,170 126,190 134,218 C122,214 106,196 98,172 C92,156 82,150 82,126 C82,114 85,106 92,102 Z"
            fill="url(#fxLining)"
          />
        </g>
        <g id="fxCloudShape">
          <circle cx="150" cy="-100" r="36" />
          <circle cx="190" cy="-135" r="42" />
          <circle cx="250" cy="-145" r="46" />
          <circle cx="305" cy="-120" r="42" />
          <circle cx="330" cy="-82" r="34" />
          <circle cx="285" cy="-65" r="42" />
          <circle cx="225" cy="-62" r="44" />
          <circle cx="170" cy="-68" r="34" />
          <circle cx="240" cy="-100" r="62" />
          <circle cx="195" cy="-100" r="48" />
        </g>
        <g id="fxSpeechShape">
          <rect x="16" y="-254" width="432" height="208" rx="48" />
          <path d="M205,-64 C214,10 226,60 232,92 C240,60 252,10 264,-64 Z" />
        </g>
        <path id="fxHrt" d="M0,16 C-26,-2 -14,-22 0,-9 C14,-22 26,-2 0,16Z" />
      </defs>

      <style>{`
        .fx-anim .fx-fox{animation:fxTilt 18s ease-in-out infinite;transform-origin:232px 300px}
        .fx-anim .fx-ear-l{animation:fxTwL 4.2s ease-in-out infinite;transform-origin:112px 228px}
        .fx-anim .fx-ear-r{animation:fxTwR 5.1s ease-in-out infinite;transform-origin:352px 228px}
        .fx-anim .fx-blink{animation:fxBlink 4s infinite}
        .fx-anim .fx-blink-l{transform-origin:160px 292px}
        .fx-anim .fx-blink-r{transform-origin:304px 292px}
        .fx-anim .fx-gaze{animation:fxGaze 18s ease-in-out infinite}
        .fx-anim .fx-blush{animation:fxBlush 2.2s ease-in-out infinite;opacity:.55}
        .fx-anim .fx-fh{animation:fxRise 3.6s ease-out infinite;opacity:0}
        .fx-anim .fx-fh2{animation-delay:.9s}
        .fx-anim .fx-fh3{animation-delay:1.8s}
        .fx-anim .fx-fh4{animation-delay:2.6s}
        .fx-anim .fx-think{animation:fxThink 18s ease-in-out infinite;transform-origin:232px 90px;opacity:0}
        .fx-anim .fx-dot{animation:fxDot 1.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .fx-anim .fx-dot2{animation-delay:.2s}
        .fx-anim .fx-dot3{animation-delay:.4s}
        .fx-anim .fx-speak{animation:fxSpeak 18s ease-in-out infinite;transform-origin:232px 92px;opacity:0}
        .fx-anim .fx-msg{opacity:0}
        .fx-anim .fx-mA{animation:fxShowA 18s linear infinite}
        .fx-anim .fx-mB{animation:fxShowB 18s linear infinite}
        .fx-anim .fx-mC{animation:fxShowC 18s linear infinite}
        .fx-anim .fx-smile{animation:fxSmile 18s linear infinite}
        @keyframes fxTilt{0%,100%{transform:rotate(0)}5%,30%{transform:rotate(-4deg)}38%,94%{transform:rotate(1.5deg)}}
        @keyframes fxGaze{0%,100%{transform:translate(0,0)}5%,29%{transform:translate(6px,-8px)}36%{transform:translate(0,0)}60%{transform:translate(-3px,1px)}82%{transform:translate(3px,0)}}
        @keyframes fxTwL{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-6deg)}90%{transform:rotate(2deg)}95%{transform:rotate(-3deg)}}
        @keyframes fxTwR{0%,55%,100%{transform:rotate(0)}60%{transform:rotate(6deg)}65%{transform:rotate(-2deg)}70%{transform:rotate(3deg)}}
        @keyframes fxBlink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
        @keyframes fxBlush{0%,100%{opacity:.4}50%{opacity:.75}}
        @keyframes fxRise{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:.95}100%{transform:translateY(-80px) scale(1.1);opacity:0}}
        @keyframes fxThink{0%{opacity:0;transform:scale(.7)}4%{opacity:1;transform:scale(1.04)}6%{transform:scale(1)}32%{opacity:1;transform:scale(1)}36%,100%{opacity:0;transform:scale(.85)}}
        @keyframes fxDot{0%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-9px);opacity:1}}
        @keyframes fxSpeak{0%,35%{opacity:0;transform:scale(.6)}39%{opacity:1;transform:scale(1.05)}41%{transform:scale(1)}93%{opacity:1;transform:scale(1)}97%,100%{opacity:0;transform:scale(.9)}}
        @keyframes fxShowA{0%,40%{opacity:0}41%,54%{opacity:1}55%,100%{opacity:0}}
        @keyframes fxShowB{0%,55%{opacity:0}56%,74%{opacity:1}75%,100%{opacity:0}}
        @keyframes fxShowC{0%,75%{opacity:0}76%,93%{opacity:1}95%,100%{opacity:0}}
        @keyframes fxSmile{0%,40%{opacity:1}41%,94%{opacity:0}96%,100%{opacity:1}}
        @media (prefers-reduced-motion:reduce){
          .fx-anim *{animation:none!important}
          .fx-anim .fx-think{opacity:0}
          .fx-anim .fx-speak{opacity:1}
          .fx-anim .fx-mA,.fx-anim .fx-mC{opacity:0}
          .fx-anim .fx-mB{opacity:1}
        }
      `}</style>

      {/* HEAD */}
      <g className="fx-fox">
        <use href="#fxHeadHalf" />
        <g transform="translate(464,0) scale(-1,1)">
          <use href="#fxHeadHalf" />
        </g>
        <ellipse cx="232" cy="192" rx="44" ry="22" fill="url(#fxBridge)" />

        {/* MUZZLE */}
        <use href="#fxMuzzleHalf" />
        <g transform="translate(464,0) scale(-1,1)">
          <use href="#fxMuzzleHalf" />
        </g>
        <ellipse className="fx-blush" cx="92" cy="318" rx="30" ry="16" fill="#ff4d8d" />
        <ellipse className="fx-blush" cx="372" cy="318" rx="30" ry="16" fill="#ff4d8d" />

        {/* EARS */}
        <g className="fx-ear-l">
          <use href="#fxEarHalf" />
        </g>
        <g className="fx-ear-r">
          <g transform="translate(464,0) scale(-1,1)">
            <use href="#fxEarHalf" />
          </g>
        </g>

        {/* EYES */}
        <g className="fx-blink fx-blink-l">
          <circle cx="160" cy="292" r="38" fill="url(#fxEyeW)" />
          <circle cx="160" cy="292" r="38" fill="none" stroke="#d3d8d6" strokeWidth="1.5" />
          <g className="fx-gaze">
            <circle cx="163" cy="294" r="26" fill="url(#fxPupilR)" />
            <circle cx="154" cy="283" r="8.5" fill="#fff" />
            <circle cx="171" cy="304" r="4" fill="#fff" opacity=".85" />
          </g>
        </g>
        <g className="fx-blink fx-blink-r">
          <circle cx="304" cy="292" r="38" fill="url(#fxEyeW)" />
          <circle cx="304" cy="292" r="38" fill="none" stroke="#d3d8d6" strokeWidth="1.5" />
          <g className="fx-gaze">
            <circle cx="307" cy="294" r="26" fill="url(#fxPupilR)" />
            <circle cx="298" cy="283" r="8.5" fill="#fff" />
            <circle cx="315" cy="304" r="4" fill="#fff" opacity=".85" />
          </g>
        </g>

        {/* NOSE */}
        <ellipse cx="232" cy="322" rx="27" ry="21" fill="url(#fxNoseR)" />
        <ellipse cx="221" cy="313" rx="10" ry="5.5" fill="#fff" opacity=".42" transform="rotate(-18 221 313)" />

        {/* MOUTH */}
        <g className="fx-smile">
          <path
            d="M232,343 L232,362 M204,358 C212,376 226,378 232,364 C238,378 252,376 260,358"
            fill="none"
            stroke="#5b3a47"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* floating hearts */}
      <g fill="#ff4d8d">
        <g transform="translate(38,230)">
          <g className="fx-fh">
            <use href="#fxHrt" transform="scale(.8)" />
          </g>
        </g>
        <g transform="translate(430,200)">
          <g className="fx-fh fx-fh2">
            <use href="#fxHrt" transform="scale(.6)" fill="#ff7aa8" />
          </g>
        </g>
        <g transform="translate(58,330)">
          <g className="fx-fh fx-fh3">
            <use href="#fxHrt" transform="scale(.55)" fill="#ff7aa8" />
          </g>
        </g>
        <g transform="translate(414,320)">
          <g className="fx-fh fx-fh4">
            <use href="#fxHrt" transform="scale(.8)" />
          </g>
        </g>
      </g>

      {showBubbles && (
        <>
          {/* THINKING bubble — first phase */}
          <g className="fx-think">
            <use href="#fxCloudShape" fill="#f0a6c6" stroke="#f0a6c6" strokeWidth="9" strokeLinejoin="round" />
            <circle cx="236" cy="10" r="15" fill="#f0a6c6" />
            <circle cx="228" cy="46" r="11" fill="#f0a6c6" />
            <circle cx="224" cy="76" r="8" fill="#f0a6c6" />
            <use href="#fxCloudShape" fill="#fff" />
            <circle cx="236" cy="10" r="12" fill="#fff" />
            <circle cx="228" cy="46" r="8.5" fill="#fff" />
            <circle cx="224" cy="76" r="5.5" fill="#fff" />
            <circle className="fx-dot" cx="190" cy="-100" r="10" fill="#d84077" />
            <circle className="fx-dot fx-dot2" cx="232" cy="-100" r="10" fill="#d84077" />
            <circle className="fx-dot fx-dot3" cx="274" cy="-100" r="10" fill="#d84077" />
          </g>

          {/* SPEECH bubble — cycles 3 messages */}
          <g className="fx-speak">
            <use href="#fxSpeechShape" fill="#f0a6c6" stroke="#f0a6c6" strokeWidth="9" strokeLinejoin="round" />
            <use href="#fxSpeechShape" fill="#fff" />

            {/* 1) English */}
            <g className="fx-msg fx-mA" clipPath="url(#fxClipMsg)">
              <text
                x="232"
                y="-140"
                textAnchor="middle"
                fill="#c42b6e"
                fontSize="44"
                fontWeight="700"
                fontFamily="system-ui, 'Segoe UI', sans-serif"
              >
                How can I help you?
              </text>
            </g>

            {/* 2) Bangla help */}
            <g className="fx-msg fx-mB" clipPath="url(#fxClipMsg)">
              <text
                x="232"
                y="-195"
                textAnchor="middle"
                fill="#c42b6e"
                fontSize="38"
                fontWeight="700"
                fontFamily="'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif"
              >
                আমি কিভাবে তোমাকে
              </text>
              <text
                x="232"
                y="-140"
                textAnchor="middle"
                fill="#c42b6e"
                fontSize="38"
                fontWeight="700"
                fontFamily="'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif"
              >
                সাহায্য করতে পারি?
              </text>
            </g>

            {/* 3) Bangla shopping */}
            <g className="fx-msg fx-mC" clipPath="url(#fxClipMsg)">
              <text
                x="232"
                y="-195"
                textAnchor="middle"
                fill="#c42b6e"
                fontSize="36"
                fontWeight="700"
                fontFamily="'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif"
              >
                কী কেনাকাটা করতে চাও?
              </text>
              <text
                x="232"
                y="-140"
                textAnchor="middle"
                fill="#c42b6e"
                fontSize="38"
                fontWeight="700"
                fontFamily="'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif"
              >
                আমাকে বলো।
              </text>
            </g>
          </g>
        </>
      )}
    </svg>
  )
}

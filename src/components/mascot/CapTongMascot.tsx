import React from 'react';
import { MascotExpression } from '../../types';

interface CapTongMascotProps {
  expression?: MascotExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const CapTongMascot: React.FC<CapTongMascotProps> = ({
  expression = 'idle',
  size = 'md',
  className = '',
  onClick,
  interactive = false,
}) => {
  const sizeMap = {
    sm: { width: 44, height: 44 },
    md: { width: 80, height: 80 },
    lg: { width: 140, height: 140 },
    xl: { width: 200, height: 200 },
  };

  const { width, height } = sizeMap[size];

  // Colors
  const darkGreen = '#173B2B';
  const midGreen = '#268A59';
  const highlightGreen = '#3EAA73';
  const goldStinger = '#D9AA54';
  const darkShade = '#102A1F';
  const eyeWhite = '#FFFFFF';
  const pupilColor = '#0F1E17';
  const blushPink = '#FCA5A5';

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`inline-flex items-center justify-center select-none transition-transform duration-200 ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      title="Cạp Tổng - Học không vào thì cạp"
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-sm"
      >
        {/* Soft shadow under mascot */}
        <ellipse cx="80" cy="146" rx="42" ry="7" fill="#E6EBE6" opacity="0.8" />

        {/* ================= SCORPION TAIL ================= */}
        {expression === 'happy' ? (
          // Happy / Celebrating: Tail curls high and proud with joyous arch
          <g className="transition-all duration-300">
            <path
              d="M74 122 C70 110, 48 100, 48 76 C48 54, 68 40, 88 40 C104 40, 116 52, 110 66"
              stroke={darkGreen}
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M74 122 C70 110, 48 100, 48 76 C48 54, 68 40, 88 40 C104 40, 116 52, 110 66"
              stroke={midGreen}
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Stinger segment */}
            <circle cx="108" cy="65" r="7" fill={darkGreen} />
            {/* Golden Stinger */}
            <path
              d="M109 61 C115 56, 126 58, 126 50 C126 44, 112 50, 105 57 Z"
              fill={goldStinger}
              stroke={darkGreen}
              strokeWidth="1.5"
            />
          </g>
        ) : expression === 'confused' ? (
          // Confused / Disappointed: Tail curled awkwardly scratching near head
          <g className="transition-all duration-300">
            <path
              d="M76 122 C72 108, 44 98, 44 76 C44 56, 60 48, 76 52 C88 56, 92 68, 86 78"
              stroke={darkGreen}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M76 122 C72 108, 44 98, 44 76 C44 56, 60 48, 76 52 C88 56, 92 68, 86 78"
              stroke={midGreen}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="85" cy="78" r="6.5" fill={darkGreen} />
            <path
              d="M87 81 C92 84, 98 84, 98 90 C95 91, 88 87, 83 83 Z"
              fill={goldStinger}
              stroke={darkGreen}
              strokeWidth="1.5"
            />
          </g>
        ) : (
          // Idle / Smug: Classic menacingly cute poised stinger arched overhead
          <g className="transition-all duration-300">
            <path
              d="M74 122 C70 108, 46 96, 46 72 C46 50, 66 36, 88 36 C102 36, 114 46, 110 60"
              stroke={darkGreen}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M74 122 C70 108, 46 96, 46 72 C46 50, 66 36, 88 36 C102 36, 114 46, 110 60"
              stroke={midGreen}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="109" cy="59" r="6.5" fill={darkGreen} />
            {/* Poisonous golden barb */}
            <path
              d="M110 55 C116 50, 125 51, 125 43 C122 39, 112 45, 106 52 Z"
              fill={goldStinger}
              stroke={darkGreen}
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* ================= LEGS (WALKING PEDIPALPS) ================= */}
        <g stroke={darkShade} strokeWidth="3.5" strokeLinecap="round">
          {/* Left legs */}
          <path d="M56 116 Q42 122 38 134" />
          <path d="M58 124 Q44 132 42 142" />
          {/* Right legs */}
          <path d="M104 116 Q118 122 122 134" />
          <path d="M102 124 Q116 132 118 142" />
        </g>

        {/* ================= MAIN BODY (CARAPACE) ================= */}
        {/* Rear segments */}
        <ellipse cx="80" cy="124" rx="20" ry="12" fill={darkShade} />
        <ellipse cx="80" cy="116" rx="24" ry="14" fill={darkGreen} />
        {/* Main round torso */}
        <rect x="52" y="78" width="56" height="46" rx="22" fill={darkGreen} />
        <rect x="56" y="82" width="48" height="38" rx="18" fill={midGreen} />
        {/* Belly plate lines */}
        <path d="M64 96 Q80 100 96 96" stroke={highlightGreen} strokeWidth="2" strokeLinecap="round" />
        <path d="M66 106 Q80 110 94 106" stroke={highlightGreen} strokeWidth="2" strokeLinecap="round" />

        {/* ================= CLAWS (CÀNG CẠP) ================= */}
        {expression === 'happy' ? (
          // Celebrating: Both claws raised high in "V" victory!
          <g>
            {/* Left arm & claw */}
            <path d="M60 88 C46 80, 36 68, 30 52" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            {/* Left pincer */}
            <path
              d="M32 50 C26 40, 18 42, 20 32 C26 30, 34 38, 38 46 Z"
              fill={midGreen}
              stroke={darkGreen}
              strokeWidth="2"
            />
            <path
              d="M30 52 C20 54, 18 64, 12 58 C12 50, 20 46, 28 48 Z"
              fill={darkGreen}
              stroke={darkGreen}
              strokeWidth="1.5"
            />

            {/* Right arm & claw */}
            <path d="M100 88 C114 80, 124 68, 130 52" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            {/* Right pincer */}
            <path
              d="M128 50 C134 40, 142 42, 140 32 C134 30, 126 38, 122 46 Z"
              fill={midGreen}
              stroke={darkGreen}
              strokeWidth="2"
            />
            <path
              d="M130 52 C140 54, 142 64, 148 58 C148 50, 140 46, 132 48 Z"
              fill={darkGreen}
              stroke={darkGreen}
              strokeWidth="1.5"
            />
          </g>
        ) : expression === 'confused' ? (
          // Confused: One claw dropped, other one dangling quizzically
          <g>
            {/* Left arm drooping */}
            <path d="M60 92 C46 96, 36 106, 28 116" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="27" cy="118" r="8" fill={midGreen} stroke={darkGreen} strokeWidth="2" />
            <path d="M22 114 C16 118, 18 128, 25 124 Z" fill={darkGreen} />

            {/* Right arm raised wondering */}
            <path d="M100 90 C114 86, 124 82, 130 74" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="132" cy="72" r="8.5" fill={midGreen} stroke={darkGreen} strokeWidth="2" />
            <path d="M136 66 C144 68, 142 76, 136 78 Z" fill={darkGreen} />
          </g>
        ) : (
          // Idle / Smug: Signature predatory snap posture ("chuẩn bị cạp")
          <g>
            {/* Left arm */}
            <path d="M60 90 C44 86, 32 78, 28 66" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            {/* Left claw snap jaws */}
            <path
              d="M28 64 C20 54, 12 56, 14 46 C22 46, 28 54, 32 60 Z"
              fill={midGreen}
              stroke={darkGreen}
              strokeWidth="2"
            />
            <path
              d="M26 67 C16 70, 14 80, 8 74 C10 66, 18 64, 25 64 Z"
              fill={darkGreen}
              stroke={darkGreen}
              strokeWidth="1.5"
            />

            {/* Right arm raised proudly ready to pinch */}
            <path d="M100 90 C114 86, 126 78, 132 66" stroke={darkGreen} strokeWidth="7" strokeLinecap="round" fill="none" />
            {/* Right claw */}
            <path
              d="M132 64 C140 54, 148 56, 146 46 C138 46, 132 54, 128 60 Z"
              fill={midGreen}
              stroke={darkGreen}
              strokeWidth="2"
            />
            <path
              d="M134 67 C144 70, 146 80, 152 74 C150 66, 142 64, 135 64 Z"
              fill={darkGreen}
              stroke={darkGreen}
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* ================= EYES & FACIAL EXPRESSIONS ================= */}
        {expression === 'happy' ? (
          // Happy: Joyful crescent eye arches with rosy blush
          <g>
            {/* Rosy cheeks */}
            <circle cx="66" cy="98" r="4.5" fill={blushPink} opacity="0.6" />
            <circle cx="94" cy="98" r="4.5" fill={blushPink} opacity="0.6" />

            {/* Left eye happy arch */}
            <path d="M68 91 C68 85, 76 85, 76 91" stroke={pupilColor} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Right eye happy arch */}
            <path d="M84 91 C84 85, 92 85, 92 91" stroke={pupilColor} strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Joyful open mouth */}
            <path d="M75 99 Q80 105 85 99 Z" fill="#991B1B" stroke={darkGreen} strokeWidth="1.5" />
          </g>
        ) : expression === 'confused' ? (
          // Confused: Mismatched sideways squint, furrowed brow, squiggly mouth
          <g>
            {/* Angry / baffled eyebrows */}
            <path d="M67 80 L77 84" stroke={darkShade} strokeWidth="3" strokeLinecap="round" />
            <path d="M93 81 L83 85" stroke={darkShade} strokeWidth="3" strokeLinecap="round" />

            {/* Left wide eye */}
            <ellipse cx="72" cy="88" rx="6" ry="7" fill={eyeWhite} stroke={darkGreen} strokeWidth="1.5" />
            <circle cx="72" cy="88" r="3" fill={pupilColor} />

            {/* Right narrowed skeptical eye */}
            <ellipse cx="88" cy="89" rx="5" ry="4" fill={eyeWhite} stroke={darkGreen} strokeWidth="1.5" />
            <circle cx="89" cy="89" r="2.5" fill={pupilColor} />

            {/* Squiggly mouth of disbelief */}
            <path d="M74 100 Q77 97 80 100 Q83 103 86 100" stroke={darkShade} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          // Idle / Smug (DEFAULT): Raised sarcastic eyebrow, smirk
          <g>
            {/* Left eyebrow raised high in mockery */}
            <path d="M67 79 Q72 75 77 78" stroke={darkShade} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Right eyebrow skeptical downward slant */}
            <path d="M85 82 Q89 84 94 83" stroke={darkShade} strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Left Eye */}
            <circle cx="72" cy="88" r="6" fill={eyeWhite} stroke={darkGreen} strokeWidth="1.5" />
            <circle cx="73.5" cy="87.5" r="3.2" fill={pupilColor} />
            <circle cx="75" cy="86" r="1.2" fill={eyeWhite} />

            {/* Right Eye (slightly squinted / smug) */}
            <circle cx="88" cy="88" r="6" fill={eyeWhite} stroke={darkGreen} strokeWidth="1.5" />
            <circle cx="87.5" cy="87.5" r="3.2" fill={pupilColor} />
            <circle cx="86.5" cy="86" r="1.2" fill={eyeWhite} />

            {/* Smug, asymmetrical smirk */}
            <path d="M74 99 Q79 100 86 96" stroke={darkShade} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};

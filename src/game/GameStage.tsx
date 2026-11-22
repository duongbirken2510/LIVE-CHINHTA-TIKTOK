import type { CaiDat } from '../live/types';
import type { GameSnapshot, RoundCode } from './chinhta';
import type { WeeklyTopEntry } from './useGame';

interface StageTheme {
  id: RoundCode | 'round_board' | 'podium';
  stageBg: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  ambientGlow: string;
  sceneLabel: string;
}

function getStageTheme(roundCode: RoundCode, phase: GameSnapshot['phase']): StageTheme {
  if (phase === 'podium') {
    return {
      id: 'podium',
      stageBg: 'radial-gradient(circle at 50% 22%, #7f1d1d 0%, #3b080c 52%, #140305 100%)',
      cardBg: 'linear-gradient(180deg, rgba(105,16,16,0.78) 0%, rgba(28,8,12,0.84) 100%)',
      cardBorder: 'border-amber-300',
      badgeBg: 'bg-amber-950/90 border-amber-300/60',
      ambientGlow: 'radial-gradient(circle, rgba(251,191,36,0.32) 0%, rgba(220,38,38,0.14) 55%, transparent 78%)',
      sceneLabel: '👑 Điện Thái Hòa · Lễ Vinh Quy Bái Tổ',
    };
  }
  if (phase === 'round_board') {
    return {
      id: 'round_board',
      stageBg: 'radial-gradient(circle at 50% 24%, #1e3a8a 0%, #0f172a 54%, #050811 100%)',
      cardBg: 'linear-gradient(180deg, rgba(23,37,84,0.78) 0%, rgba(10,18,38,0.85) 100%)',
      cardBorder: 'border-amber-300/80',
      badgeBg: 'bg-indigo-950/90 border-amber-400/50',
      ambientGlow: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, rgba(251,191,36,0.1) 55%, transparent 78%)',
      sceneLabel: '👑 Điện Thái Hòa · Bảng Vàng Chuyển Chặng',
    };
  }
  switch (roundCode) {
    case 'dau-van':
      return {
        id: 'dau-van',
        stageBg: 'radial-gradient(circle at 50% 20%, #1d3b66 0%, #0f2042 48%, #060c1a 100%)',
        cardBg: 'linear-gradient(180deg, rgba(18,38,74,0.72) 0%, rgba(9,20,42,0.80) 100%)',
        cardBorder: 'border-amber-300/85',
        badgeBg: 'bg-sky-950/90 border-amber-300/60',
        ambientGlow: 'radial-gradient(circle, rgba(253,224,71,0.28) 0%, rgba(56,189,248,0.12) 55%, transparent 78%)',
        sceneLabel: '🌕 Đêm Rằm Chị Hằng, Thỏ Ngọc, Cây Đa & Hồ Sen',
      };
    case 'bat-loi-cau':
      return {
        id: 'bat-loi-cau',
        stageBg: 'radial-gradient(circle at 50% 22%, #631c20 0%, #2d0c10 52%, #110406 100%)',
        cardBg: 'linear-gradient(180deg, rgba(72,18,22,0.74) 0%, rgba(30,8,12,0.82) 100%)',
        cardBorder: 'border-amber-300/85',
        badgeBg: 'bg-red-950/90 border-amber-300/60',
        ambientGlow: 'radial-gradient(circle, rgba(251,191,36,0.28) 0%, rgba(239,68,68,0.14) 55%, transparent 78%)',
        sceneLabel: '🏛️ Khuê Văn Các · Văn Miếu Quốc Tử Giám',
      };
    case 'han-viet':
      return {
        id: 'han-viet',
        stageBg: 'radial-gradient(circle at 50% 22%, #4c1d6e 0%, #230e38 52%, #0b0414 100%)',
        cardBg: 'linear-gradient(180deg, rgba(58,22,88,0.74) 0%, rgba(24,9,40,0.82) 100%)',
        cardBorder: 'border-amber-300/90',
        badgeBg: 'bg-purple-950/90 border-amber-300/65',
        ambientGlow: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(168,85,247,0.18) 55%, transparent 78%)',
        sceneLabel: '🏯 Ngọ Môn Quan · Kinh Thành Huế & Lầu Ngũ Phụng',
      };
    case 'phu-am':
    default:
      return {
        id: 'phu-am',
        stageBg: 'radial-gradient(circle at 50% 22%, #154c57 0%, #0a252c 52%, #040e12 100%)',
        cardBg: 'linear-gradient(180deg, rgba(14,48,56,0.72) 0%, rgba(7,24,30,0.80) 100%)',
        cardBorder: 'border-amber-300/80',
        badgeBg: 'bg-emerald-950/90 border-amber-400/55',
        ambientGlow: 'radial-gradient(circle, rgba(251,191,36,0.26) 0%, rgba(16,185,129,0.14) 55%, transparent 78%)',
        sceneLabel: '🥁 Trống Đồng Đông Sơn & Chim Lạc Âu Lạc',
      };
  }
}

function StageBackgroundArtwork({ theme }: { theme: StageTheme }) {
  return (
    <>
      {/* Quầng sáng trung tâm đổi màu theo từng màn chơi */}
      <div
        className="pointer-events-none absolute left-1/2 top-[640px] h-[1050px] w-[1050px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700"
        style={{ background: theme.ambientGlow }}
      />

      {/* ==================== VÒNG 1: TRỐNG ĐỒNG ĐÔNG SƠN & CHIM LẠC ÂU LẠC ==================== */}
      {theme.id === 'phu-am' && (
        <>
          <svg
            viewBox="0 0 800 800"
            className="pointer-events-none absolute left-1/2 top-[650px] z-[1] h-[980px] w-[980px] -translate-x-1/2 -translate-y-1/2 opacity-[0.38]"
          >
            <defs>
              <radialGradient id="bronzeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="400" cy="400" r="380" fill="url(#bronzeGlow)" />
            <circle cx="400" cy="400" r="365" fill="none" stroke="#fbbf24" strokeWidth="6" />
            <circle cx="400" cy="400" r="345" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 6" />
            <circle cx="400" cy="400" r="305" fill="none" stroke="#fbbf24" strokeWidth="4" />
            <circle cx="400" cy="400" r="245" fill="none" stroke="#fbbf24" strokeWidth="4.5" />
            <circle cx="400" cy="400" r="185" fill="none" stroke="#fde68a" strokeWidth="3.5" />
            <circle cx="400" cy="400" r="135" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="10 6" />
            <circle cx="400" cy="400" r="92" fill="#f59e0b" fillOpacity="0.22" stroke="#fde68a" strokeWidth="4.5" />

            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              return (
                <g key={`tooth-${deg}`} transform={`rotate(${deg} 400 400)`}>
                  <polygon points="400,36 391,55 409,55" fill="#fbbf24" fillOpacity="0.7" />
                  <polygon points="400,245 394,225 406,225" fill="#fde68a" fillOpacity="0.6" />
                </g>
              );
            })}

            {[0, 90, 180, 270].map((deg) => (
              <g key={`lac-${deg}`} transform={`rotate(${deg} 400 400)`}>
                <path
                  d="M340 130 Q400 105 465 130 L495 118 L465 142 Q415 135 400 165 Q385 135 335 148 L305 162 L340 130 Z"
                  fill="#fde68a"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
                <path d="M372 115 Q400 72 438 98 Q410 108 395 124 Z" fill="#fbbf24" />
                <path d="M398 158 L382 182 L418 182 Z" fill="#fbbf24" />
              </g>
            ))}

            {Array.from({ length: 14 }).map((_, i) => {
              const deg = (i * 360) / 14;
              return (
                <polygon
                  key={`star-${deg}`}
                  points="400,308 386,374 414,374"
                  fill="#fde68a"
                  transform={`rotate(${deg} 400 400)`}
                />
              );
            })}
            <circle cx="400" cy="400" r="34" fill="#fde68a" stroke="#b45309" strokeWidth="4" />
          </svg>

          <svg
            viewBox="0 0 1080 280"
            className="pointer-events-none absolute bottom-0 left-0 z-[1] h-[280px] w-full opacity-[0.34]"
          >
            <line x1="40" y1="210" x2="1040" y2="210" stroke="#fbbf24" strokeWidth="3" />
            <line x1="40" y1="245" x2="1040" y2="245" stroke="#fbbf24" strokeWidth="2" strokeDasharray="12 8" />
            {Array.from({ length: 18 }).map((_, i) => (
              <polygon
                key={i}
                points={`${70 + i * 55},245 ${95 + i * 55},212 ${120 + i * 55},245`}
                fill="#fbbf24"
                fillOpacity="0.45"
              />
            ))}
          </svg>
        </>
      )}

      {/* ==================== VÒNG 2: ĐÊM RẰM CHỊ HẰNG, THỎ NGỌC, CÂY ĐA & HỒ SEN ==================== */}
      {theme.id === 'dau-van' && (
        <svg
          viewBox="0 0 1000 1050"
          className="pointer-events-none absolute left-1/2 top-[650px] z-[1] h-[1080px] w-[1040px] -translate-x-1/2 -translate-y-1/2 opacity-[0.44]"
        >
          <defs>
            <radialGradient id="fullMoonGrad" cx="50%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
              <stop offset="68%" stopColor="#fde047" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.65" />
            </radialGradient>
            <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="500" cy="310" r="320" fill="url(#moonHalo)" />
          <circle cx="500" cy="310" r="215" fill="none" stroke="#fde047" strokeWidth="2.5" strokeDasharray="12 10" />
          <circle cx="500" cy="310" r="182" fill="url(#fullMoonGrad)" stroke="#fef08a" strokeWidth="5" />

          <path
            d="M585 462 C575 410 565 375 540 345 C520 325 495 318 480 322 C515 305 555 312 580 338 C600 310 635 300 660 315 C625 322 605 342 600 375 C615 410 622 440 635 452 Z"
            fill="#451a03"
            fillOpacity="0.72"
          />
          <circle cx="555" cy="272" r="58" fill="#78350f" fillOpacity="0.48" />
          <circle cx="615" cy="295" r="52" fill="#78350f" fillOpacity="0.48" />
          <circle cx="515" cy="292" r="44" fill="#78350f" fillOpacity="0.42" />

          <g transform="translate(355, 175)">
            <path
              d="M15 125 C-25 85 20 25 75 45 C130 65 165 25 195 65"
              fill="none"
              stroke="#78350f"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.78"
            />
            <path
              d="M10 155 C-30 190 15 235 65 210"
              fill="none"
              stroke="#92400e"
              strokeWidth="5.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx="88" cy="64" r="20" fill="#451a03" fillOpacity="0.86" />
            <circle cx="102" cy="46" r="11" fill="#451a03" fillOpacity="0.86" />
            <line x1="88" y1="42" x2="122" y2="34" stroke="#451a03" strokeWidth="3.5" />
            <path
              d="M72 86 C55 125 35 185 12 238 L128 242 C118 185 112 130 102 86 Z"
              fill="#451a03"
              fillOpacity="0.84"
            />
            <path d="M72 102 Q38 112 22 92" fill="none" stroke="#451a03" strokeWidth="9" strokeLinecap="round" opacity="0.84" />
            <circle cx="18" cy="84" r="11" fill="#ef4444" stroke="#fef08a" strokeWidth="3" />
            <ellipse cx="148" cy="215" rx="18" ry="13" fill="#451a03" fillOpacity="0.82" />
            <circle cx="135" cy="202" r="9" fill="#451a03" fillOpacity="0.82" />
            <ellipse cx="132" cy="186" rx="3.5" ry="11" fill="#451a03" fillOpacity="0.82" transform="rotate(-15 132 186)" />
            <ellipse cx="140" cy="186" rx="3.5" ry="11" fill="#451a03" fillOpacity="0.82" transform="rotate(10 140 186)" />
          </g>

          <path d="M110 350 Q190 310 270 350 T430 355" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
          <path d="M590 245 Q675 205 760 245 T900 250" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />

          <g transform="translate(500, 690)">
            <ellipse cx="0" cy="85" rx="340" ry="38" fill="none" stroke="#fde047" strokeWidth="3" strokeDasharray="16 10" />
            <ellipse cx="0" cy="130" rx="420" ry="46" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="10 14" />
            <path d="M0 -85 C42 -20 48 55 0 95 C-48 55 -42 -20 0 -85 Z" fill="#f43f5e" fillOpacity="0.55" stroke="#fde047" strokeWidth="4" />
            <path d="M0 95 C65 55 112 -10 98 -70 C48 -42 18 15 0 95 Z" fill="#fb7185" fillOpacity="0.48" stroke="#fde047" strokeWidth="3.5" />
            <path d="M0 95 C-65 55 -112 -10 -98 -70 C-48 -42 -18 15 0 95 Z" fill="#fb7185" fillOpacity="0.48" stroke="#fde047" strokeWidth="3.5" />
            <path d="M0 95 C95 82 170 32 182 -22 C115 -10 55 38 0 95 Z" fill="#fda4af" fillOpacity="0.4" stroke="#fde047" strokeWidth="3" />
            <path d="M0 95 C-95 82 -170 32 -182 -22 C-115 -10 -55 38 0 95 Z" fill="#fda4af" fillOpacity="0.4" stroke="#fde047" strokeWidth="3" />
          </g>
        </svg>
      )}

      {/* ==================== VÒNG 3: KHUÊ VĂN CÁC · VĂN MIẾU QUỐC TỬ GIÁM ==================== */}
      {theme.id === 'bat-loi-cau' && (
        <svg
          viewBox="0 0 1000 1050"
          className="pointer-events-none absolute left-1/2 top-[660px] z-[1] h-[1060px] w-[1020px] -translate-x-1/2 -translate-y-1/2 opacity-[0.42]"
        >
          <circle cx="500" cy="390" r="290" fill="#f59e0b" fillOpacity="0.14" />
          <circle cx="500" cy="390" r="240" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="10 8" />

          <path
            d="M210 250 Q260 235 310 175 L690 175 Q740 235 790 250 Q720 265 280 265 Z"
            fill="#b45309"
            fillOpacity="0.65"
            stroke="#fde047"
            strokeWidth="4.5"
          />
          <circle cx="500" cy="148" r="22" fill="#fde047" stroke="#dc2626" strokeWidth="4" />
          <path
            d="M150 335 Q230 315 285 262 L715 262 Q770 315 850 335 Q760 350 240 350 Z"
            fill="#991b1b"
            fillOpacity="0.75"
            stroke="#fde047"
            strokeWidth="5"
          />

          <rect x="285" y="348" width="430" height="210" fill="#7f1d1d" fillOpacity="0.72" stroke="#fbbf24" strokeWidth="4.5" />
          <circle cx="500" cy="452" r="78" fill="#fef08a" fillOpacity="0.24" stroke="#fde047" strokeWidth="6" />
          <circle cx="500" cy="452" r="58" fill="none" stroke="#fde047" strokeWidth="2.5" strokeDasharray="6 6" />
          {Array.from({ length: 8 }).map((_, i) => {
            const deg = i * 45;
            return (
              <line
                key={deg}
                x1="500"
                y1="295"
                x2="500"
                y2="374"
                stroke="#fde047"
                strokeWidth="5"
                transform={`rotate(${deg} 500 452)`}
              />
            );
          })}

          <rect x="245" y="558" width="510" height="32" fill="#b45309" fillOpacity="0.8" stroke="#fde047" strokeWidth="3.5" />
          {[280, 410, 545, 675].map((x) => (
            <rect key={x} x={x} y="590" width="45" height="165" fill="#fde68a" fillOpacity="0.55" stroke="#fbbf24" strokeWidth="3.5" />
          ))}

          {[145, 805].map((bx, idx) => (
            <g key={idx} transform={`translate(${bx}, 585)`}>
              <path
                d="M-36 140 L-36 35 Q0 -5 36 35 L36 140 Z"
                fill="#d97706"
                fillOpacity="0.48"
                stroke="#fde047"
                strokeWidth="3.5"
              />
              <ellipse cx="0" cy="152" rx="52" ry="20" fill="#b45309" fillOpacity="0.75" stroke="#fde047" strokeWidth="3" />
              <circle cx={idx === 0 ? 58 : -58} cy="146" r="12" fill="#fde047" fillOpacity="0.7" />
            </g>
          ))}

          <line x1="90" y1="758" x2="910" y2="758" stroke="#fde047" strokeWidth="6" />
          <line x1="50" y1="792" x2="950" y2="792" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="18 10" />
        </svg>
      )}

      {/* ==================== VÒNG 4: NGỌ MÔN QUAN · KINH THÀNH HUẾ ==================== */}
      {theme.id === 'han-viet' && (
        <svg
          viewBox="0 0 1040 1060"
          className="pointer-events-none absolute left-1/2 top-[660px] z-[1] h-[1060px] w-[1040px] -translate-x-1/2 -translate-y-1/2 opacity-[0.42]"
        >
          <circle cx="520" cy="340" r="280" fill="#f59e0b" fillOpacity="0.16" />
          <polygon
            points="520,75 635,122 682,238 635,352 520,400 405,352 358,238 405,122"
            fill="none"
            stroke="#fde047"
            strokeWidth="3"
            strokeDasharray="10 8"
          />

          <path d="M320 275 Q370 250 410 195 L630 195 Q670 250 720 275 Z" fill="#d97706" fillOpacity="0.72" stroke="#fef08a" strokeWidth="4.5" />
          <path d="M250 355 Q320 330 370 275 L670 275 Q720 330 790 355 Z" fill="#991b1b" fillOpacity="0.78" stroke="#fde047" strokeWidth="4.5" />
          <path d="M110 385 Q165 365 200 320 L310 320 L310 385 Z" fill="#b45309" fillOpacity="0.65" stroke="#fde047" strokeWidth="3.5" />
          <path d="M930 385 Q875 365 840 320 L730 320 L730 385 Z" fill="#b45309" fillOpacity="0.65" stroke="#fde047" strokeWidth="3.5" />

          <rect x="200" y="355" width="640" height="125" fill="#7f1d1d" fillOpacity="0.68" stroke="#fde047" strokeWidth="4" />
          {[250, 325, 400, 475, 565, 640, 715, 790].map((cx) => (
            <line key={cx} x1={cx} y1="355" x2={cx} y2="480" stroke="#fde047" strokeWidth="4.5" />
          ))}
          <rect x="445" y="382" width="150" height="44" rx="8" fill="#fef08a" fillOpacity="0.85" stroke="#991b1b" strokeWidth="3" />

          <path d="M85 770 L135 480 L905 480 L955 770 Z" fill="#44403c" fillOpacity="0.75" stroke="#fbbf24" strokeWidth="4.5" />
          {Array.from({ length: 17 }).map((_, i) => (
            <rect key={i} x={140 + i * 45} y="462" width="28" height="18" fill="#fbbf24" fillOpacity="0.65" />
          ))}

          <path d="M465 770 L465 595 A55 55 0 0 1 575 595 L575 770 Z" fill="#fde047" fillOpacity="0.45" stroke="#fef08a" strokeWidth="5" />
          <path d="M330 770 L330 620 A44 44 0 0 1 418 620 L418 770 Z" fill="#f59e0b" fillOpacity="0.32" stroke="#fde047" strokeWidth="4" />
          <path d="M622 770 L622 620 A44 44 0 0 1 710 620 L710 770 Z" fill="#f59e0b" fillOpacity="0.32" stroke="#fde047" strokeWidth="4" />
          <path d="M195 770 L195 645 A36 36 0 0 1 267 645 L267 770 Z" fill="#f59e0b" fillOpacity="0.24" stroke="#fbbf24" strokeWidth="3.5" />
          <path d="M773 770 L773 645 A36 36 0 0 1 845 645 L845 770 Z" fill="#f59e0b" fillOpacity="0.24" stroke="#fbbf24" strokeWidth="3.5" />

          <line x1="50" y1="772" x2="990" y2="772" stroke="#fde047" strokeWidth="6" />
          <ellipse cx="520" cy="825" rx="380" ry="26" fill="none" stroke="#fde047" strokeWidth="2.5" strokeDasharray="16 10" />
        </svg>
      )}

      {/* ==================== CHUYỂN VÒNG & ĐĂNG QUANG: ĐIỆN THÁI HÒA & VINH QUY BÁI TỔ ==================== */}
      {(theme.id === 'round_board' || theme.id === 'podium') && (
        <svg
          viewBox="0 0 1000 1000"
          className="pointer-events-none absolute left-1/2 top-[650px] z-[1] h-[1020px] w-[1020px] -translate-x-1/2 -translate-y-1/2 opacity-[0.38]"
        >
          <circle cx="500" cy="430" r="320" fill="none" stroke="#fde047" strokeWidth="4" strokeDasharray="14 10" />
          <circle cx="500" cy="430" r="240" fill="#f59e0b" fillOpacity="0.14" stroke="#fbbf24" strokeWidth="3" />
          {Array.from({ length: 20 }).map((_, i) => {
            const deg = i * 18;
            return (
              <line
                key={deg}
                x1="500"
                y1="70"
                x2="500"
                y2="790"
                stroke="#fde047"
                strokeWidth="2.5"
                transform={`rotate(${deg} 500 430)`}
              />
            );
          })}
          <path d="M260 660 L260 470 L740 470 L740 660" fill="none" stroke="#fde047" strokeWidth="6" />
          <path d="M200 470 Q500 350 800 470 Z" fill="#b45309" fillOpacity="0.55" stroke="#fde047" strokeWidth="5" />
        </svg>
      )}
    </>
  );
}

function AvatarBubble({ name, avatar, size = 44, gold = false }: { name: string; avatar?: string; size?: number; gold?: boolean }) {
  const initial = Array.from((name || '?').trim())[0]?.toUpperCase() || '?';
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 overflow-hidden rounded-full flex items-center justify-center font-bold select-none ${
        gold ? 'ring-3 ring-amber-300 bg-gradient-to-br from-amber-500 to-red-800 text-amber-50' : 'ring-2 ring-amber-400/60 bg-emerald-900 text-amber-200'
      }`}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.44) }}>{initial}</span>
      )}
    </div>
  );
}

export function GameStage({
  snapshot,
  caiDat,
  weeklyTop,
  viewerCount = 0,
  audioBlocked = false,
  serverStopped = false,
  onUnlockAudio,
}: {
  snapshot: GameSnapshot;
  caiDat: CaiDat;
  weeklyTop: WeeklyTopEntry[];
  viewerCount?: number;
  audioBlocked?: boolean;
  serverStopped?: boolean;
  onUnlockAudio?: () => void;
}) {
  const {
    puzzle,
    phase,
    secondsLeft,
    totalSeconds,
    tugOfWar,
    leaderboard,
    recentSolves,
    giftBanner,
  } = snapshot;

  const timePct = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;
  const urgent = phase === 'playing' && secondsLeft <= 5;
  const theme = getStageTheme(puzzle.roundCode, phase);
  const [lbl1, lbl2] = puzzle.choiceLabels || ['1', '2'];

  return (
    <div
      onClick={onUnlockAudio}
      className="relative h-[1920px] w-[1080px] overflow-hidden select-none text-amber-50 transition-all duration-700"
      style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        background: theme.stageBg,
      }}
    >
      {/* Họa tiết nền văn hóa thay đổi theo từng màn chơi */}
      <StageBackgroundArtwork theme={theme} />

      {/* Viền cung đình hoàng kim */}
      <div className="pointer-events-none absolute inset-[22px] rounded-[36px] border-2 border-amber-400/25 shadow-[inset_0_0_80px_rgba(245,158,11,0.08)]" />

      {/* Đèn lồng trang trí góc trên */}
      <div className="pointer-events-none absolute left-[64px] top-0 flex flex-col items-center">
        <div className="h-[52px] w-[3px] bg-amber-400/70" />
        <div className="h-[46px] w-[62px] rounded-full bg-gradient-to-b from-red-600 to-red-900 ring-2 ring-amber-300 shadow-[0_0_30px_rgba(239,68,68,0.65)]" />
        <div className="h-[22px] w-[4px] bg-amber-300" />
      </div>
      <div className="pointer-events-none absolute right-[64px] top-0 flex flex-col items-center">
        <div className="h-[52px] w-[3px] bg-amber-400/70" />
        <div className="h-[46px] w-[62px] rounded-full bg-gradient-to-b from-red-600 to-red-900 ring-2 ring-amber-300 shadow-[0_0_30px_rgba(239,68,68,0.65)]" />
        <div className="h-[22px] w-[4px] bg-amber-300" />
      </div>

      {/* Nút nhắc mở khóa âm thanh nếu trình duyệt chặn autoplay */}
      {audioBlocked && (
        <button
          onClick={onUnlockAudio}
          className="absolute left-1/2 top-[34px] z-50 -translate-x-1/2 rounded-full bg-amber-400 px-7 py-2.5 text-[22px] font-extrabold text-slate-950 shadow-xl"
        >
          🔊 Chạm 1 lần để bật âm thanh đấu trường
        </button>
      )}

      {serverStopped && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-12 text-center">
          <div className="rounded-3xl border-2 border-amber-400/50 bg-slate-900 p-10">
            <div className="text-[44px] font-black text-amber-300">🔌 ĐÃ TẮT SERVER LIVE</div>
            <div className="mt-3 text-[26px] text-slate-300">Cổng 4016 đã được giải phóng an toàn.</div>
          </div>
        </div>
      )}

      {/* ==================== HEADER HOÀNH PHI ==================== */}
      <header className="relative z-10 mx-[54px] mt-[84px] flex flex-col items-center">
        <div
          className="w-full rounded-[28px] border-[3px] border-amber-300/90 px-8 py-3.5 text-center shadow-[0_14px_38px_rgba(0,0,0,0.65)]"
          style={{
            background: 'linear-gradient(180deg, #881313 0%, #5c0b0b 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-2 text-[18px] font-bold tracking-wider whitespace-nowrap text-amber-200/90">
            <span className="shrink-0">📜 VÁN #{snapshot.matchNumber}</span>
            <span className="truncate uppercase tracking-[0.12em] text-amber-300">✦ ĐẤU TRƯỜNG TIẾNG VIỆT 1/2 & A/B · BÚT SA GÀ CHẾT ✦</span>
            <span className="shrink-0">👁 {viewerCount > 0 ? `${viewerCount} SĨ TỬ` : 'TRỰC TIẾP'}</span>
          </div>
          <h1
            className="mt-1 font-black tracking-wide text-amber-200 drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            style={{
              fontFamily: "'Playfair Display', 'Be Vietnam Pro', serif",
              fontSize: 54,
              lineHeight: 1.12,
            }}
          >
            {caiDat.tieuDe || 'VUA CHÍNH TẢ'}
          </h1>
        </div>

        {/* Dải thông tin Vòng đấu & Tiến độ câu (luôn nằm gọn 1 hàng) */}
        <div className="mt-3 flex w-full items-center justify-between gap-3 whitespace-nowrap">
          <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-lg transition-colors duration-500 ${theme.badgeBg}`}>
            <span className="rounded-xl bg-amber-400 px-3 py-1 text-[21px] font-black text-slate-950">
              VÒNG {puzzle.roundIndex + 1}/4
            </span>
            <span className="text-[24px] font-extrabold text-amber-200">{puzzle.roundLabel.replace(/\s*×2$/, '')}</span>
            {puzzle.isDoublePoints && (
              <span className="rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-0.5 text-[19px] font-black text-red-950 shadow">
                ×2 ĐIỂM
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-400/40 bg-slate-900/85 px-4 py-2.5 text-[21px] font-bold text-amber-100">
            <span>
              Câu <b className="text-amber-300">{puzzle.questionInRound}</b>/{puzzle.totalInRound}
            </span>
            <span className="text-amber-500/60">•</span>
            <span className="text-emerald-300">✓ {snapshot.solverCount} đúng</span>
            <span className="text-amber-500/60">•</span>
            <span className="text-rose-300">✗ {snapshot.wrongCount} sai</span>
          </div>
        </div>
      </header>

      {/* ==================== BANNER QUÀ TẶNG VINH QUY (nếu có) ==================== */}
      {giftBanner && (
        <div
          className={`relative z-30 mx-[54px] mt-3 flex items-center gap-4 rounded-2xl border-2 px-6 py-3 shadow-2xl ${
            giftBanner.big
              ? 'border-amber-200 bg-gradient-to-r from-amber-600 via-red-700 to-amber-600'
              : 'border-amber-400/70 bg-gradient-to-r from-red-900/95 to-amber-900/95'
          }`}
        >
          <AvatarBubble name={giftBanner.name} avatar={giftBanner.avatar} size={56} gold />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[25px] font-black text-amber-100">
              {giftBanner.big ? '🎆 PHÁO HOA VINH QUY! ' : '🌹 CẢM ƠN QUÝ NHÂN: '}
              <span className="text-white">{giftBanner.name}</span>
            </div>
            <div className="text-[21px] font-semibold text-amber-200">
              Đã trao tặng <b>{giftBanner.count}× {giftBanner.giftName}</b> cổ vũ đấu trường!
            </div>
          </div>
        </div>
      )}

      {/* ==================== KHU VỰC TRUNG TÂM THEO TỪNG PHA ==================== */}
      <main className="relative z-10 mx-[54px] mt-3.5">
        {phase === 'round_board' ? (
          <RoundBoardScreen snapshot={snapshot} weeklyTop={weeklyTop} />
        ) : phase === 'podium' ? (
          <PodiumScreen snapshot={snapshot} />
        ) : (
          <>
            {/* BẢNG ĐẤU TRƯỜNG CHÍNH */}
            <section
              className={`relative rounded-[32px] border-[3px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.65)] transition-all duration-700 ${theme.cardBorder}`}
              style={{
                background: theme.cardBg,
              }}
            >
              {/* Tiêu đề nhiệm vụ + Luật vòng đấu + Đồng hồ đếm ngược */}
              <div className="flex items-center justify-between gap-4 border-b border-amber-300/20 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-slate-950/60 px-3.5 py-1 text-[17px] font-bold text-amber-200">
                      {theme.sceneLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-400/20 px-3.5 py-1 text-[17px] font-extrabold text-amber-300">
                      🏷️ {puzzle.categoryTag}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-950/80 px-3.5 py-1 text-[17px] font-black text-emerald-300">
                      📌 LUẬT VÒNG {puzzle.roundIndex + 1}: GÕ [{lbl1}] HOẶC [{lbl2}]
                    </span>
                  </div>
                  <div className="text-[25px] font-black tracking-wider text-amber-300 uppercase">{puzzle.prompt}</div>
                </div>

                {/* Đồng hồ tròn lớn */}
                <div
                  className={`flex h-[108px] w-[108px] shrink-0 flex-col items-center justify-center rounded-full border-4 shadow-inner ${
                    urgent
                      ? 'border-rose-400 bg-rose-950 text-rose-200 scale-105 transition-transform'
                      : 'border-amber-300 bg-slate-950/90 text-amber-200'
                  }`}
                >
                  <span className="text-[44px] leading-none font-black">{secondsLeft}</span>
                  <span className="text-[16px] font-bold opacity-80">GIÂY</span>
                </div>
              </div>

              {/* Thanh thời gian mượt */}
              <div className="mt-3 h-[12px] w-full overflow-hidden rounded-full bg-slate-950/80 ring-1 ring-amber-400/25">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    urgent ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-500'
                  }`}
                  style={{ width: `${timePct}%` }}
                />
              </div>

              {/* NỘI DUNG CÂU HỎI CỠ LỚN + 2 THẺ ĐỐI XỨNG 1 HÀNG + GIẢI THÍCH TỪ ĐIỂN */}
              <div className="mt-5">
                <DualChoiceArena puzzle={puzzle} tugOfWar={tugOfWar} />
              </div>
            </section>

            {/* HÀNG GIỮA: BẢNG VÀNG TOP 5 TRỰC TIẾP + NGƯỜI VỪA CHỌN ĐÚNG */}
            <div className="mt-4 grid grid-cols-12 gap-4">
              {/* Top 5 Sĩ Tử dẫn đầu */}
              <div className="col-span-7 rounded-[26px] border-2 border-amber-400/45 bg-slate-950/70 p-5 shadow-xl">
                <div className="mb-2.5 flex items-center justify-between gap-2 whitespace-nowrap">
                  <span className="text-[21px] font-black text-amber-300">🏆 BẢNG VÀNG VUA CHÍNH TẢ</span>
                  <span className="text-[16px] font-semibold text-amber-200/85">Chuỗi 3 câu +100đ</span>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="flex h-[245px] items-center justify-center rounded-2xl border border-dashed border-amber-400/25 text-center text-[23px] text-amber-100/75 px-4">
                    Bình luận [{lbl1}] hoặc [{lbl2}] để mở hàng Bảng Vàng!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2 ${
                          p.rank === 1
                            ? 'bg-gradient-to-r from-amber-500/30 to-red-900/40 ring-1 ring-amber-300/60'
                            : 'bg-slate-900/80'
                        }`}
                      >
                        <span className="w-[38px] text-center text-[23px] font-black text-amber-300">
                          {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                        </span>
                        <AvatarBubble name={p.name} avatar={p.avatar} size={40} gold={p.rank === 1} />
                        <span className="min-w-0 flex-1 truncate text-[22px] font-bold text-white">{p.name}</span>
                        {p.streak >= 2 && <span className="text-[19px] font-bold text-orange-300">🔥{p.streak}</span>}
                        <span className="text-[23px] font-black text-amber-300">{p.score}đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Luồng vinh danh người vừa chọn đúng */}
              <div className="col-span-5 rounded-[26px] border-2 border-emerald-400/40 bg-slate-950/70 p-5 shadow-xl">
                <div className="mb-2.5 text-[23px] font-black text-emerald-300">⚡ CHỐT ĐÚNG NHANH NHẤT</div>
                {recentSolves.length === 0 ? (
                  <div className="flex h-[245px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/25 px-3 text-center text-[21px] text-emerald-100/75">
                    <span>Chưa ai mở hàng câu này!</span>
                    <span className="mt-1.5 text-[19px] font-bold text-amber-300">
                      Gõ [{lbl1}] hoặc [{lbl2}] sớm nhất nhận điểm tối đa!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentSolves.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-emerald-950/65 px-3.5 py-2 ring-1 ring-emerald-400/25">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[20px] font-bold text-white">{s.name}</div>
                          <div className="truncate text-[17px] text-emerald-300">
                            Chọn [{s.choiceLabel || s.choice}] · «{s.word}» {s.streakBonus ? '🔥+100' : ''}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-amber-400 px-3 py-0.5 text-[20px] font-black text-slate-950">
                          +{s.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Lời bình Học Giả MC */}
        <div className="mt-4 flex items-center gap-4 rounded-[26px] border-2 border-amber-300/50 bg-gradient-to-r from-red-950/90 via-slate-950/95 to-emerald-950/90 px-6 py-4 shadow-xl">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-500 to-red-900 text-[38px] shadow-md">
            🎓
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-extrabold tracking-wide text-amber-300 uppercase">
              {caiDat.tenMc || 'Học Giả Quốc Ngữ'} · Chủ Khảo Chính Tả
            </div>
            <div className="mt-0.5 line-clamp-2 text-[23px] font-semibold leading-snug text-amber-50">
              “{snapshot.mcSpeech}”
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ==================== ĐẤU TRƯỜNG 2 THẺ [1] VS [2] + THANH KÉO CO + GIẢI THÍCH ==================== */

function DualChoiceArena({
  puzzle,
  tugOfWar,
}: {
  puzzle: GameSnapshot['puzzle'];
  tugOfWar: GameSnapshot['tugOfWar'];
}) {
  const revealed = puzzle.revealedChoice;
  const [lbl1, lbl2] = puzzle.choiceLabels || ['1', '2'];
  const options = [
    {
      num: 1 as const,
      label: lbl1,
      text: puzzle.option1,
      sub: puzzle.option1Sub,
      votes: tugOfWar.count1,
      pct: tugOfWar.pct1,
      badgeTone: 'from-sky-500 to-blue-700 text-white border-sky-300',
      cardIdleTone: 'border-sky-300/85 bg-gradient-to-b from-sky-900/80 via-slate-900/90 to-slate-950/95',
      pillLabel: `🔵 GÕ [ ${lbl1} ]`,
    },
    {
      num: 2 as const,
      label: lbl2,
      text: puzzle.option2,
      sub: puzzle.option2Sub,
      votes: tugOfWar.count2,
      pct: tugOfWar.pct2,
      badgeTone: 'from-amber-400 to-orange-600 text-slate-950 border-amber-200',
      cardIdleTone: 'border-amber-300/85 bg-gradient-to-b from-amber-900/75 via-red-950/85 to-slate-950/95',
      pillLabel: `🟠 GÕ [ ${lbl2} ]`,
    },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      {/* KHUNG CUỐN THƯ ĐỀ BÀI CỠ LỚN CHO CẢ 4 VÒNG — DỄ ĐỌC TRÊN MÀN HÌNH ĐIỆN THOẠI */}
      {puzzle.sentenceParts ? (
        <div className="mb-5 w-full rounded-[26px] border-[3px] border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200/95 px-8 py-6 text-center text-slate-950 shadow-2xl">
          <div className="text-[20px] font-black tracking-wider text-red-900 uppercase">
            {puzzle.roundCode === 'han-viet'
              ? `🔍 TỪ IN ĐẬM TRONG CÂU DƯỚI ĐÂY LÀ TỪ THUẦN VIỆT [${lbl1}] HAY TỪ HÁN VIỆT [${lbl2}]?`
              : `🔍 TỪ IN ĐẬM TRONG CÂU DƯỚI ĐÂY VIẾT ĐÚNG [${lbl1}] HAY SAI [${lbl2}]?`}
          </div>
          <div className="mt-2.5 text-[42px] font-black leading-[1.34] text-slate-950">
            {puzzle.sentenceParts.before && <span>“{puzzle.sentenceParts.before} </span>}
            <span className="mx-1.5 inline-block rounded-2xl border-2 border-amber-300 bg-red-900 px-5 py-1 text-[44px] font-black text-amber-200 underline decoration-amber-300 decoration-wavy shadow-lg">
              {puzzle.sentenceParts.highlight}
            </span>
            {puzzle.sentenceParts.after && <span> {puzzle.sentenceParts.after}”</span>}
          </div>
        </div>
      ) : (
        <div className="mb-5 w-full rounded-[26px] border-[3px] border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200/95 px-8 py-6 text-center text-slate-950 shadow-2xl">
          <div className="text-[19px] font-black tracking-wider text-red-900 uppercase">
            {puzzle.roundCode === 'han-viet'
              ? `🔍 CÂU HỎI PHÂN TÍCH TỪ VỰNG (×2 ĐIỂM) · GÕ [${lbl1}] HOẶC [${lbl2}]`
              : `💡 GỢI Ý NGỮ CẢNH & NGHĨA CỦA TỪ · GÕ [${lbl1}] HOẶC [${lbl2}]`}
          </div>
          <div className="mt-2 text-[38px] font-black leading-[1.32] text-slate-950">
            “{puzzle.contextHint}”
          </div>
        </div>
      )}

      {/* 2 THẺ PHƯƠNG ÁN ĐỐI XỨNG [1] VS [2] HOẶC [A] VS [B] — BẮT BUỘC 1 HÀNG DUY NHẤT */}
      <div className="grid w-full grid-cols-2 gap-5">
        {options.map((opt) => {
          const isWinner = revealed !== undefined && revealed === opt.num;
          const isLoser = revealed !== undefined && revealed !== opt.num;
          const len = opt.text.length;
          // Tự động co cỡ chữ thông minh kết hợp whitespace-nowrap để ĐÚNG CHÍNH TẢ / SAI CHÍNH TẢ / TỪ THUẦN VIỆT luôn nằm gọn 1 hàng
          const textSizeCls =
            len <= 8
              ? 'text-[52px]'
              : len <= 11
                ? 'text-[42px]'
                : len <= 14
                  ? 'text-[36px]'
                  : 'text-[30px]';

          return (
            <div
              key={opt.num}
              className={`relative flex min-h-[245px] flex-col items-center justify-between rounded-[28px] border-[3.5px] px-5 py-5 text-center shadow-2xl transition-all duration-500 ${
                isWinner
                  ? 'border-emerald-300 bg-gradient-to-b from-emerald-600 via-emerald-800 to-emerald-950 scale-[1.02] shadow-[0_0_45px_rgba(16,185,129,0.55)]'
                  : isLoser
                    ? 'border-slate-600 bg-slate-900/50 opacity-45'
                    : opt.cardIdleTone
              }`}
            >
              {/* Huy hiệu PHƯƠNG ÁN [1] / [2] hoặc [A] / [B] + Số người chọn */}
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-2xl border-2 bg-gradient-to-r px-4 py-1.5 text-[23px] font-black whitespace-nowrap shadow-md ${opt.badgeTone}`}
                >
                  PHƯƠNG ÁN [ {opt.label} ]
                </span>
                <span className="rounded-xl bg-slate-950/75 px-3 py-1.5 text-[19px] font-extrabold whitespace-nowrap text-amber-200 ring-1 ring-amber-300/30">
                  {opt.votes} người ({opt.pct}%)
                </span>
              </div>

              {/* Từ khóa lớn nằm trên 1 hàng duy nhất */}
              <div className="my-4 flex flex-1 items-center justify-center px-1">
                <span
                  className={`whitespace-nowrap font-black tracking-wide leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] ${textSizeCls}`}
                >
                  {opt.text}
                </span>
              </div>

              {/* Dòng trạng thái chân thẻ */}
              {isWinner ? (
                <div className="w-full rounded-xl bg-emerald-400/25 py-2 text-[22px] font-black text-emerald-200 ring-1 ring-emerald-300">
                  {puzzle.roundCode === 'han-viet' ? '✓ ĐÁP ÁN CHÍNH XÁC (×2)' : '✓ ĐÁP ÁN ĐÚNG CHÍNH TẢ'}
                </div>
              ) : isLoser ? (
                <div className="w-full rounded-xl bg-rose-950/60 py-2 text-[21px] font-bold text-rose-300">
                  {puzzle.roundCode === 'han-viet' ? '✗ CHƯA CHÍNH XÁC' : '✗ SAI CHÍNH TẢ'}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-slate-950/65 py-2 text-[20px] font-bold text-amber-200/95">
                  {opt.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VÒNG 3: DÒNG CHỐT ĐÚNG/SAI NGẮN GỌN · VÒNG 4: HỘP PHÂN TÍCH THUẦN VIỆT & HÁN VIỆT (VÒNG 1 & 2 KHÔNG HIỆN GIẢI THÍCH) */}
      {puzzle.explanation &&
        (puzzle.roundCode === 'bat-loi-cau' ? (
          <div className="mt-4 w-full rounded-2xl border-2 border-emerald-300 bg-emerald-950/90 px-6 py-3.5 text-center text-[27px] font-black text-emerald-200 shadow-xl">
            {puzzle.explanation}
          </div>
        ) : (
          <div className="mt-4 w-full rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-950/95 via-teal-950/95 to-emerald-950/95 px-6 py-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[22px] font-black text-emerald-300 uppercase">
                📖 PHÂN TÍCH NGUỒN GỐC TỪ THUẦN VIỆT & HÁN VIỆT
              </span>
              {puzzle.revealedCorrectWord && (
                <span className="rounded-xl bg-emerald-400 px-4 py-1 text-[21px] font-black text-slate-950">
                  ✓ Đáp án đúng: «{puzzle.revealedCorrectWord}»
                </span>
              )}
            </div>
            <div className="mt-1.5 text-[26px] font-bold leading-snug text-amber-100">{puzzle.explanation}</div>
          </div>
        ))}
    </div>
  );
}

/* ==================== MÀN HÌNH CHUYỂN VÒNG & ĐĂNG QUANG ==================== */

function RoundBoardScreen({ snapshot, weeklyTop }: { snapshot: GameSnapshot; weeklyTop: WeeklyTopEntry[] }) {
  const [lbl1, lbl2] = snapshot.puzzle.choiceLabels || ['1', '2'];
  return (
    <section className="rounded-[32px] border-[3px] border-amber-300/80 bg-slate-950/90 p-8 shadow-2xl">
      <div className="text-center">
        <div className="text-[24px] font-extrabold tracking-widest text-amber-300 uppercase">TỔNG KẾT CHẶNG ĐẤU</div>
        <h2 className="mt-1 text-[42px] font-black text-white">
          Chuẩn bị vào Vòng {snapshot.puzzle.roundIndex + 1}: {snapshot.puzzle.roundLabel}
        </h2>
        <div className="mx-auto mt-3 inline-flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-red-900 to-amber-900 px-6 py-2.5 text-[26px] font-black text-amber-100 shadow-lg">
          <span>📌 LUẬT CHƠI VÒNG {snapshot.puzzle.roundIndex + 1}:</span>
          <span className="text-amber-300">
            BÌNH LUẬN [ {lbl1} ] HOẶC [ {lbl2} ]
          </span>
        </div>
        <div className="mt-2 text-[22px] text-emerald-300">Bắt đầu sau {snapshot.secondsLeft} giây...</div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <div className="col-span-7 rounded-2xl border border-amber-400/35 bg-slate-900/80 p-5">
          <div className="mb-3 text-[24px] font-black text-amber-300">👑 TOP SĨ TỬ VÁN NÀY</div>
          {snapshot.leaderboard.length === 0 ? (
            <div className="py-16 text-center text-[22px] text-slate-400">Hãy bình luận 1 hoặc 2 ở vòng tiếp theo để ghi danh!</div>
          ) : (
            <div className="space-y-2.5">
              {snapshot.leaderboard.slice(0, 7).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-950/80 px-4 py-2.5">
                  <span className="w-9 text-[22px] font-black text-amber-300">#{p.rank}</span>
                  <AvatarBubble name={p.name} avatar={p.avatar} size={40} gold={p.rank <= 3} />
                  <span className="min-w-0 flex-1 truncate text-[22px] font-bold text-white">{p.name}</span>
                  <span className="text-[23px] font-black text-amber-300">{p.score}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-5 rounded-2xl border border-amber-400/35 bg-slate-900/80 p-5">
          <div className="mb-3 text-[24px] font-black text-emerald-300">📅 BẢNG VÀNG TUẦN</div>
          {weeklyTop.length === 0 ? (
            <div className="py-16 text-center text-[20px] text-slate-400">Điểm tích lũy cả tuần sẽ lưu tại đây!</div>
          ) : (
            <div className="space-y-2.5">
              {weeklyTop.slice(0, 6).map((w, idx) => (
                <div key={w.id} className="flex items-center gap-2.5 rounded-xl bg-slate-950/80 px-3.5 py-2.5">
                  <span className="w-7 text-[20px] font-black text-emerald-300">{idx + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-[20px] font-bold text-white">{w.name}</span>
                  <span className="text-[20px] font-black text-amber-300">{w.diem}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PodiumScreen({ snapshot }: { snapshot: GameSnapshot }) {
  const top1 = snapshot.leaderboard[0];
  const top2 = snapshot.leaderboard[1];
  const top3 = snapshot.leaderboard[2];

  return (
    <section
      className="rounded-[32px] border-[3px] border-amber-300 p-8 text-center shadow-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(120,18,18,0.92) 0%, rgba(12,30,36,0.96) 100%)',
      }}
    >
      <div className="text-[24px] font-extrabold tracking-[0.2em] text-amber-300">🎆 LỄ ĐĂNG QUANG VUA CHÍNH TẢ 🎆</div>
      <h2 className="mt-1 text-[46px] font-black text-white">BẢNG VÀNG VINH QUY VÁN #{snapshot.matchNumber}</h2>
      <div className="mt-1 text-[22px] text-amber-200">Ván mới tự động khởi tranh sau {snapshot.secondsLeft} giây</div>

      {/* Bục vinh quang Tam Tài */}
      <div className="mt-8 grid grid-cols-3 items-end gap-4 px-4">
        {/* Hạng 2 */}
        <div className="flex flex-col items-center rounded-t-3xl border-2 border-slate-300/60 bg-slate-900/90 p-5 pt-6">
          <div className="text-[36px]">🥈</div>
          <AvatarBubble name={top2?.name || '-'} avatar={top2?.avatar} size={76} />
          <div className="mt-2 w-full truncate text-[23px] font-black text-white">{top2?.name || 'Chờ anh tài'}</div>
          <div className="text-[18px] font-bold text-slate-300">Trạng Nguyên Quốc Ngữ</div>
          <div className="mt-2 rounded-xl bg-slate-800 px-4 py-1 text-[24px] font-black text-amber-300">{top2?.score || 0}đ</div>
        </div>

        {/* Hạng 1 - Vua Chính Tả */}
        <div className="flex flex-col items-center rounded-t-3xl border-[3px] border-amber-300 bg-gradient-to-b from-amber-500/35 to-red-950/95 p-6 pt-8 shadow-[0_0_40px_rgba(251,191,36,0.35)]">
          <div className="text-[48px]">👑</div>
          <AvatarBubble name={top1?.name || '-'} avatar={top1?.avatar} size={98} gold />
          <div className="mt-3 w-full truncate text-[28px] font-black text-amber-200">{top1?.name || 'Chờ Vua Chính Tả'}</div>
          <div className="text-[20px] font-extrabold text-amber-300">VUA CHÍNH TẢ</div>
          <div className="mt-2 rounded-xl bg-amber-400 px-5 py-1.5 text-[28px] font-black text-slate-950">{top1?.score || 0}đ</div>
        </div>

        {/* Hạng 3 */}
        <div className="flex flex-col items-center rounded-t-3xl border-2 border-amber-700/70 bg-slate-900/90 p-5 pt-6">
          <div className="text-[36px]">🥉</div>
          <AvatarBubble name={top3?.name || '-'} avatar={top3?.avatar} size={76} />
          <div className="mt-2 w-full truncate text-[23px] font-black text-white">{top3?.name || 'Chờ tài tử'}</div>
          <div className="text-[18px] font-bold text-amber-200/80">Bảng Nhãn Tinh Anh</div>
          <div className="mt-2 rounded-xl bg-slate-800 px-4 py-1 text-[24px] font-black text-amber-300">{top3?.score || 0}đ</div>
        </div>
      </div>

      {/* Top 4 -> 7 */}
      {snapshot.leaderboard.length > 3 && (
        <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
          {snapshot.leaderboard.slice(3, 7).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-950/75 px-4 py-2.5 ring-1 ring-amber-300/25">
              <span className="truncate text-[20px] font-bold text-amber-100">
                #{p.rank} {p.name}
              </span>
              <span className="text-[21px] font-black text-amber-300">{p.score}đ</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

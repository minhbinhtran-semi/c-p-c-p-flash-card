export interface RankDetail {
  tierIndex: number;
  tierName: string;
  division: 'III' | 'II' | 'I' | '';
  fullName: string;
  minXp: number;
  maxXp: number;
  badge: string;
  color: string;
  description: string;
  mascotTaunt: string;
  // Backwards compatibility alias
  minRp?: number;
  maxRp?: number;
}

export interface BaseTier {
  name: string;
  badge: string;
  color: string;
  description: string;
  mascotTaunt: string;
}

export const BASE_TIERS: BaseTier[] = [
  {
    name: 'Rẻ Jack',
    badge: '🐣',
    color: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Đáy xã hội cũng là một điểm xuất phát.',
    mascotTaunt: 'Mới ra ràng đã đòi cạp thiên hạ à đại ca?'
  },
  {
    name: 'Chim Bé',
    badge: '🐥',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Có cánh nhưng chưa đủ trình bay.',
    mascotTaunt: 'Cố lên chim non, bay thấp thôi không ngã đau!'
  },
  {
    name: 'Wibu Đáy Xã Hội',
    badge: '🍜',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    description: 'Thuộc tên 300 nhân vật anime nhưng tiếng Anh thì chịu.',
    mascotTaunt: 'Waifu không cứu được điểm thi đâu nha đại ca!'
  },
  {
    name: 'Đồng',
    badge: '🥉',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Mới tập cạp chữ, nghĩa tiếng Anh thấy là quạu.',
    mascotTaunt: 'Đồng Cạp rồi đấy, đừng có nản chí nghe chưa!'
  },
  {
    name: 'Bạc',
    badge: '🥈',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Biết phân biệt danh từ với động từ rồi đấy, ghê nha.',
    mascotTaunt: 'Bạc Cạp sáng loáng, tiến lên Vàng nào!'
  },
  {
    name: 'Vàng',
    badge: '🥇',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Từ vựng bắt đầu vào đầu, không còn trôi tuột như nước đổ lá khoai.',
    mascotTaunt: 'Vàng Cạp chói lọi! Cẩn thận lóa mắt người xem nha.'
  },
  {
    name: 'Bạch Kim',
    badge: '💎',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    description: 'Sử dụng AI Meaning và Sentence trôi chảy như gió.',
    mascotTaunt: 'Bạch Kim Cạp! Trông có vẻ tri thức lắm rồi đấy.'
  },
  {
    name: 'Lục Bảo',
    badge: '🟢',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Ngọc quý giữa rừng từ vựng, sáng lấp lánh.',
    mascotTaunt: 'Xanh mướt như Vườn Nọc, đỉnh của chóp!'
  },
  {
    name: 'Kim Cương',
    badge: '💍',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Thần đồng cạp chữ, nhớ từ như cá nhớ nước.',
    mascotTaunt: 'Kim Cương lấp lánh! Đại ca định soán ngôi Cạp Tổng à?'
  },
  {
    name: 'Chim To',
    badge: '🦅',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Đủ lông đủ cánh. Bắt đầu được phép gáy.',
    mascotTaunt: 'Chim to bay cao, gáy vang trời đất!'
  },
  {
    name: 'Wibu Đỉnh Xã Hội',
    badge: '⚡',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Anime không cần sub, đời không cần ai chỉ.',
    mascotTaunt: 'Học tiếng Anh đỉnh cao nhờ cày sub Nhật!'
  },
  {
    name: 'Bố Đời',
    badge: '👑',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Ngữ pháp gặp đại ca cũng phải né.',
    mascotTaunt: 'Nghe danh Bố Đời, từ điển cũng phải quỳ gối!'
  },
  {
    name: 'Vua Ngôn Ngữ',
    badge: '📚',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Oxford nhìn vào phải nể ba phần.',
    mascotTaunt: 'Vua Ngôn Ngữ đây rồi, ai dám đối đầu?'
  },
  {
    name: 'Đứng Đầu Chuỗi Thức Ăn',
    badge: '🦈',
    color: 'bg-teal-100 text-teal-900 border-teal-400',
    description: 'Không ai săn nổi con bọ cạp này.',
    mascotTaunt: 'Đứng đầu chuỗi thức ăn, cạp sạch bách mọi từ vựng!'
  },
  {
    name: 'Đại Đế Cạp Cạp',
    badge: '🦖',
    color: 'bg-emerald-900 text-amber-300 border-amber-400',
    description: 'Đỉnh cao tiến hóa. Cạp một phát, cả từ điển run rẩy.',
    mascotTaunt: 'Đại Đế vạn tuế! Cạp phát nào rúng động giang hồ phát đấy!'
  }
];

// Configuration parameters
export const INITIAL_DIVISION_XP = 150;
export const XP_INCREMENT_PER_TIER = 40;
export const DIVISIONS_PER_TIER = 3;

/**
 * Returns the XP width of each division for a tier (0 to 13).
 * Tier 0 (Rẻ Jack): 150 XP
 * Tier 1 (Chim Bé): 190 XP
 * ...
 */
export function getTierDivisionWidth(tierIndex: number): number {
  if (tierIndex < 0 || tierIndex >= 14) return 0;
  return INITIAL_DIVISION_XP + tierIndex * XP_INCREMENT_PER_TIER;
}

// Precomputed tier thresholds for fast lookups
interface InternalDivisionInfo {
  tierIndex: number;
  tierName: string;
  division: 'III' | 'II' | 'I' | '';
  fullName: string;
  minXp: number;
  maxXp: number;
  divisionWidth: number;
}

const PRECOMPUTED_DIVISIONS: InternalDivisionInfo[] = [];
let accumulatedXp = 0;

for (let t = 0; t < 14; t++) {
  const width = getTierDivisionWidth(t);
  const divs: Array<'III' | 'II' | 'I'> = ['III', 'II', 'I'];
  for (let d = 0; d < 3; d++) {
    const minXp = accumulatedXp;
    const maxXp = minXp + width - 1;
    PRECOMPUTED_DIVISIONS.push({
      tierIndex: t,
      tierName: BASE_TIERS[t].name,
      division: divs[d],
      fullName: `${BASE_TIERS[t].name} ${divs[d]}`,
      minXp,
      maxXp,
      divisionWidth: width,
    });
    accumulatedXp += width;
  }
}

// Đại Đế Cạp Cạp threshold
export const MAX_TIER_XP_THRESHOLD = accumulatedXp; // 17,220 XP

/**
 * Calculates rank directly from lifetime Nọc XP.
 * New player at 0 XP starts at Rẻ Jack III.
 */
export function getRankFromXP(xp: number): RankDetail {
  const safeXp = Math.max(0, Math.round(xp || 0));

  // Top tier: Đại Đế Cạp Cạp
  if (safeXp >= MAX_TIER_XP_THRESHOLD) {
    const topTier = BASE_TIERS[14];
    return {
      tierIndex: 14,
      tierName: topTier.name,
      division: '',
      fullName: topTier.name,
      minXp: MAX_TIER_XP_THRESHOLD,
      maxXp: 9999999,
      badge: topTier.badge,
      color: topTier.color,
      description: topTier.description,
      mascotTaunt: topTier.mascotTaunt,
      minRp: MAX_TIER_XP_THRESHOLD,
      maxRp: 9999999,
    };
  }

  // Find division in precomputed ranges
  const found = PRECOMPUTED_DIVISIONS.find(
    (div) => safeXp >= div.minXp && safeXp <= div.maxXp
  ) || PRECOMPUTED_DIVISIONS[0];

  const tier = BASE_TIERS[found.tierIndex];

  return {
    tierIndex: found.tierIndex,
    tierName: tier.name,
    division: found.division,
    fullName: found.fullName,
    minXp: found.minXp,
    maxXp: found.maxXp,
    badge: tier.badge,
    color: tier.color,
    description: tier.description,
    mascotTaunt: tier.mascotTaunt,
    minRp: found.minXp,
    maxRp: found.maxXp,
  };
}

/**
 * Returns progression details within the current division.
 */
export function getRankProgressInfo(xp: number) {
  const safeXp = Math.max(0, Math.round(xp || 0));
  const currentRank = getRankFromXP(safeXp);

  if (currentRank.tierIndex >= 14) {
    return {
      currentRank,
      nextRankName: 'Đỉnh cao tối thượng',
      xpEarnedInDivision: safeXp - MAX_TIER_XP_THRESHOLD,
      xpNeededForNextDivision: 0,
      totalDivisionWidth: 0,
      percentProgress: 100,
      isMaxTier: true,
    };
  }

  const earnedInDivision = safeXp - currentRank.minXp;
  const totalDivisionWidth = currentRank.maxXp - currentRank.minXp + 1;
  const xpNeeded = Math.max(0, totalDivisionWidth - earnedInDivision);
  const percentProgress = Math.min(
    100,
    Math.max(0, Math.round((earnedInDivision / totalDivisionWidth) * 100))
  );

  const nextRankName = getNextRank(safeXp);

  return {
    currentRank,
    nextRankName,
    xpEarnedInDivision: earnedInDivision,
    xpNeededForNextDivision: xpNeeded,
    totalDivisionWidth,
    percentProgress,
    isMaxTier: false,
  };
}

/**
 * Percentage progress in current division (0 - 100).
 */
export function getDivisionProgress(xp: number): number {
  return getRankProgressInfo(xp).percentProgress;
}

/**
 * Returns next rank name.
 */
export function getNextRank(xp: number): string {
  const current = getRankFromXP(xp);
  if (current.tierIndex >= 14) return 'Đỉnh cao tối thượng';
  if (current.division === 'III') return `${current.tierName} II`;
  if (current.division === 'II') return `${current.tierName} I`;
  const nextTier = BASE_TIERS[current.tierIndex + 1];
  return nextTier ? (nextTier.name === 'Đại Đế Cạp Cạp' ? nextTier.name : `${nextTier.name} III`) : 'Đại Đế Cạp Cạp';
}

/**
 * Returns XP needed for the next division.
 */
export function getXPRequiredForPromotion(xp: number): number {
  return getRankProgressInfo(xp).xpNeededForNextDivision;
}

/**
 * Returns all ranks across the ladder.
 */
export function getAllRanks(): RankDetail[] {
  const ranks: RankDetail[] = PRECOMPUTED_DIVISIONS.map((div) => {
    const tier = BASE_TIERS[div.tierIndex];
    return {
      tierIndex: div.tierIndex,
      tierName: tier.name,
      division: div.division,
      fullName: div.fullName,
      minXp: div.minXp,
      maxXp: div.maxXp,
      badge: tier.badge,
      color: tier.color,
      description: tier.description,
      mascotTaunt: tier.mascotTaunt,
      minRp: div.minXp,
      maxRp: div.maxXp,
    };
  });

  const topTier = BASE_TIERS[14];
  ranks.push({
    tierIndex: 14,
    tierName: topTier.name,
    division: '',
    fullName: topTier.name,
    minXp: MAX_TIER_XP_THRESHOLD,
    maxXp: 9999999,
    badge: topTier.badge,
    color: topTier.color,
    description: topTier.description,
    mascotTaunt: topTier.mascotTaunt,
    minRp: MAX_TIER_XP_THRESHOLD,
    maxRp: 9999999,
  });

  return ranks;
}

// Backwards compatibility aliases during transition
export const getRankFromRP = getRankFromXP;
export const getRPRequiredForPromotion = getXPRequiredForPromotion;

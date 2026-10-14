export interface RankDetail {
  tierIndex: number;
  tierName: string;
  division: 'III' | 'II' | 'I' | '';
  fullName: string;
  minXp: number;
  maxXp: number;
  minRp?: number;
  maxRp?: number;
  badge: string;
  color: string;
  description: string;
  mascotTaunt: string;
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

export function getAllRanks(): RankDetail[] {
  const ranks: RankDetail[] = [];
  let cumulativeXp = 0;

  for (let i = 0; i < 14; i++) {
    const tier = BASE_TIERS[i];
    const divisionWidth = 150 + i * 40;
    const divs: Array<'III' | 'II' | 'I'> = ['III', 'II', 'I'];
    divs.forEach((div) => {
      const minXp = cumulativeXp;
      const maxXp = minXp + divisionWidth - 1;
      ranks.push({
        tierIndex: i,
        tierName: tier.name,
        division: div,
        fullName: `${tier.name} ${div}`,
        minXp,
        maxXp,
        minRp: minXp,
        maxRp: maxXp,
        badge: tier.badge,
        color: tier.color,
        description: tier.description,
        mascotTaunt: tier.mascotTaunt,
      });
      cumulativeXp += divisionWidth;
    });
  }

  // 15th tier: Đại Đế Cạp Cạp
  const topTier = BASE_TIERS[14];
  const minXp = cumulativeXp;
  ranks.push({
    tierIndex: 14,
    tierName: topTier.name,
    division: '',
    fullName: topTier.name,
    minXp,
    maxXp: 999999,
    minRp: minXp,
    maxRp: 999999,
    badge: topTier.badge,
    color: topTier.color,
    description: topTier.description,
    mascotTaunt: topTier.mascotTaunt,
  });

  return ranks;
}

export function getRankFromXP(totalXP: number): RankDetail {
  const safeXp = Math.max(0, totalXP);
  const ranks = getAllRanks();
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (safeXp >= ranks[i].minXp) {
      return ranks[i];
    }
  }
  return ranks[0];
}

// Compatibility alias for old RP calls
export function getRankFromRP(rp: number): RankDetail {
  return getRankFromXP(rp);
}

export function getDivisionProgress(xp: number): number {
  const safeXp = Math.max(0, xp);
  const current = getRankFromXP(safeXp);
  if (current.tierIndex >= 14) return 100;
  const divisionWidth = 150 + current.tierIndex * 40;
  const xpIntoDivision = safeXp - current.minXp;
  return Math.min(100, Math.max(0, (xpIntoDivision / divisionWidth) * 100));
}

export function getNextRank(xp: number): string {
  const current = getRankFromXP(xp);
  if (current.tierIndex >= 14) return 'Đỉnh cao tối thượng';
  if (current.division === 'III') return `${current.tierName} II`;
  if (current.division === 'II') return `${current.tierName} I`;
  const nextTier = BASE_TIERS[current.tierIndex + 1];
  return nextTier ? `${nextTier.name} III` : 'Đại Đế Cạp Cạp';
}

export function getXPRequiredForPromotion(xp: number): number {
  const safeXp = Math.max(0, xp);
  const current = getRankFromXP(safeXp);
  if (current.tierIndex >= 14) return 0;
  const divisionWidth = 150 + current.tierIndex * 40;
  const xpIntoDivision = safeXp - current.minXp;
  return Math.max(0, divisionWidth - xpIntoDivision);
}

export function getRPRequiredForPromotion(rp: number): number {
  return getXPRequiredForPromotion(rp);
}

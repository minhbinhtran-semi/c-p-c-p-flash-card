import { getRankFromXP } from '../services/rank';
import type { LeaderboardEntry } from '../types';

interface DemoSeed {
  id: string;
  nickname: string;
  xp: number;
  streakDays: number;
  wordsLearned: number;
  avatarUrl: string;
  quote: string;
}

const DEMO_SEEDS: DemoSeed[] = [
  {
    id: 'demo_user_01',
    nickname: 'Oxford Khóc Thét',
    xp: 14850,
    streakDays: 45,
    wordsLearned: 380,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=OxfordKhocThet&backgroundColor=b6e3f4',
    quote: 'Mỗi ngày cạp 50 từ, từ điển nhìn thấy là quỳ rạp.',
  },
  {
    id: 'demo_user_02',
    nickname: 'Cạp Bất Bại',
    xp: 12620,
    streakDays: 38,
    wordsLearned: 320,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CapBatBai&backgroundColor=c0aede',
    quote: 'Chưa từng nếm mùi quên từ vựng nào cả!',
  },
  {
    id: 'demo_user_03',
    nickname: 'Chim To Không Sợ Gió',
    xp: 9480,
    streakDays: 29,
    wordsLearned: 260,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChimToKhongSoGio&backgroundColor=d1d4f9',
    quote: 'Đủ lông đủ cánh rồi, giờ là lúc bay thẳng lên đỉnh cao.',
  },
  {
    id: 'demo_user_04',
    nickname: 'Wibu Biết Grammar',
    xp: 7250,
    streakDays: 24,
    wordsLearned: 210,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=WibuBietGrammar&backgroundColor=ffd5dc',
    quote: 'Xem anime không sub và luyện từ vựng mỗi ngày.',
  },
  {
    id: 'demo_user_05',
    nickname: 'Cú Đêm Luyện IELTS',
    xp: 5850,
    streakDays: 19,
    wordsLearned: 185,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CuDemLuyenIELTS&backgroundColor=ffdfbf',
    quote: 'Ngủ lúc 3h sáng để nạp từ vựng chuyên ngành.',
  },
  {
    id: 'demo_user_06',
    nickname: 'Nuốt Trọn Từ Điển',
    xp: 4320,
    streakDays: 15,
    wordsLearned: 150,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NuotTronTuDien&backgroundColor=c0aede',
    quote: 'Từ dài mấy chữ cũng bị tôi cạp sạch sành sanh.',
  },
  {
    id: 'demo_user_07',
    nickname: 'Bố Đời Hàng Xóm',
    xp: 3210,
    streakDays: 12,
    wordsLearned: 120,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BoDoiHangXom&backgroundColor=b6e3f4',
    quote: 'Nghe danh Cạp Tổng đã lâu, nay mới vào gáy thử.',
  },
  {
    id: 'demo_user_08',
    nickname: 'Thánh Tra Từ',
    xp: 2650,
    streakDays: 10,
    wordsLearned: 95,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThanhTraTu&backgroundColor=d1d4f9',
    quote: 'Quên từ nào là lôi Sổ Nhục ra xử ngay từ đó.',
  },
  {
    id: 'demo_user_09',
    nickname: 'Càng Vàng Cạp Chữ',
    xp: 1850,
    streakDays: 8,
    wordsLearned: 75,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CangVangCapChu&backgroundColor=ffdfbf',
    quote: 'Đang leo rank chăm chỉ, hẹn ngày gặp nhau ở Top 3.',
  },
  {
    id: 'demo_user_10',
    nickname: 'Tay Nhanh Hơn Não',
    xp: 1250,
    streakDays: 6,
    wordsLearned: 55,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TayNhanhHonNao&backgroundColor=ffd5dc',
    quote: 'Lật flashcard nhanh như chớp, nhớ được bao nhiêu hay bấy nhiêu!',
  },
  {
    id: 'demo_user_11',
    nickname: 'Bậc Thầy Flashcard',
    xp: 820,
    streakDays: 4,
    wordsLearned: 40,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BacThayFlashcard&backgroundColor=b6e3f4',
    quote: 'Lật thẻ cả ngày không biết chán, mục tiêu là Chim Bé I.',
  },
  {
    id: 'demo_user_12',
    nickname: 'Cạp Con Mới Nhú',
    xp: 350,
    streakDays: 2,
    wordsLearned: 20,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CapConMoiNhu&backgroundColor=d1d4f9',
    quote: 'Mới thoát kiếp Rẻ Jack III, đang ráng bay lên Chim Bé!',
  },
];

/**
 * Builds deterministic LeaderboardEntry list with rank details calculated
 * directly by the authoritative XP rank engine (src/services/rank.ts).
 */
export function generateDemoLeaderboard(): LeaderboardEntry[] {
  const sorted = [...DEMO_SEEDS].sort((a, b) => b.xp - a.xp);

  return sorted.map((seed, index) => {
    const rankInfo = getRankFromXP(seed.xp);
    return {
      id: seed.id,
      rankPosition: index + 1,
      nickname: seed.nickname,
      avatarUrl: seed.avatarUrl,
      xp: seed.xp,
      rp: seed.xp, // backward compatibility
      streakDays: seed.streakDays,
      wordsLearned: seed.wordsLearned,
      tierIndex: rankInfo.tierIndex,
      tierName: rankInfo.tierName,
      division: rankInfo.division,
      fullName: rankInfo.fullName,
      badge: rankInfo.badge,
      color: rankInfo.color,
      quote: seed.quote,
      isDemo: true,
    };
  });
}

/**
 * Lightweight data provider for the leaderboard.
 */
export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  return generateDemoLeaderboard();
}

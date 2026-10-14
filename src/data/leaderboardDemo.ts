import { getRankFromXP } from '../services/rank';
import type { LeaderboardEntry } from '../types';

interface DemoSeed {
  id: string;
  nickname: string;
  xp: number;
  streakDays: number;
  avatarUrl: string;
  quote: string;
}

const DEMO_SEEDS: DemoSeed[] = [
  {
    id: 'demo_user_01',
    nickname: 'Oxford Khóc Thét',
    xp: 4500,
    streakDays: 45,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=OxfordKhocThet&backgroundColor=b6e3f4',
    quote: 'Mỗi ngày cạp 50 từ, từ điển nhìn thấy là quỳ rạp.',
  },
  {
    id: 'demo_user_02',
    nickname: 'Cạp Bất Bại',
    xp: 3800,
    streakDays: 32,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CapBatBai&backgroundColor=c0aede',
    quote: 'Chưa từng nếm mùi sai câu trắc nghiệm nào cả!',
  },
  {
    id: 'demo_user_03',
    nickname: 'Chim To Không Sợ Gió',
    xp: 3100,
    streakDays: 28,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChimToKhongSoGio&backgroundColor=d1d4f9',
    quote: 'Đủ lông đủ cánh rồi, giờ là lúc bay thẳng lên đỉnh cao.',
  },
  {
    id: 'demo_user_04',
    nickname: 'Wibu Biết Grammar',
    xp: 2500,
    streakDays: 21,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=WibuBietGrammar&backgroundColor=ffd5dc',
    quote: 'Xem anime không sub và luyện đề tiếng Anh cùng lúc.',
  },
  {
    id: 'demo_user_05',
    nickname: 'Cú Đêm Luyện IELTS',
    xp: 1950,
    streakDays: 15,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CuDemLuyenIELTS&backgroundColor=ffdfbf',
    quote: 'Ngủ lúc 3h sáng để nạp từ vựng chuyên ngành.',
  },
  {
    id: 'demo_user_06',
    nickname: 'Nuốt Trọn Từ Điển',
    xp: 1400,
    streakDays: 12,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NuotTronTuDien&backgroundColor=c0aede',
    quote: 'Từ dài mấy chữ cũng bị tôi cạp sạch sành sanh.',
  },
  {
    id: 'demo_user_07',
    nickname: 'Bố Đời Hàng Xóm',
    xp: 980,
    streakDays: 9,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BoDoiHangXom&backgroundColor=b6e3f4',
    quote: 'Nghe danh Cạp Tổng đã lâu, nay mới vào gáy thử.',
  },
  {
    id: 'demo_user_08',
    nickname: 'Thánh Tra Từ',
    xp: 720,
    streakDays: 7,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThanhTraTu&backgroundColor=d1d4f9',
    quote: 'Quên từ nào là lôi Sổ Nhục ra xử ngay từ đó.',
  },
  {
    id: 'demo_user_09',
    nickname: 'Càng Vàng Cạp Chữ',
    xp: 500,
    streakDays: 5,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CangVangCapChu&backgroundColor=ffdfbf',
    quote: 'Đang leo rank chăm chỉ, hẹn ngày gặp nhau ở Top 3.',
  },
  {
    id: 'demo_user_10',
    nickname: 'Tay Nhanh Hơn Não',
    xp: 350,
    streakDays: 4,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TayNhanhHonNao&backgroundColor=ffd5dc',
    quote: 'Bấm đáp án nhanh như chớp, trúng trượt tính sau!',
  },
  {
    id: 'demo_user_11',
    nickname: 'Bậc Thầy Flashcard',
    xp: 200,
    streakDays: 2,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BacThayFlashcard&backgroundColor=b6e3f4',
    quote: 'Lật thẻ cả ngày không biết chán, mục tiêu là Bạc I.',
  },
  {
    id: 'demo_user_12',
    nickname: 'Cạp Con Mới Nhú',
    xp: 50,
    streakDays: 1,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CapConMoiNhu&backgroundColor=d1d4f9',
    quote: 'Mới thoát kiếp Rẻ Jack, đang ráng bay lên Chim Bé!',
  },
];

export function generateDemoLeaderboard(sortBy: 'xp' | 'streak' = 'xp'): LeaderboardEntry[] {
  const sorted = [...DEMO_SEEDS].sort((a, b) => {
    if (sortBy === 'streak') {
      return b.streakDays - a.streakDays;
    }
    return b.xp - a.xp;
  });

  return sorted.map((seed, index) => {
    const rankInfo = getRankFromXP(seed.xp);
    return {
      id: seed.id,
      rankPosition: index + 1,
      nickname: seed.nickname,
      avatarUrl: seed.avatarUrl,
      xp: seed.xp,
      streakDays: seed.streakDays,
      rp: seed.xp, // compatibility
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

export async function getLeaderboardEntries(sortBy: 'xp' | 'streak' = 'xp'): Promise<LeaderboardEntry[]> {
  return generateDemoLeaderboard(sortBy);
}

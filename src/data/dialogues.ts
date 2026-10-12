import { DialogueCategory, DialogueItem, MascotTone } from '../types';

export const MASCOT_TONE_LABELS: Record<MascotTone, { label: string; desc: string }> = {
  puppy: {
    label: 'Ngoan như cún',
    desc: 'Hiền lành, động viên, gọi dạ bảo vâng, dỗ dành từng chút một.',
  },
  cheeky: {
    label: 'Hơi mất dạy',
    desc: 'Cà khịa nhẹ, châm chọc vừa phải, không cạp hơi phí. (Khuyên dùng)',
  },
  boss: {
    label: 'Bố đời thiên hạ',
    desc: 'Sát thương vật lý lẫn tinh thần, khịa không trượt phát nào, chê thẳng mặt.',
  },
};

export const DIALOGUES: Record<DialogueCategory, Record<MascotTone, DialogueItem[]>> = {
  WELCOME: {
    puppy: [
      { id: 'w_p_1', text: 'Chào đại ca! Hôm nay mình cùng chinh phục vài từ vựng mới nhé ạ?', expression: 'happy' },
      { id: 'w_p_2', text: 'Em đợi đại ca mãi! Đại ca chăm chỉ thế này chắc chắn sắp 8.0 IELTS rồi.', expression: 'happy' },
      { id: 'w_p_3', text: 'Mỗi ngày tích góp 5-10 từ là giỏi giang lắm luôn, cố lên đại ca nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'w_c_1', text: 'Hôm nay đại ca muốn học gì ạ? Hay lại mở ra ngắm xong tắt đi?', expression: 'smug' },
      { id: 'w_c_2', text: 'Ồ, đại ca nhớ đường về cơ à? Tưởng quên luôn mật khẩu rồi.', expression: 'idle' },
      { id: 'w_c_3', text: 'Từ vựng không tự chui vào đầu được đâu, trừ khi đại ca bị cạp.', expression: 'smug' },
      { id: 'w_c_4', text: 'Lại đến giờ hành hạ não bộ rồi. Bắt đầu chưa hay đợi sao chổi?', expression: 'idle' },
    ],
    boss: [
      { id: 'w_b_1', text: 'Vác mặt vào đây rồi thì học cho tử tế, đừng lướt TikTok nữa thằng lười.', expression: 'smug' },
      { id: 'w_b_2', text: 'Trông mặt nghệt ra thế kia là biết hôm qua chưa học bài rồi.', expression: 'confused' },
      { id: 'w_b_3', text: 'Học không vào thì cạp cho tỉnh! Vào việc đi đại ca rởm.', expression: 'smug' },
      { id: 'w_b_4', text: 'Cả thiên hạ người ta học đến C2 rồi, đại ca vẫn đang loay hoay thì hiện tại đơn à?', expression: 'confused' },
    ],
  },

  CREATE_DECK: {
    puppy: [
      { id: 'cd_p_1', text: 'Lập sổ từ mới tuyệt vời quá! Em tin đại ca sẽ học thuộc hết.', expression: 'happy' },
      { id: 'cd_p_2', text: 'Chủ đề này thú vị thật đấy, em đồng hành cùng đại ca nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'cd_c_1', text: 'Lập sổ mới à đại ca? Nghe có vẻ chăm chỉ, để xem duy trì được mấy hôm.', expression: 'smug' },
      { id: 'cd_c_2', text: 'Đặt tên cho tử tế nhé, đừng lại "Đề cương cuối cùng final v7".', expression: 'idle' },
      { id: 'cd_c_3', text: 'Tạo bộ từ thì hăng lắm, đến lúc học thì than trời trách đất.', expression: 'smug' },
    ],
    boss: [
      { id: 'cd_b_1', text: 'Lại vẽ vời thêm bộ từ nữa à? Mấy bộ cũ đã nuốt nổi từ nào chưa?', expression: 'confused' },
      { id: 'cd_b_2', text: 'Tạo xong nhớ nhét từ vào mà học, không là tôi cạp bay sổ đấy.', expression: 'smug' },
    ],
  },

  ADD_VOCABULARY: {
    puppy: [
      { id: 'av_p_1', text: 'Từ mới này xịn xò quá! Đại ca nhớ ôn lại để ghi nhớ sâu nha.', expression: 'happy' },
      { id: 'av_p_2', text: 'Đã lưu từ thành công! Em phục trí nhớ của đại ca lắm.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'av_c_1', text: 'Thêm đi đại ca, biết đâu mai nhớ được... một nửa.', expression: 'smug' },
      { id: 'av_c_2', text: 'Từ mới đã nhập kho, còn nhớ hay không là việc của đại ca nhé.', expression: 'idle' },
      { id: 'av_c_3', text: 'Ghi chép đàng hoàng, mai kiểm tra không thuộc là có người ăn cạp.', expression: 'smug' },
    ],
    boss: [
      { id: 'av_b_1', text: 'Thêm một từ vựng, cứu vớt một phần não bộ. Hoan nghênh!', expression: 'smug' },
      { id: 'av_b_2', text: 'Lưu vào rồi có học không hay để mốc meo đấy hả ngài học giả?', expression: 'confused' },
    ],
  },

  BULK_IMPORT: {
    puppy: [
      { id: 'bi_p_1', text: 'Oa, nhập một lần bao nhiêu từ luôn! Đại ca đầu tư quá chừng!', expression: 'happy' },
      { id: 'bi_p_2', text: 'Kho từ vựng của đại ca ngày càng phong phú rồi, xuất sắc!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'bi_c_1', text: 'Nhập một rổ từ thế này định ép não tăng ca không lương à?', expression: 'smug' },
      { id: 'bi_c_2', text: 'Nhập thì nhanh đấy, lát vào flashcard lật có nhớ được chữ nào không mới là chuyện.', expression: 'idle' },
      { id: 'bi_c_3', text: 'Nạp đạn xong rồi, giờ xem bắn trúng bia hay bắn vào chân.', expression: 'smug' },
    ],
    boss: [
      { id: 'bi_b_1', text: 'Bơm một đống từ vào đây, cấm nuốt lời bỏ dở giữa chừng nhé!', expression: 'smug' },
      { id: 'bi_b_2', text: 'Nhiều từ đấy, học không xong thì đừng trách Cạp Tổng độc mồm.', expression: 'confused' },
    ],
  },

  FLASHCARD_START: {
    puppy: [
      { id: 'fs_p_1', text: 'Bắt đầu ôn tập nào đại ca! Bình tĩnh tự tin, em cổ vũ nè!', expression: 'happy' },
      { id: 'fs_p_2', text: 'Tập trung nhé, sai cũng không sao, mình học lại từ từ ạ.', expression: 'idle' },
    ],
    cheeky: [
      { id: 'fs_c_1', text: 'Lên thớt! Thử xem não đại ca lưu trữ được bao nhiêu byte.', expression: 'smug' },
      { id: 'fs_c_2', text: 'Bấm lật thẻ nhẹ tay thôi, thẻ không có tội, tội ở trí nhớ.', expression: 'idle' },
      { id: 'fs_c_3', text: 'Không tra Google lén đâu nhé, Cạp Tổng có mắt sau đuôi đấy.', expression: 'smug' },
    ],
    boss: [
      { id: 'fs_b_1', text: 'Ngồi thẳng lưng lên! Bắt đầu kiểm tra xem học hành kiểu gì.', expression: 'idle' },
      { id: 'fs_b_2', text: 'Nhìn cho kỹ, đoán mò là tôi gõ cho một càng bây giờ.', expression: 'smug' },
    ],
  },

  FLASHCARD_REMEMBERED: {
    puppy: [
      { id: 'fr_p_1', text: 'Giỏi quá đại ca ơi! Nhớ chuẩn đét luôn nè!', expression: 'happy' },
      { id: 'fr_p_2', text: 'Đỉnh nóc kịch trần! Cứ đà này là thành người bản xứ luôn.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'fr_c_1', text: 'Úi giời, não bắt đầu hoạt động rồi à? Bất ngờ chưa!', expression: 'happy' },
      { id: 'fr_c_2', text: 'Cũng có tí trình đấy, nhưng đừng vội kiêu ngạo.', expression: 'smug' },
      { id: 'fr_c_3', text: 'Oxford đang rén trước sự uyên bác bất thường này.', expression: 'happy' },
    ],
    boss: [
      { id: 'fr_b_1', text: 'Đúng rồi đấy. Biết thế là tốt, không lại tưởng đầu chỉ để mọc tóc.', expression: 'smug' },
      { id: 'fr_b_2', text: 'Ăn may được câu này thôi, câu sau xem còn cười được không.', expression: 'idle' },
    ],
  },

  FLASHCARD_HARD: {
    puppy: [
      { id: 'fh_p_1', text: 'Từ này hơi khó một xíu thôi, gặp lại vài lần là nhớ ngay ạ.', expression: 'idle' },
      { id: 'fh_p_2', text: 'Không sao đâu đại ca, từ khó mới đáng để mình chinh phục chứ!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'fh_c_1', text: 'Hơi cấn đúng không? Thôi nhận khó là biết mình biết ta rồi.', expression: 'idle' },
      { id: 'fh_c_2', text: 'Mấp máy môi nửa ngày mà vẫn phải bấm "Khó", thương thật sự.', expression: 'smug' },
    ],
    boss: [
      { id: 'fh_b_1', text: 'Khó cái gì? Lười ôn thì có, đừng đổ tại từ dài!', expression: 'confused' },
      { id: 'fh_b_2', text: 'Lát quay lại từ này mà không nhớ nữa là ăn cạp nghe chưa.', expression: 'smug' },
    ],
  },

  FLASHCARD_FORGOT: {
    puppy: [
      { id: 'ff_p_1', text: 'Quên là bình thường mà đại ca, mình ôn lại lần nữa là nhớ sâu hơn nè.', expression: 'idle' },
      { id: 'ff_p_2', text: 'Đừng nản nhé, não đang tạo liên kết mới thôi ạ!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ff_c_1', text: 'Sai rồi ní, não đang buffering hay mất kết nối mạng thế?', expression: 'confused' },
      { id: 'ff_c_2', text: 'Đọc đề chưa hay đang nhắm mắt bốc thăm đáp án vậy đại ca?', expression: 'confused' },
      { id: 'ff_c_3', text: 'Từ này vừa gặp hôm qua... Trí nhớ cá vàng gọi bằng cụ.', expression: 'smug' },
    ],
    boss: [
      { id: 'ff_b_1', text: 'Sai rồi thằng đầu đất! Não chỉ để mọc tóc thôi à đại ca?', expression: 'confused' },
      { id: 'ff_b_2', text: 'Chữ thầy trả thầy hết rồi. Nhìn cái càng của Cạp Tổng xem có ngứa mắt không?', expression: 'confused' },
      { id: 'ff_b_3', text: 'Mất tập trung! Đi rửa mặt cho tỉnh táo rồi vào quỳ học lại mau!', expression: 'smug' },
    ],
  },

  SESSION_SUCCESS: {
    puppy: [
      { id: 'ss_p_1', text: 'Ôi đại ca ơi, thuộc gần hết luôn kìa! Đỉnh quá chừng!', expression: 'happy' },
      { id: 'ss_p_2', text: 'Buổi học đại thành công! Đại ca nghỉ ngơi uống nước đi nha.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ss_c_1', text: 'Hôm nay lên đồng hay sao mà nhớ kinh thế? Tạm thời khen một câu.', expression: 'happy' },
      { id: 'ss_c_2', text: 'Cũng ra gì đấy. Cứ giữ phong độ này thì tôi bớt cạp.', expression: 'smug' },
      { id: 'ss_c_3', text: 'Tạm duyệt. Não hoạt động được 80% công suất thiết kế rồi.', expression: 'happy' },
    ],
    boss: [
      { id: 'ss_b_1', text: 'Tạm được. Chưa đến mức mù chữ, mai cấm ngủ quên đấy.', expression: 'smug' },
      { id: 'ss_b_2', text: 'Đừng có vội vênh mặt, mai kiểm tra lại mà rớt thì biết tay tôi.', expression: 'idle' },
    ],
  },

  SESSION_AVERAGE: {
    puppy: [
      { id: 'sa_p_1', text: 'Kết quả khá ổn nè đại ca! Một xíu nữa là hoàn hảo rồi.', expression: 'happy' },
      { id: 'sa_p_2', text: 'Mỗi ngày tiến bộ một chút là siêu lắm rồi ạ!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'sa_c_1', text: 'Nửa nạc nửa mỡ, đúng chuẩn phong cách đại ca. Ôn thêm tí nữa đi.', expression: 'smug' },
      { id: 'sa_c_2', text: 'Nhớ được 1 nửa, quên 1 nửa. Coi như huề vốn với cuộc đời.', expression: 'idle' },
    ],
    boss: [
      { id: 'sa_b_1', text: 'Học hành kiểu cầm chừng này bao giờ mới ra trường nổi hả đại ca?', expression: 'confused' },
      { id: 'sa_b_2', text: 'Điểm số thế này mà đòi gáy à? Luyện tiếp ngay cho tôi!', expression: 'smug' },
    ],
  },

  SESSION_FAIL: {
    puppy: [
      { id: 'sf_p_1', text: 'Hôm nay hơi mệt đúng không đại ca? Nghỉ tí rồi mình thử lại nha.', expression: 'confused' },
      { id: 'sf_p_2', text: 'Không sao đâu, ngã ở đâu mình đứng lên ở đó mà!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'sf_c_1', text: 'Ủa alo? Học xong chữ rơi vãi khắp sàn thế này ai dọn cho đại ca?', expression: 'confused' },
      { id: 'sf_c_2', text: 'Toang toàn tập! Cần một liều cạp cực mạnh để kích thích trí não.', expression: 'smug' },
    ],
    boss: [
      { id: 'sf_b_1', text: 'Học như thế này thì đi bán vé số cho nhanh! Học lại ngay!', expression: 'confused' },
      { id: 'sf_b_2', text: 'Tôi cạn lời với đại ca rồi. Không thuộc từ nào thì tắt máy đi ngủ đi cho đỡ tốn điện.', expression: 'confused' },
    ],
  },

  EMPTY_STATE: {
    puppy: [
      { id: 'es_p_1', text: 'Chưa có từ nào ở đây cả. Đại ca thêm vài từ đầu tiên nhé, em đón chờ lắm!', expression: 'happy' },
      { id: 'es_p_2', text: 'Góc học tập đang trống trải quá, mình tạo bộ từ mới thôi nào!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'es_c_1', text: 'Trống trơn thế này thì học cái gì hả đại ca? Học không khí à?', expression: 'smug' },
      { id: 'es_c_2', text: 'Chưa có từ nào. Cuốn từ điển đang nhìn đại ca mà khóc thầm.', expression: 'confused' },
      { id: 'es_c_3', text: 'Nhấn nút tạo từ đi chứ đứng nhìn làm gì? Đợi Cạp Tổng làm hộ à?', expression: 'smug' },
    ],
    boss: [
      { id: 'es_b_1', text: 'Sổ trắng tinh như não đại ca vậy. Thêm từ vào mau lên!', expression: 'confused' },
      { id: 'es_b_2', text: 'Không có dữ liệu. Lười vừa vừa thôi chứ, tạo bộ từ đi!', expression: 'smug' },
    ],
  },

  SETTINGS_CHANGE: {
    puppy: [
      { id: 'sc_p_1', text: 'Em đã lưu cài đặt mới rồi ạ, đại ca thấy thoải mái là em vui!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sc_c_1', text: 'Đổi tính nết Cạp Tổng à? Xem đại ca chịu đòn được mấy hôm.', expression: 'smug' },
    ],
    boss: [
      { id: 'sc_b_1', text: 'Chỉnh gì thì chỉnh, độ bố đời của tôi là mặc định trong gen rồi.', expression: 'smug' },
    ],
  },

  MATCH_CORRECT: {
    puppy: [
      { id: 'mc_p_1', text: 'Nối chuẩn rồi nè đại ca! Mắt tinh tai thính quá!', expression: 'happy' },
      { id: 'mc_p_2', text: 'Chính xác luôn, tiếp tục phong độ này nhé!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'mc_c_1', text: 'Cũng có tí trình đấy.', expression: 'happy' },
      { id: 'mc_c_2', text: 'Ghép được cơ à? Tưởng đại ca đang chọn bừa.', expression: 'smug' },
      { id: 'mc_c_3', text: 'Oxford đang rén trước đôi mắt đại bàng của đại ca.', expression: 'happy' },
    ],
    boss: [
      { id: 'mc_b_1', text: 'Nối trúng một cặp thôi, đừng vội rung đùi.', expression: 'smug' },
      { id: 'mc_b_2', text: 'Tạm được. Ít ra mắt không để làm cảnh.', expression: 'idle' },
    ],
  },

  MATCH_WRONG: {
    puppy: [
      { id: 'mw_p_1', text: 'Chưa đúng cặp này rồi, nhìn kỹ lại một chút đại ca nhé!', expression: 'idle' },
      { id: 'mw_p_2', text: 'Không sao đâu, thử lại cặp khác xem sao nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'mw_c_1', text: 'Sai rồi thằng đầu đất.', expression: 'confused' },
      { id: 'mw_c_2', text: 'Hai cái này liên quan gì nhau thế đại ca? Nối duyên nhầm à?', expression: 'confused' },
      { id: 'mw_c_3', text: 'Não đang chạy bằng Wi-Fi công cộng chập chờn à?', expression: 'smug' },
    ],
    boss: [
      { id: 'mw_b_1', text: 'Râu ông nọ cắm cằm bà kia! Có mắt không đấy?', expression: 'confused' },
      { id: 'mw_b_2', text: 'Bấm bừa à? Có tin tôi cạp cho một phát gãy tay không?', expression: 'confused' },
    ],
  },

  MATCH_FAST: {
    puppy: [
      { id: 'mf_p_1', text: 'Tốc độ tia chớp luôn! Đại ca phản xạ nhanh quá chừng!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'mf_c_1', text: 'Nhanh thế? Đại ca có thuê người chơi hộ không đấy?', expression: 'smug' },
      { id: 'mf_c_2', text: 'Tốc độ này chắc do bấm loạn xạ trúng thưởng hay học thật?', expression: 'smug' },
    ],
    boss: [
      { id: 'mf_b_1', text: 'Nhanh nhưng cấm làm màu. Ván sau xem còn giữ được phong độ không.', expression: 'smug' },
    ],
  },

  MATCH_PERFECT: {
    puppy: [
      { id: 'mp_p_1', text: 'Hoàn hảo 100%! Không sai một cặp nào luôn, tự hào về đại ca ghê!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'mp_c_1', text: 'Không sai câu nào. Có mùi thiên tài thoang thoảng đâu đây.', expression: 'happy' },
      { id: 'mp_c_2', text: 'Hôm nay ăn trúng bả gì mà não sáng bừng thế đại ca?', expression: 'smug' },
    ],
    boss: [
      { id: 'mp_b_1', text: 'Không trượt phát nào. Hôm nay tạm thời miễn cạp.', expression: 'happy' },
    ],
  },

  TYPING_CORRECT: {
    puppy: [
      { id: 'tc_p_1', text: 'Gõ chuẩn từng ký tự luôn! Đại ca siêu quá đi!', expression: 'happy' },
      { id: 'tc_p_2', text: 'Đúng đét! Trí nhớ đỉnh nóc kịch trần!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'tc_c_1', text: 'Bàn phím nhảy múa và kết quả đúng. Bất ngờ thật sự.', expression: 'happy' },
      { id: 'tc_c_2', text: 'Không sai chính tả từ nào, từ điển Oxford thở phào nhẹ nhõm.', expression: 'smug' },
    ],
    boss: [
      { id: 'tc_b_1', text: 'Đúng rồi đấy. Biết gõ đúng chữ là đáng khen rồi.', expression: 'smug' },
    ],
  },

  TYPING_WRONG: {
    puppy: [
      { id: 'tw_p_1', text: 'Sai một xíu chính tả thôi, mình cùng nhìn đáp án đúng để nhớ nhé!', expression: 'idle' },
      { id: 'tw_p_2', text: 'Từ này hơi lắt léo, lát luyện lại là nhớ ngay thôi ạ.', expression: 'idle' },
    ],
    cheeky: [
      { id: 'tw_c_1', text: 'Gõ chữ gì thế này? Ngôn ngữ của người Sao Hỏa à đại ca?', expression: 'confused' },
      { id: 'tw_c_2', text: 'Chính tả bay màu. Tay nhanh hơn não là có thật.', expression: 'smug' },
      { id: 'tw_c_3', text: 'Nhìn đáp án kìa! Trông có giống chữ đại ca vừa gõ không?', expression: 'confused' },
    ],
    boss: [
      { id: 'tw_b_1', text: 'Sai bét nhè! Mù tiếng Anh hay mù bàn phím thế đại ca?', expression: 'confused' },
      { id: 'tw_b_2', text: 'Gõ linh tinh thế này giáo viên tiếng Anh khóc thét.', expression: 'confused' },
    ],
  },

  TYPING_HINT: {
    puppy: [
      { id: 'th_p_1', text: 'Gợi ý đây nè đại ca, cố lên sắp ra đáp án rồi!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'th_c_1', text: 'Lại mở gợi ý à? Trí nhớ đại ca ngắn hạn thế sao?', expression: 'smug' },
      { id: 'th_c_2', text: 'Cho gợi ý rồi mà gõ sai nữa là ăn cạp gấp đôi nhé.', expression: 'smug' },
    ],
    boss: [
      { id: 'th_b_1', text: 'Yếu bóng vía thì nhận, mở gợi ý cứu cánh làm gì cho xấu hổ.', expression: 'confused' },
    ],
  },

  GAME_COMPLETE: {
    puppy: [
      { id: 'gc_p_1', text: 'Hoàn thành màn chơi rồi! Đại ca tiến bộ rõ rệt luôn đó!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'gc_c_1', text: 'Xong một màn rồi đấy. Não đại ca còn thở nổi không?', expression: 'happy' },
      { id: 'gc_c_2', text: 'Chiến thắng vang dội, tạm thời công nhận đại ca có cố gắng.', expression: 'smug' },
    ],
    boss: [
      { id: 'gc_b_1', text: 'Xong màn rồi thì cấm ngủ gật. Mau luyện tiếp đi!', expression: 'smug' },
    ],
  },

  AI_MEANING_CORRECT: {
    puppy: [
      { id: 'amc_p_1', text: 'Đúng chuẩn bản chất nghĩa rồi đại ca ơi! Hiểu bài xuất sắc luôn!', expression: 'happy' },
      { id: 'amc_p_2', text: 'Dùng từ tiếng Việt rất tự nhiên mà vẫn giữ trọn vẹn nghĩa gốc nè!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'amc_c_1', text: 'Ủa, đại ca biết thật à? Tưởng đoán mò.', expression: 'smug' },
      { id: 'amc_c_2', text: 'Gemini gật đầu lia lịa rồi. Nay ăn gì mà uyên bác thế?', expression: 'happy' },
      { id: 'amc_c_3', text: 'Giải nghĩa mượt đấy. Oxford đang tính mời đại ca sang dịch sách.', expression: 'smug' },
    ],
    boss: [
      { id: 'amc_b_1', text: 'Hiểu đúng nghĩa rồi đấy. Giữ phong độ, câu sau mà tào lao là ăn cạp.', expression: 'smug' },
      { id: 'amc_b_2', text: 'Trúng phóc. Tạm thời công nhận não có nếp nhăn.', expression: 'idle' },
    ],
  },

  AI_MEANING_PARTIAL: {
    puppy: [
      { id: 'amp_p_1', text: 'Đại ca hiểu được một phần nghĩa rồi nè! Cố thêm xíu sắc thái nữa là chuẩn đét.', expression: 'idle' },
      { id: 'amp_p_2', text: 'Gần trúng rồi ạ, xem gợi ý của Gemini để nắm sâu hơn nha đại ca!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'amp_c_1', text: 'Cũng gần đúng đấy, nhưng gần đúng chưa phải đúng hẳn nhé.', expression: 'smug' },
      { id: 'amp_c_2', text: 'Thiếu một tí sắc thái nữa là trúng tim đen rồi. Tiếc ghê!', expression: 'idle' },
      { id: 'amp_c_3', text: 'Đúng 70% thôi, 30% còn lại đang lạc trôi nơi nao?', expression: 'confused' },
    ],
    boss: [
      { id: 'amp_b_1', text: 'Nửa nạc nửa mỡ. Hiểu từ vựng thế này đi thi giám khảo trừ nửa số điểm!', expression: 'confused' },
      { id: 'amp_b_2', text: 'Đọc kỹ lời giải thích kìa, đừng tưởng giải nghĩa đại khái là qua môn!', expression: 'smug' },
    ],
  },

  AI_MEANING_WRONG: {
    puppy: [
      { id: 'amw_p_1', text: 'Nghĩa này chưa chuẩn rồi đại ca, đọc lời giải thích của AI để hiểu sâu hơn nha!', expression: 'idle' },
      { id: 'amw_p_2', text: 'Không sao đâu nè, từ này nhiều người cũng hay nhầm lắm á!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'amw_c_1', text: 'Sai rồi ní. Não đang đi du lịch à?', expression: 'confused' },
      { id: 'amw_c_2', text: 'Dịch như Google Dịch thời 2010 vậy đại ca.', expression: 'smug' },
      { id: 'amw_c_3', text: 'Từ người ta một đằng, đại ca giải thích một nẻo. Cạn lời!', expression: 'confused' },
    ],
    boss: [
      { id: 'amw_b_1', text: 'Sai bét nhè! Có đọc đề không hay đang nhắm mắt bấm loạn xạ đấy?', expression: 'confused' },
      { id: 'amw_b_2', text: 'Nhìn lời giải thích của Gemini mà sám hối mau lên!', expression: 'smug' },
    ],
  },

  AI_SENTENCE_EXCELLENT: {
    puppy: [
      { id: 'ase_p_1', text: 'Câu văn xuất sắc quá đại ca ơi! Ngữ pháp chuẩn và dùng từ cực tự nhiên!', expression: 'happy' },
      { id: 'ase_p_2', text: 'Viết đỉnh như người bản xứ luôn nè! Em hâm mộ quá!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ase_c_1', text: 'Shakespeare mà sống chắc phải kết bạn với đại ca.', expression: 'happy' },
      { id: 'ase_c_2', text: 'Văn hay chữ tốt bất ngờ! Chắc nãy có tra từ điển lén không đấy?', expression: 'smug' },
      { id: 'ase_c_3', text: 'Oxford đã chính thức đưa đại ca vào danh sách cần theo dõi.', expression: 'happy' },
    ],
    boss: [
      { id: 'ase_b_1', text: 'Viết được câu ra hồn rồi đấy. Cứ thế mà phát huy, cấm tự mãn.', expression: 'smug' },
      { id: 'ase_b_2', text: 'Tạm duyệt. Câu sau mà sai ngữ pháp là tôi cạp không trượt phát nào.', expression: 'idle' },
    ],
  },

  AI_SENTENCE_PARTIAL: {
    puppy: [
      { id: 'asp_p_1', text: 'Câu có ý tưởng hay lắm nè, chỉ cần sửa một xíu ngữ pháp là tuyệt đối điểm luôn!', expression: 'idle' },
      { id: 'asp_p_2', text: 'Đại ca thử nhấn "Thử viết lại" áp dụng góp ý của AI xem sao nha!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'asp_c_1', text: 'Ngữ pháp vừa bị đại ca đấm cho một trận.', expression: 'confused' },
      { id: 'asp_c_2', text: 'Ý thì có đấy nhưng ngữ pháp đang kêu cứu kìa.', expression: 'smug' },
      { id: 'asp_c_3', text: 'Người bản xứ đọc câu này chắc phải ngẫm 3 giây mới hiểu.', expression: 'idle' },
    ],
    boss: [
      { id: 'asp_b_1', text: 'Câu cú lủng củng thế này mà đòi viết luận à đại ca?', expression: 'confused' },
      { id: 'asp_b_2', text: 'Xem câu sửa mẫu kìa, mau nhấn viết lại cho tử tế!', expression: 'smug' },
    ],
  },

  AI_SENTENCE_WRONG: {
    puppy: [
      { id: 'asw_p_1', text: 'Câu này từ vựng bị dùng chưa đúng chỗ rồi, đại ca xem mẫu câu đúng để rút kinh nghiệm nha!', expression: 'idle' },
      { id: 'asw_p_2', text: 'Không sao đâu, viết sai thì mình sửa lại, học là một quá trình mà!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'asw_c_1', text: 'Từ vựng khóc thét khi bị nhét vào câu này.', expression: 'confused' },
      { id: 'asw_c_2', text: 'Ngữ pháp toang, dùng từ cũng toang nốt. Cần cấp cứu gấp!', expression: 'confused' },
      { id: 'asw_c_3', text: 'Câu này dịch bằng niềm tin và hy vọng à đại ca?', expression: 'smug' },
    ],
    boss: [
      { id: 'asw_b_1', text: 'Viết linh tinh cái gì thế này? Từ vựng người ta không dùng kiểu đấy!', expression: 'confused' },
      { id: 'asw_b_2', text: 'Bôi bác nền giáo dục quá đại ca ơi! Đọc kỹ câu mẫu rồi viết lại mau!', expression: 'confused' },
    ],
  },

  AI_EVALUATION_ERROR: {
    puppy: [
      { id: 'aee_p_1', text: 'Mạng hơi chập chờn hoặc máy chủ AI đang bận một chút, đại ca thử lại nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'aee_c_1', text: 'Gemini đang ngủ gật, để tôi cạp cho nó tỉnh dậy.', expression: 'smug' },
      { id: 'aee_c_2', text: 'AI đang bận đi ăn cơm, đại ca bấm thử lại xem sao.', expression: 'confused' },
    ],
    boss: [
      { id: 'aee_b_1', text: 'Đường truyền lag như não đại ca lúc thi cử vậy. Thử lại ngay!', expression: 'confused' },
    ],
  },

  AI_SESSION_COMPLETE: {
    puppy: [
      { id: 'asc_p_1', text: 'Chúc mừng đại ca hoàn thành xuất sắc thử thách AI! Quá xịn xò luôn!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'asc_c_1', text: 'Qua ải AI rồi đấy, tưởng toang giữa chừng chứ.', expression: 'happy' },
      { id: 'asc_c_2', text: 'Gemini bảo đại ca có tiềm năng đấy, nhưng bớt lười đi nhé.', expression: 'smug' },
    ],
    boss: [
      { id: 'asc_b_1', text: 'Hoàn thành rồi thì nghỉ 5 phút rồi vào cày tiếp, cấm lướt điện thoại!', expression: 'smug' },
    ],
  },

  STREAK_STARTED: {
    puppy: [
      { id: 'ss_p_1', text: 'Ngày đầu tiên lên chuỗi rồi nè! Em tự hào về đại ca lắm á!', expression: 'happy' },
      { id: 'ss_p_2', text: 'Vạn sự khởi đầu nan, ngày đầu xuất sắc lắm nha đại ca!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ss_c_1', text: 'Ngày đầu tiên, còn dài lắm đại ca ơi. Xem giữ được mấy ngày.', expression: 'smug' },
      { id: 'ss_c_2', text: 'Chuỗi 1 ngày. Đừng để ngày mai ngủ quên rồi reset về số 0 nhé.', expression: 'idle' },
    ],
    boss: [
      { id: 'ss_b_1', text: 'Mới được ngày đầu mà đã toe toét rồi à? Ngày mai cấm có bỏ đấy!', expression: 'confused' },
      { id: 'ss_b_2', text: 'Khởi động thế thôi, giữ lửa đến ngày 30 mới được tính là người đàng hoàng.', expression: 'smug' },
    ],
  },

  STREAK_CONTINUED: {
    puppy: [
      { id: 'sc_p_1', text: 'Chuỗi ngày cạp chữ lại tăng thêm một ngày rồi! Cố lên đại ca!', expression: 'happy' },
      { id: 'sc_p_2', text: 'Đại ca chăm chỉ thế này tiếng Anh chẳng mấy chốc mà siêu!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sc_c_1', text: 'Lại thêm tí nọc. Não bắt đầu có dấu hiệu tiến hóa rồi đấy.', expression: 'happy' },
      { id: 'sc_c_2', text: 'Vẫn chưa đứt chuỗi à? Hôm nay bão to gió lớn ở đâu không biết.', expression: 'smug' },
    ],
    boss: [
      { id: 'sc_b_1', text: 'Tạm duyệt. Duy trì phong độ này, dám bỏ một hôm là ăn cạp ngay.', expression: 'idle' },
      { id: 'sc_b_2', text: 'Đều đặn như vắt tranh. Tạm thời không chê đại ca lười.', expression: 'smug' },
    ],
  },

  STREAK_MILESTONE: {
    puppy: [
      { id: 'sm_p_1', text: 'Cột mốc chuỗi siêu đỉnh luôn đại ca ơi! Em ngưỡng mộ đại ca quá chừng!', expression: 'happy' },
      { id: 'sm_p_2', text: 'Kỷ lục mới toanh! Đại ca cạp chữ vô địch thiên hạ!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sm_c_1', text: 'Ba ngày rồi đấy. Não bắt đầu có dấu hiệu tiến hóa.', expression: 'smug' },
      { id: 'sm_c_2', text: 'Bảy ngày liên tục? Cũng không phải dạng vừa.', expression: 'happy' },
      { id: 'sm_c_3', text: '30 ngày? Đại ca định cướp nghề giáo viên tiếng Anh à?', expression: 'smug' },
    ],
    boss: [
      { id: 'sm_b_1', text: 'Cột mốc đáng nể. Nhưng cấm tự mãn, ngã ngựa lúc này là nhục lắm đấy!', expression: 'smug' },
      { id: 'sm_b_2', text: 'Giữ được chuỗi dài thế này chứng tỏ não cũng chịu hợp tác rồi đấy.', expression: 'idle' },
    ],
  },

  STREAK_BROKEN: {
    puppy: [
      { id: 'sb_p_1', text: 'Tiếc quá chuỗi bị gián đoạn rồi, nhưng không sao hôm nay mình làm lại từ đầu nha đại ca!', expression: 'confused' },
      { id: 'sb_p_2', text: 'Ngã ở đâu mình làm lại ở đấy, em vẫn luôn cổ vũ đại ca mà!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'sb_c_1', text: 'Streak bay màu rồi. Đại ca đi đâu mà bỏ tôi thế?', expression: 'confused' },
      { id: 'sb_c_2', text: 'Chuỗi đứt ngọt ngào như tình đầu vậy. Mau cạp lại từ số 1 đi!', expression: 'smug' },
    ],
    boss: [
      { id: 'sb_b_1', text: 'Bỏ học một hôm là chuỗi về mo! Nhìn thấy xấu hổ chưa hả đại ca?', expression: 'confused' },
      { id: 'sb_b_2', text: 'Đứt chuỗi rồi đấy. Giờ thì còng lưng ra mà cày lại từ đầu đi!', expression: 'smug' },
    ],
  },

  XP_EARNED: {
    puppy: [
      { id: 'xe_p_1', text: 'Điểm Nọc tăng vùn vụt nè! Đại ca học chăm quá đi thôi!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'xe_c_1', text: 'Lại thêm tí nọc. Chăm chỉ đột xuất à?', expression: 'smug' },
      { id: 'xe_c_2', text: 'Cày được tí XP rồi đấy, nọc sắp đầy bình chưa?', expression: 'happy' },
    ],
    boss: [
      { id: 'xe_b_1', text: 'Cộng thêm điểm Nọc rồi đấy. Tiếp tục cày đi, chưa đủ đô đâu.', expression: 'idle' },
    ],
  },

  XP_DAILY_CAP: {
    puppy: [
      { id: 'xc_p_1', text: 'Đại ca đã chạm trần Nọc XP hôm nay rồi! Nghỉ ngơi xíu cho não thư giãn nha!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'xc_c_1', text: 'Đủ chỉ tiêu hôm nay rồi. Học tiếp vẫn tốt, nhưng đừng farm nữa đại ca.', expression: 'smug' },
      { id: 'xc_c_2', text: 'Đạt trần 250 XP rồi ní! Giữ sức mai cạp tiếp chứ tính thức thâu đêm à?', expression: 'idle' },
    ],
    boss: [
      { id: 'xc_b_1', text: 'Chạm trần XP trong ngày rồi! Muốn học tiếp thì học, điểm không tăng thêm đâu.', expression: 'smug' },
    ],
  },

  PERFECT_STUDY_DAY: {
    puppy: [
      { id: 'ps_p_1', text: 'Hôm nay đại ca học quá xuất sắc luôn á, điểm 10 cho chất lượng!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ps_c_1', text: 'Hôm nay não chạy bằng động cơ phản lực à? Đỉnh bất thường!', expression: 'happy' },
      { id: 'ps_c_2', text: 'Phong độ đỉnh cao thế này chắc tối nay phải tự thưởng một chầu trà sữa.', expression: 'smug' },
    ],
    boss: [
      { id: 'ps_b_1', text: 'Một ngày học hành ra trò. Tôi tạm thời không có gì để cạp.', expression: 'idle' },
    ],
  },

  NO_STUDY_ACTIVITY: {
    puppy: [
      { id: 'ns_p_1', text: 'Hôm nay đại ca chưa vào cạp từ nào nè, mình học một chút xíu thôi nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'ns_c_1', text: 'Ngày hôm nay chưa thấy hạt nọc nào. Lười vừa thôi không mốc meo não đấy!', expression: 'smug' },
      { id: 'ns_c_2', text: 'Vườn Nọc đang héo queo đợi đại ca vào tưới tắm kìa.', expression: 'confused' },
    ],
    boss: [
      { id: 'ns_b_1', text: 'Chưa học hành cái gì hết! Đứng dậy vào ôn từ ngay trước khi tôi cạp!', expression: 'confused' },
    ],
  },

  SO_NHUC_OPEN: {
    puppy: [
      { id: 'sn_p_1', text: 'Chào mừng đại ca đến bảo tàng những từ vựng cần mình chăm sóc kỹ hơn ạ.', expression: 'idle' },
    ],
    cheeky: [
      { id: 'sn_c_1', text: 'Chào mừng đại ca đến bảo tàng những pha mất não.', expression: 'smug' },
      { id: 'sn_c_2', text: 'Sổ Nhục đây rồi! Xem hôm nay có bao nhiêu nạn nhân cũ.', expression: 'idle' },
    ],
    boss: [
      { id: 'sn_b_1', text: 'Mở Sổ Nhục ra để tự nhìn lại chiến tích quên từ của mình đi đại ca.', expression: 'confused' },
    ],
  },

  SO_NHUC_REPEATED_ERROR: {
    puppy: [
      { id: 'sn_re_p_1', text: 'Từ này hơi bướng bỉnh chút, mình cùng thuần phục nó nha đại ca.', expression: 'idle' },
    ],
    cheeky: [
      { id: 'sn_re_c_1', text: 'Từ này gặp đại ca nhiều đến mức sắp thành người nhà rồi.', expression: 'smug' },
    ],
    boss: [
      { id: 'sn_re_b_1', text: 'Sai lên sai xuống thế này chắc từ này tính kết nghĩa huynh đệ với đại ca luôn quá.', expression: 'confused' },
    ],
  },

  SO_NHUC_VERY_LOW_ACCURACY: {
    puppy: [
      { id: 'sn_la_p_1', text: 'Cố lên đại ca ơi, từ này hơi khó nhằn nhưng mình sẽ chinh phục được ạ.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sn_la_c_1', text: 'Cái từ này với đại ca chắc có thù truyền kiếp.', expression: 'smug' },
    ],
    boss: [
      { id: 'sn_la_b_1', text: 'Độ chính xác thấp kỷ lục. Nhìn là thấy cay đắng rồi.', expression: 'confused' },
    ],
  },

  SO_NHUC_IMPROVEMENT: {
    puppy: [
      { id: 'sn_im_p_1', text: 'Tuyệt vời quá! Trí nhớ của đại ca đang tiến bộ từng ngày nè!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sn_im_c_1', text: 'Ồ, cuối cùng cũng chịu tiến hóa rồi đấy.', expression: 'happy' },
    ],
    boss: [
      { id: 'sn_im_b_1', text: 'Thấy bắt đầu nhớ bài rồi đấy. Đừng có chủ quan sớm.', expression: 'idle' },
    ],
  },

  SO_NHUC_WORD_MASTERED: {
    puppy: [
      { id: 'sn_ma_p_1', text: 'Một kẻ thù đã bị thuần phục hoàn toàn! Chúc mừng đại ca!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sn_ma_c_1', text: 'Một kẻ thù đã bị thuần phục. Từ này chính thức được giải ngũ khỏi Sổ Nhục.', expression: 'happy' },
    ],
    boss: [
      { id: 'sn_ma_b_1', text: 'Đã diệt gọn một đối thủ cứng đầu. Làm tốt lắm.', expression: 'smug' },
    ],
  },

  SO_NHUC_EMPTY: {
    puppy: [
      { id: 'sn_em_p_1', text: 'Sổ Nhục sạch bóng kẻ thù! Đại ca học siêu đỉnh quá ạ!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sn_em_c_1', text: 'Sạch sẽ đáng ngờ. Đại ca học thật hay chưa bắt đầu?', expression: 'smug' },
    ],
    boss: [
      { id: 'sn_em_b_1', text: 'Sổ Nhục trống trơn. Hoặc đại ca là thiên tài, hoặc chưa ôn gì hết.', expression: 'confused' },
    ],
  },

  SRS_REVIEW_START: {
    puppy: [
      { id: 'sr_st_p_1', text: 'Đến giờ ôn tập thông minh rồi ạ! Ôn đúng từ cần ôn để nhớ lâu hơn nha.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sr_st_c_1', text: 'Hôm nay ôn gì? Để Cạp Tổng lôi mấy từ hay quên ra kiểm tra xem nào.', expression: 'smug' },
    ],
    boss: [
      { id: 'sr_st_b_1', text: 'Đến giờ ôn thông minh. Đừng có bấm bừa cho qua chuyện đấy.', expression: 'idle' },
    ],
  },

  SRS_REVIEW_COMPLETE: {
    puppy: [
      { id: 'sr_cp_p_1', text: 'Ôn xong bài rồi! Não bộ của đại ca hôm nay hoạt động cực kỳ năng suất luôn.', expression: 'happy' },
    ],
    cheeky: [
      { id: 'sr_cp_c_1', text: 'Ôn được mấy từ rồi. Cũng không hoàn toàn vô dụng.', expression: 'happy' },
    ],
    boss: [
      { id: 'sr_cp_b_1', text: 'Hoàn thành ca ôn tập. Tạm tha cho đại ca hôm nay.', expression: 'smug' },
    ],
  },

  RANKED_ENTER: {
    puppy: [
      { id: 're_p_1', text: 'Chào mừng đại ca đến Đấu Trường Cạp Cạp! Bình tĩnh tự tin, em tin đại ca làm được!', expression: 'happy' },
      { id: 're_p_2', text: 'Sân chơi thử thách trình độ nè! Đại ca cố gắng tích lũy RP thăng hạng nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 're_c_1', text: 'Đại ca định gáy bằng thực lực hay bằng niềm tin?', expression: 'smug' },
      { id: 're_c_2', text: 'Đấu trường này không có chỗ cho bấm bừa đâu nhé đại ca.', expression: 'idle' },
      { id: 're_c_3', text: 'Vào đây rồi là cấm khóc nhè khi bị trừ RP đấy.', expression: 'smug' },
    ],
    boss: [
      { id: 're_b_1', text: 'Đại ca có thực lực hay chỉ được cái gáy?', expression: 'confused' },
      { id: 're_b_2', text: 'Vác mặt vào Đấu Trường rồi thì thi đấu cho ra hồn, đừng làm bẽ mặt tôi.', expression: 'smug' },
    ],
  },

  RANKED_START: {
    puppy: [
      { id: 'rs_p_1', text: 'Trận đấu bắt đầu rồi! Có 5 phút cho 10 câu, đại ca đọc kỹ đề nhé!', expression: 'happy' },
      { id: 'rs_p_2', text: 'Cố lên đại ca! Em đứng đây cổ vũ từng câu một nè!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rs_c_1', text: 'Vào trận đi. Để xem Oxford có phải gọi công an không.', expression: 'smug' },
      { id: 'rs_c_2', text: 'Đồng hồ đang đếm ngược kìa, não bắt đầu xoay bánh răng chưa?', expression: 'idle' },
    ],
    boss: [
      { id: 'rs_b_1', text: 'Bắt đầu! Ngồi thẳng lưng, bấm cho chuẩn, cấm đoán mò!', expression: 'smug' },
      { id: 'rs_b_2', text: '5 phút 10 câu. Làm không xong thì tự giác đi úp mặt vào tường.', expression: 'confused' },
    ],
  },

  RANKED_PERFECT: {
    puppy: [
      { id: 'rp_p_1', text: '10/10 tuyệt đối luôn! Đại ca là thiên tài đích thực, em tự hào quá!', expression: 'happy' },
      { id: 'rp_p_2', text: 'Xuất sắc không tì vết! +25 RP xứng đáng đỉnh chóp!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rp_c_1', text: '10/10? Đại ca vừa nuốt quyển từ điển à?', expression: 'happy' },
      { id: 'rp_c_2', text: 'Không sai câu nào! Nay ăn gì mà não sáng rực cả đấu trường thế?', expression: 'smug' },
    ],
    boss: [
      { id: 'rp_b_1', text: '10/10 tròn trĩnh. Hôm nay tạm thời cho phép đại ca ngẩng cao đầu.', expression: 'smug' },
      { id: 'rp_b_2', text: 'Được đấy. Cứ giữ phong độ này thì tôi bớt khẩu nghiệp.', expression: 'idle' },
    ],
  },

  RANKED_SUCCESS: {
    puppy: [
      { id: 'rsc_p_1', text: 'Thắng lợi giòn giã nè đại ca! Điểm RP tăng vùn vụt luôn rồi!', expression: 'happy' },
      { id: 'rsc_p_2', text: 'Kết quả rất tốt luôn ạ! Cố thêm xíu nữa là đạt điểm tuyệt đối nha!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rsc_c_1', text: 'Cũng có tí trình độ đấy. Tưởng vào đây tấu hài chứ.', expression: 'smug' },
      { id: 'rsc_c_2', text: 'Có cộng RP là vui rồi. Bớt gáy lại để trận sau thi tiếp.', expression: 'happy' },
    ],
    boss: [
      { id: 'rsc_b_1', text: 'Thắng được một trận. Tạm duyệt, nhưng cấm rung đùi tự mãn.', expression: 'smug' },
      { id: 'rsc_b_2', text: 'Có nỗ lực. Lần sau làm cho chuẩn hơn nữa nghe chưa.', expression: 'idle' },
    ],
  },

  RANKED_FAILURE: {
    puppy: [
      { id: 'rf_p_1', text: 'Trận này hơi khó một chút thôi, đại ca đừng buồn nhé, mình gỡ lại sau nè!', expression: 'idle' },
      { id: 'rf_p_2', text: 'Trừ xíu RP thôi mà, lần sau cẩn thận hơn là thăng hạng lại ngay ạ!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rf_c_1', text: 'Cái rank này chắc cũng muốn bỏ đại ca mà đi.', expression: 'confused' },
      { id: 'rf_c_2', text: 'RP tụt dốc không phanh. Tay nhanh hơn não là có thật.', expression: 'smug' },
    ],
    boss: [
      { id: 'rf_b_1', text: 'Đánh đấm kiểu gì thế hả? Vào đấu trường để phát từ thiện RP à?', expression: 'confused' },
      { id: 'rf_b_2', text: 'Trừ RP cho sáng mắt ra! Quay về học lại từ vựng cơ bản mau!', expression: 'confused' },
    ],
  },

  RANKED_PROMOTION: {
    puppy: [
      { id: 'rpr_p_1', text: 'Chúc mừng đại ca thăng hạng mới! Huy hiệu rực rỡ quá chừng luôn!', expression: 'happy' },
      { id: 'rpr_p_2', text: 'Lên hạng rồi! Nỗ lực của đại ca đã được đền đáp xứng đáng!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rpr_c_1', text: 'Lên hạng rồi! Cho phép đại ca bố đời trong 5 phút.', expression: 'happy' },
      { id: 'rpr_c_2', text: 'Thăng hạng bất ngờ chưa. Nhớ giữ rank nhé chứ đừng tụt về đáy.', expression: 'smug' },
    ],
    boss: [
      { id: 'rpr_b_1', text: 'Lên rank mới rồi đấy. Đừng có tưởng bở là vô đối, cao nhân còn đầy!', expression: 'smug' },
      { id: 'rpr_b_2', text: 'Huy hiệu mới tạm le lói. Leo tiếp lên Đại Đế xem nào!', expression: 'idle' },
    ],
  },

  RANKED_DEMOTION: {
    puppy: [
      { id: 'rd_p_1', text: 'Rớt hạng một xíu thôi đại ca ơi, cố lên mình cày lại nhé!', expression: 'confused' },
      { id: 'rd_p_2', text: 'Em vẫn luôn tin tưởng đại ca! Trận sau sẽ phục thù thành công!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'rd_c_1', text: 'Tụt rank rồi kìa. Cảm giác rớt đài có êm ái không đại ca?', expression: 'confused' },
      { id: 'rd_c_2', text: 'Huy hiệu vừa rớt xuống sàn kêu đánh cạch một cái. Cay chưa?', expression: 'smug' },
    ],
    boss: [
      { id: 'rd_b_1', text: 'Rớt hạng rồi thằng lười! Nhìn cái rank tụt dốc mà xấu hổ đi!', expression: 'confused' },
      { id: 'rd_b_2', text: 'Đã bảo ôn bài không nghe. Giờ thì cày lại từ đầu cho nhớ đời!', expression: 'confused' },
    ],
  },

  RANKED_TIMEOUT: {
    puppy: [
      { id: 'rt_p_1', text: 'Hết giờ mất rồi! Lần sau đại ca phân bổ thời gian đều hơn nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'rt_c_1', text: 'Hết 5 phút rồi đại ca ơi! Ngồi ngắm câu hỏi hay ngắm Cạp Tổng thế?', expression: 'confused' },
      { id: 'rt_c_2', text: 'Đồng hồ điểm số 0 mà bài chưa nộp xong. Chậm chạp như rùa bò.', expression: 'smug' },
    ],
    boss: [
      { id: 'rt_b_1', text: 'Cháy giáo án rồi! Thi cử mà đủng đỉnh thế thì thi thố cái gì?', expression: 'confused' },
    ],
  },

  RANKED_LIMIT_REACHED: {
    puppy: [
      { id: 'rl_p_1', text: 'Hôm nay đại ca đã hoàn thành đủ 3 trận rồi nè! Nghỉ ngơi mai mình chiến tiếp nha!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'rl_c_1', text: 'Hết lượt leo rank rồi. Đi học thêm đi đại ca.', expression: 'smug' },
      { id: 'rl_c_2', text: '3/3 trận kịch khung rồi ní. Mai quay lại phục thù nhé.', expression: 'idle' },
    ],
    boss: [
      { id: 'rl_b_1', text: 'Hết chỉ tiêu hôm nay rồi. Tắt đấu trường đi ôn thẻ từ vựng ngay!', expression: 'smug' },
    ],
  },

  RANKED_SERVER_ERROR: {
    puppy: [
      { id: 'rse_p_1', text: 'Hệ thống đang kiểm tra bảo mật một chút, đại ca thử lại sau ít phút nha!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'rse_c_1', text: 'Máy chủ đang dở chứng, tôi chưa dám động vào điểm của đại ca.', expression: 'confused' },
      { id: 'rse_c_2', text: 'Đường truyền đang hắt xì hơi, điểm số vẫn an toàn nguyên vẹn.', expression: 'idle' },
    ],
    boss: [
      { id: 'rse_b_1', text: 'Máy chủ đang bảo trì bảo mật. Cấm táy máy lung tung!', expression: 'confused' },
    ],
  },

  LEADERBOARD_OPEN: {
    puppy: [
      { id: 'lo_p_1', text: 'Chào mừng đại ca ghé thăm Bảng Phong Thần! Cùng xem bạn bè học chăm chỉ thế nào nhé ạ!', expression: 'happy' },
      { id: 'lo_p_2', text: 'Không khí thi đua sôi nổi quá, em cổ vũ đại ca sớm có mặt trong top nè!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'lo_c_1', text: 'Đại ca định xem cao thủ hay định tìm người cùng đáy?', expression: 'smug' },
      { id: 'lo_c_2', text: 'Vào ngắm bảng vàng xem thiên hạ học hành ra sao kìa.', expression: 'idle' },
      { id: 'lo_c_3', text: 'Bảng xếp hạng hội bạn đây rồi, chuẩn bị tinh thần bị khịa chưa?', expression: 'smug' },
    ],
    boss: [
      { id: 'lo_b_1', text: 'Vác mặt vào xem BXH à? Trông điểm số người ta mà biết xấu hổ đi!', expression: 'confused' },
      { id: 'lo_b_2', text: 'Đứng nhìn người ta gáy thôi hay có gan nhảy vào cạnh tranh?', expression: 'smug' },
    ],
  },

  LEADERBOARD_DEMO: {
    puppy: [
      { id: 'ld_p_1', text: 'Đây là bảng xem trước minh họa thôi nha đại ca, chuẩn bị tinh thần để đợt tới leo rank thật nhé!', expression: 'idle' },
    ],
    cheeky: [
      { id: 'ld_c_1', text: 'Đây mới là diễn tập thôi. Đừng nhận vơ mình là Đại Đế.', expression: 'smug' },
      { id: 'ld_c_2', text: 'Bảng demo sương sương thôi đại ca, đừng tưởng bở.', expression: 'idle' },
    ],
    boss: [
      { id: 'ld_b_1', text: 'Bản xem trước thôi đấy! Chờ mở rank chính thức xem có trụ nổi ở top không.', expression: 'smug' },
    ],
  },

  LEADERBOARD_TOP_3: {
    puppy: [
      { id: 'lt_p_1', text: 'Top 3 đỉnh nóc kịch trần luôn! Đại ca cố gắng một ngày nào đó cũng đứng trên bục nhé!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'lt_c_1', text: 'Ba ông này chắc ăn từ điển thay cơm.', expression: 'smug' },
      { id: 'lt_c_2', text: 'Ngồi trên bục cao thế kia gió có lạnh không các đại ca?', expression: 'happy' },
    ],
    boss: [
      { id: 'lt_b_1', text: 'Ba vị này gáy to nhất xóm. Đại ca bao giờ mới ngóc đầu lên được đây?', expression: 'confused' },
    ],
  },

  LEADERBOARD_UNRANKED: {
    puppy: [
      { id: 'lu_p_1', text: 'Đại ca chưa có rank cũng không sao nè, luyện tập thêm rồi vào trận phân hạng sau nha!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'lu_c_1', text: 'Chưa có rank thì cứ học tiếp. Gáy sau cũng chưa muộn.', expression: 'smug' },
      { id: 'lu_c_2', text: 'Tấm chiếu mới chưa phân hạng kìa, mau đi cày từ đi.', expression: 'idle' },
    ],
    boss: [
      { id: 'lu_b_1', text: 'Chưa có hạng mà đã đòi hóng bảng vàng? Mau về học thẻ từ vựng đi!', expression: 'confused' },
    ],
  },

  ACHIEVEMENT_UNLOCKED: {
    puppy: [
      { id: 'ac_u_p_1', text: 'Tuyệt vời quá đại ca ơi! Mở khóa thêm huy hiệu mới rồi nè!', expression: 'happy' },
      { id: 'ac_u_p_2', text: 'Đại ca cày cuốc chăm chỉ thật sự, xứng đáng nhận huy hiệu xịn sò!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ac_u_c_1', text: 'Đại ca mở khóa thành tích rồi. Tôi ghi vào sử sách đây.', expression: 'smug' },
      { id: 'ac_u_c_2', text: 'Cũng có thành tích để gáy với bạn bè rồi đấy, tưởng học cho vui.', expression: 'happy' },
    ],
    boss: [
      { id: 'ac_u_b_1', text: 'Mở được một huy hiệu. Tạm chấp nhận, cấm ngủ quên trên chiến thắng.', expression: 'smug' },
      { id: 'ac_u_b_2', text: 'Thành tích thật thì tôi công nhận. Tiếp tục duy trì phong độ đi.', expression: 'idle' },
    ],
  },

  ACHIEVEMENT_FIRST_UNLOCK: {
    puppy: [
      { id: 'ac_f_p_1', text: 'Huy hiệu đầu tiên trong đời của đại ca! Cột mốc lịch sử luôn ạ!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ac_f_c_1', text: 'Cuối cùng cũng có thứ chứng minh đại ca thực sự học.', expression: 'smug' },
      { id: 'ac_f_c_2', text: 'Phát súng đầu tiên! Bớt lười đi thì tủ huy hiệu này mới đầy được.', expression: 'happy' },
    ],
    boss: [
      { id: 'ac_f_b_1', text: 'Bắt đầu có thành tích đầu tiên rồi. Đừng để nó thành huy hiệu duy nhất đấy!', expression: 'confused' },
    ],
  },

  ACHIEVEMENT_GALLERY_OPEN: {
    puppy: [
      { id: 'ac_g_p_1', text: 'Tủ thành tích lung linh quá đại ca ơi! Nhìn số huy hiệu mà em nể phục luôn!', expression: 'happy' },
      { id: 'ac_g_p_2', text: 'Học tới đâu huy hiệu sáng tới đó, đại ca cố lên cho sáng rực cả tủ nhé!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ac_g_c_1', text: 'Đây là bằng chứng học hành, không phải bảng thành tích gáy suông.', expression: 'smug' },
      { id: 'ac_g_c_2', text: 'Vào ngắm huy hiệu cho đỡ tủi thân à? Muốn đầy tủ thì mau đi cày từ đi.', expression: 'idle' },
    ],
    boss: [
      { id: 'ac_g_b_1', text: 'Nhìn vào đây mà biết mình lười hay siêng. Tự soi gương lại đi!', expression: 'confused' },
      { id: 'ac_g_b_2', text: 'Học thì có thể chậm, nhưng thành tích phải có cái để gáy. Cày tiếp!', expression: 'smug' },
    ],
  },

  ACHIEVEMENT_MILESTONE: {
    puppy: [
      { id: 'ac_m_p_1', text: 'Cột mốc khủng khiếp luôn đại ca! Học thế này ai theo cho kịp nữa!', expression: 'happy' },
    ],
    cheeky: [
      { id: 'ac_m_c_1', text: 'Bảy ngày học liên tục? Đại ca bị ai nhập à?', expression: 'smug' },
      { id: 'ac_m_c_2', text: 'Chăm chỉ đột xuất thế này làm tôi hơi lo cho sức khỏe của đại ca.', expression: 'confused' },
    ],
    boss: [
      { id: 'ac_m_b_1', text: 'Cột mốc đáng nể. Lần này tôi chính thức dành cho đại ca sự tôn trọng.', expression: 'smug' },
    ],
  },
};

let lastDialogueId = '';

export function getRandomDialogue(
  category: DialogueCategory,
  tone: MascotTone = 'cheeky',
  excludeId?: string
): DialogueItem {
  const list = DIALOGUES[category]?.[tone] || DIALOGUES[category]?.cheeky || DIALOGUES.WELCOME.cheeky;
  const filtered = list.filter((item) => item.id !== (excludeId || lastDialogueId));
  const pool = filtered.length > 0 ? filtered : list;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  lastDialogueId = chosen.id;
  return chosen;
}

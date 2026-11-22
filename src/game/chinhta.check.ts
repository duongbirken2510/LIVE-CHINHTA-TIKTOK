import assert from 'node:assert/strict';
import { ChinhTaEngine } from './chinhta';
import { isSameVietnamese, parsePlayerChoice } from './compare';
import {
  ALL_CHINHTA_QUESTIONS,
  VONG_1_PHU_AM,
  VONG_2_DAU_VAN,
  VONG_3_BAT_LOI_CAU,
  VONG_4_HAN_VIET,
} from './du-lieu';

console.log('🧪 Kiểm thử Vua Chính Tả — Đấu Trường Tiếng Việt 1 vs 2 (LIVE-CHINHTA-TIKTOK)...');

// 1. Kiểm thử chuẩn hóa dấu tiếng Việt & bộ nhận diện lựa chọn 1 / 2
assert.equal(isSameVietnamese('Thanh Hoà', 'thanh hòa'), true, 'Phải khớp kiểu bỏ dấu oà và òa');
assert.equal(isSameVietnamese('Thuý Kiều', 'thúy kiều'), true, 'Phải khớp kiểu bỏ dấu uý và úy');
assert.equal(isSameVietnamese('Chỉn chu!', '  chỉn   chu '), true, 'Phải bỏ qua dấu câu và khoảng trắng thừa');
assert.equal(isSameVietnamese('Chỉn chu', 'Chinh chu'), false, 'Không dấu không được khớp bừa với có dấu');

assert.equal(parsePlayerChoice('1', 'Xán lạn', 'Sáng lạng', undefined, '12'), 1);
assert.equal(parsePlayerChoice('2', 'Xán lạn', 'Sáng lạng', undefined, '12'), 2);
assert.equal(parsePlayerChoice('số 1', 'Xán lạn', 'Sáng lạng', undefined, '12'), 1);
assert.equal(parsePlayerChoice('so 2', 'Xán lạn', 'Sáng lạng', undefined, '12'), 2);
assert.equal(parsePlayerChoice('1 nha', 'Xán lạn', 'Sáng lạng', undefined, '12'), 1);
assert.equal(parsePlayerChoice('chon 2', 'Xán lạn', 'Sáng lạng', undefined, '12'), 2);
assert.equal(parsePlayerChoice('phương án 1', 'Xán lạn', 'Sáng lạng', undefined, '12'), 1);
assert.equal(parsePlayerChoice('Xán lạn', 'Xán lạn', 'Sáng lạng', undefined, '12'), 1);
assert.equal(parsePlayerChoice('Sáng lạng', 'Xán lạn', 'Sáng lạng', undefined, '12'), 2);
assert.equal(parsePlayerChoice('1 2', 'Xán lạn', 'Sáng lạng', undefined, '12'), null, 'Gõ cả 1 và 2 trong cùng 1 bình luận phải bị từ chối');
assert.equal(parsePlayerChoice('1 hoặc 2', 'Xán lạn', 'Sáng lạng', undefined, '12'), null, 'Gõ nước đôi 1 hoặc 2 phải bị từ chối');
assert.equal(parsePlayerChoice('A', 'Xán lạn', 'Sáng lạng', undefined, '12'), null, 'Ở câu lẻ (1/2), gõ A phải bị bỏ qua để chống trôi đáp án câu trước');
assert.equal(parsePlayerChoice('B', 'Xán lạn', 'Sáng lạng', undefined, '12'), null, 'Ở câu lẻ (1/2), gõ B phải bị bỏ qua');

// Kiểm thử chế độ 'AB' (câu chẵn: Câu 2, 4)
assert.equal(parsePlayerChoice('A', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 1);
assert.equal(parsePlayerChoice('b', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 2);
assert.equal(parsePlayerChoice('câu A', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 1);
assert.equal(parsePlayerChoice('chọn B', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 2);
assert.equal(parsePlayerChoice('đáp án A', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 1);
assert.equal(parsePlayerChoice('A nha', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 1);
assert.equal(parsePlayerChoice('B ạ', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), 2, 'B ạ ở chế độ AB phải nhận diện chính xác là phương án B (2)');
assert.equal(parsePlayerChoice('A B', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), null, 'Gõ cả A và B trong cùng 1 bình luận phải bị từ chối');
assert.equal(parsePlayerChoice('A hay B', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), null, 'Gõ nước đôi A hay B phải bị từ chối');
assert.equal(parsePlayerChoice('1', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), null, 'Ở câu chẵn (A/B), gõ 1 phải bị bỏ qua để chống trôi đáp án câu trước do trễ OBS');
assert.equal(parsePlayerChoice('2', 'Xán lạn', 'Sáng lạng', undefined, 'AB'), null, 'Ở câu chẵn (A/B), gõ 2 phải bị bỏ qua');

// 2. Kiểm thử kho dữ liệu khủng 1.550 câu hỏi (mỗi vòng từ 320 - 450 câu, nằm trong ngưỡng 200 - 500 câu/vòng)
assert.ok(ALL_CHINHTA_QUESTIONS.length >= 1500, `Tổng kho câu hỏi phải >= 1500 (hiện có ${ALL_CHINHTA_QUESTIONS.length} câu)`);
assert.ok(VONG_1_PHU_AM.length >= 200 && VONG_1_PHU_AM.length <= 500, `Vòng 1 phải có 200-500 câu (hiện có ${VONG_1_PHU_AM.length})`);
assert.ok(VONG_2_DAU_VAN.length >= 200 && VONG_2_DAU_VAN.length <= 500, `Vòng 2 phải có 200-500 câu (hiện có ${VONG_2_DAU_VAN.length})`);
assert.ok(VONG_3_BAT_LOI_CAU.length >= 200 && VONG_3_BAT_LOI_CAU.length <= 500, `Vòng 3 phải có 200-500 câu (hiện có ${VONG_3_BAT_LOI_CAU.length})`);
assert.ok(VONG_4_HAN_VIET.length >= 200 && VONG_4_HAN_VIET.length <= 500, `Vòng 4 phải có 200-500 câu (hiện có ${VONG_4_HAN_VIET.length})`);

const idSet = new Set<string>();
for (const q of ALL_CHINHTA_QUESTIONS) {
  assert.ok(q.id && q.optionCorrect && q.optionWrong && q.contextHint && q.explanation, `Câu ${q.id} thiếu trường bắt buộc`);
  assert.ok(!idSet.has(q.id), `Trùng ID câu hỏi: ${q.id}`);
  idSet.add(q.id);
}
console.log(
  `📚 Đã kiểm chứng kho đề 1.550 câu: Vòng 1 (${VONG_1_PHU_AM.length}) · Vòng 2 (${VONG_2_DAU_VAN.length}) · Vòng 3 (${VONG_3_BAT_LOI_CAU.length}) · Vòng 4 (${VONG_4_HAN_VIET.length})`
);

// 3. Kiểm thử luật "Bút Sa Gà Chết" (chỉ tính lựa chọn đầu tiên, khóa chặt khi chọn sai) & Thanh Kéo Co 1 vs 2
const now = 1_700_000_000_000;
const engine = new ChinhTaEngine();
engine.startNewMatch(now);

// Đầu quân 3 miền
const regB = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: 'Miền Bắc' }, now + 100);
assert.equal(regB.kind, 'region');
assert.equal(regB.region, 'B');

const correctStr = engine.getSampleCorrectAnswer(); // '1' hoặc '2'
const wrongStr = engine.getSampleWrongAnswer(); // số ngược lại

// Người chơi 1 (Lan Anh) chọn ĐÚNG ngay lần đầu tiên
const hit1 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: `so ${correctStr}`, createTime: now + 300 }, now + 300);
assert.equal(hit1.kind, 'correct');
assert.equal(hit1.rankInStep, 1);
assert.ok((hit1.points ?? 0) >= 110, 'Trả lời đúng đầu giờ Vòng 1 phải đạt gần 120 điểm');

// Lan Anh gõ lại lần 2 trong cùng câu -> trả về 'already', không cộng điểm trùng
const dupCorrect = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: correctStr }, now + 500);
assert.equal(dupCorrect.kind, 'already');

// Người chơi 2 (Minh Tuấn) lần đầu gõ SAI phương án -> bị tính 'wrong', cắt streak = 0 và khóa luôn
const miss1 = engine.submitChat({ username: 'tuan88', nickname: 'Minh Tuấn', comment: `${wrongStr} nha` }, now + 600);
assert.equal(miss1.kind, 'wrong');

// Minh Tuấn lập tức "quay xe" gõ lại số ĐÚNG -> Bị từ chối với kind: 'locked_wrong' (Luật Bút Sa Gà Chết!)
const cheatRetry = engine.submitChat({ username: 'tuan88', nickname: 'Minh Tuấn', comment: correctStr }, now + 700);
assert.equal(cheatRetry.kind, 'locked_wrong', 'Chọn sai lần đầu rồi gõ lại số đúng phải bị khóa locked_wrong');
assert.equal(engine.players.get('tuan88')?.score, 0, 'Người quay xe sau khi chọn sai tuyệt đối không được cộng điểm');

// Người chơi 3 (Hoàng Long) chọn SAI -> kiểm tra Thanh Kéo Co 1 vs 2 (1 người đúng vs 2 người sai -> 33% / 67%)
engine.submitChat({ username: 'long77', nickname: 'Hoàng Long', comment: `chon ${wrongStr}` }, now + 800);
const snapTug = engine.getSnapshot(now + 850);
assert.equal(snapTug.tugOfWar.total, 3, 'Tổng số bình chọn trên thanh kéo co phải là 3');
const correctVotes = correctStr === '1' ? snapTug.tugOfWar.count1 : snapTug.tugOfWar.count2;
const wrongVotes = correctStr === '1' ? snapTug.tugOfWar.count2 : snapTug.tugOfWar.count1;
assert.equal(correctVotes, 1);
assert.equal(wrongVotes, 2);
assert.equal(snapTug.tugOfWar.pct1 + snapTug.tugOfWar.pct2, 100, 'Tổng tỷ lệ % thanh kéo co phải bằng 100%');

// 4. Kiểm thử Cứu trợ 200 Tim miễn phí mở Gợi Ý Ngữ Nghĩa
assert.equal(engine.addLikes(130), false);
assert.equal(engine.addLikes(80), true, 'Đủ >= 200 tim phải kích hoạt cứu trợ gợi ý ngữ nghĩa');
assert.ok(engine.getSnapshot(now + 900).puzzle.rescueHint, 'Khi đủ 200 tim phải hiển thị rescueHint trên bảng câu hỏi');

// 5. Kiểm thử Vòng 1 & 3 cố định [1]/[2], Vòng 2 & 4 cố định [A]/[B] + Giới thiệu luật chơi đầu mỗi vòng + Chuỗi 3 câu đúng +100đ
const snapV1Q1 = engine.getSnapshot(now + 900);
assert.deepEqual(snapV1Q1.puzzle.choiceLabels, ['1', '2'], 'Vòng 1 phải hiển thị nhãn [1] vs [2]');
assert.ok(snapV1Q1.mcSpeech.includes('Luật chơi Vòng 1'), 'Câu 1 Vòng 1 phải có lời MC giới thiệu luật chơi Vòng 1');

engine.skipCurrentStep(now + 2000); // Sang câu 2 Vòng 1 (vẫn giữ 1 / 2 để người chơi không bị bất ngờ)
const snapV1Q2 = engine.getSnapshot(now + 2050);
assert.equal(snapV1Q2.puzzle.choiceMode, '12', 'Câu 2 Vòng 1 vẫn phải giữ chế độ 12');
assert.deepEqual(snapV1Q2.puzzle.choiceLabels, ['1', '2'], 'Câu 2 Vòng 1 vẫn hiển thị nhãn [1] vs [2]');
const ans2 = engine.getSampleCorrectAnswer();
const hit2 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: ans2, createTime: now + 2200 }, now + 2200);
assert.equal(hit2.kind, 'correct');
assert.equal(hit2.streakBonus, 0);

engine.skipCurrentStep(now + 4000); // Sang câu 3 Vòng 1
const ans3 = engine.getSampleCorrectAnswer();
const hit3 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: ans3, createTime: now + 4200 }, now + 4200);
assert.equal(hit3.kind, 'correct');
assert.equal(hit3.streakBonus, 100, 'Đúng liền 3 câu phải được thưởng nóng +100đ');

// Sang câu 4 Vòng 1, nếu Lan Anh chọn SAI thì chuỗi thắng (streak) phải lập tức về 0
engine.skipCurrentStep(now + 6000);
const wrong4 = engine.getSampleWrongAnswer();
const miss4 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: wrong4 }, now + 6200);
assert.equal(miss4.kind, 'wrong');
assert.equal(engine.players.get('lan99')?.streak, 0, 'Chọn sai phải cắt chuỗi thắng về 0 ngay lập tức');

// Kiểm thử Vòng 2: chuyển sang chế độ A / B suốt cả Vòng 2 + Giới thiệu luật chơi đầu Vòng 2
engine.jumpToRound(1, now + 8_000);
const snapR2 = engine.getSnapshot(now + 8_100);
assert.equal(snapR2.puzzle.choiceMode, 'AB', 'Vòng 2 phải dùng chế độ AB');
assert.deepEqual(snapR2.puzzle.choiceLabels, ['A', 'B'], 'Vòng 2 phải hiển thị nhãn [A] vs [B]');
assert.ok(snapR2.mcSpeech.includes('Luật chơi Vòng 2'), 'Câu 1 Vòng 2 phải giới thiệu luật chơi gõ A hoặc B');
const lateFromV1 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: '1', createTime: now + 8_150 }, now + 8_150);
assert.equal(lateFromV1.kind, 'none', 'Ở Vòng 2 (A/B), gõ số 1 phải bị bỏ qua');

// 6. Kiểm thử Vòng 3 (Bắt lỗi câu văn: [1] ĐÚNG CHÍNH TẢ vs [2] SAI CHÍNH TẢ) & Vòng 4 (Thuần Việt & Hán Việt ×2: [A] vs [B])
engine.jumpToRound(2, now + 10_000);
const snapR3 = engine.getSnapshot(now + 10_100);
assert.equal(snapR3.puzzle.roundCode, 'bat-loi-cau');
assert.deepEqual(snapR3.puzzle.choiceLabels, ['1', '2'], 'Vòng 3 phải dùng [1] vs [2]');
assert.ok(snapR3.mcSpeech.includes('Luật chơi Vòng 3'), 'Đầu Vòng 3 phải giới thiệu luật chơi Vòng 3');
assert.equal(snapR3.puzzle.option1, 'ĐÚNG CHÍNH TẢ');
assert.equal(snapR3.puzzle.option2, 'SAI CHÍNH TẢ');
assert.ok(snapR3.puzzle.sentenceParts?.highlight, 'Vòng 3 phải có từ khóa highlight trong câu');

engine.jumpToRound(3, now + 15_000);
const snapR4 = engine.getSnapshot(now + 15_100);
assert.equal(snapR4.puzzle.roundCode, 'han-viet');
assert.equal(snapR4.puzzle.roundLabel, 'Thuần Việt & Hán Việt ×2');
assert.deepEqual(snapR4.puzzle.choiceLabels, ['A', 'B'], 'Vòng 4 phải dùng [A] vs [B]');
assert.ok(snapR4.mcSpeech.includes('Luật chơi Vòng 4'), 'Đầu Vòng 4 phải giới thiệu luật chơi Vòng 4');
assert.equal(snapR4.puzzle.isDoublePoints, true);
const count4A = VONG_4_HAN_VIET.filter((q) => Array.isArray(q.fixedOptions)).length;
const count4B = VONG_4_HAN_VIET.filter((q) => !q.fixedOptions).length;
assert.equal(count4A, 160, 'Vòng 4 phải có đúng 160 câu Dạng 4A (Phân tích từ trong câu: Thuần Việt vs Hán Việt)');
assert.equal(count4B, 160, 'Vòng 4 phải có đúng 160 câu Dạng 4B (Đối chiếu 2 từ đồng nghĩa: Thuần Việt vs Hán Việt)');
const ansR4 = engine.getSampleCorrectAnswer();
assert.ok(ansR4 === 'A' || ansR4 === 'B', 'Đáp án mẫu Vòng 4 phải là A hoặc B');
const hitR4 = engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: ansR4, createTime: now + 15_200 }, now + 15_200);
assert.equal(hitR4.kind, 'correct');
assert.ok((hitR4.points ?? 0) >= 300, 'Trả lời đúng đầu giờ Vòng 4 nhân đôi điểm phải đạt >= 300đ');

// 7. Kiểm thử Pha Mở Đáp Án:
// - Vòng 1 & 2 mở đáp án siêu tốc 4s, không hiện hộp giải thích dài dòng (explanation === undefined)
// - Vòng 4 mở đáp án hiện hộp Phân Tích Thuần Việt & Hán Việt + Cơ chế Voice-Sync Hold
engine.jumpToRound(0, now + 14_000);
engine.tick(now + 14_000 + 19_000, false); // Hết giờ Vòng 1 -> reveal 4s
const revealV1 = engine.getSnapshot(now + 33_100);
assert.equal(revealV1.phase, 'reveal');
assert.equal(revealV1.totalSeconds, 4, 'Vòng 1 mở đáp án nhanh 4 giây');
assert.equal(revealV1.puzzle.explanation, undefined, 'Vòng 1 không hiện hộp giải thích dài dòng');

engine.jumpToRound(3, now + 15_000);
const ansR4AfterJump = engine.getSampleCorrectAnswer();
engine.submitChat({ username: 'lan99', nickname: 'Lan Anh', comment: ansR4AfterJump, createTime: now + 15_200 }, now + 15_200);
const holdRes = engine.tick(now + 15_000 + 26_000, true); // Hết giờ nhưng MC vẫn đang nói (holdForVoice = true)
assert.equal(holdRes.phaseChanged, undefined, 'Khi MC đang nói dở (holdForVoice = true), chưa được cắt ngang chuyển cảnh');
const releaseRes = engine.tick(now + 15_000 + 26_500, false); // MC vừa đọc dứt chữ cuối (holdForVoice = false) -> chuyển cảnh ngay
assert.equal(releaseRes.phaseChanged, 'reveal');
const revealSnap = engine.getSnapshot(now + 41_600);
assert.equal(revealSnap.phase, 'reveal');
assert.ok(revealSnap.puzzle.explanation, 'Pha reveal ở Vòng 4 phải trả về lời phân tích Thuần Việt & Hán Việt');
assert.ok(revealSnap.puzzle.revealedChoice === 1 || revealSnap.puzzle.revealedChoice === 2);

// 8. Kiểm thử Đua điểm 3 miền & Quà tặng không cộng điểm
assert.ok(revealSnap.regions.B > 0, 'Điểm đội Miền Bắc phải cộng dồn từ người chơi phe Bắc');
assert.equal(revealSnap.leadingRegion, 'B');
const scoreBeforeGift = revealSnap.leaderboard[0].score;
engine.addGift({ nickname: 'Lan Anh', giftName: 'Pháo hoa vinh quy', diamondCount: 299, repeatCount: 1 }, now + 41_700);
const afterGiftSnap = engine.getSnapshot(now + 41_800);
assert.equal(afterGiftSnap.leaderboard[0].score, scoreBeforeGift, 'Quà tặng tuyệt đối không cộng điểm gian lận');
assert.equal(afterGiftSnap.giftBanner?.big, true);

// 9. Kiểm thử đổi thời gian đoán 4 vòng (thoiGianVong) & Thời gian mở đáp án Vòng 4 (thoiGianMoDapAn)
assert.ok(revealSnap.totalSeconds >= 7, `Thời gian mở đáp án Vòng 4 phải >= 7s (hiện tại: ${revealSnap.totalSeconds}s)`);
engine.setRevealSeconds(11);
assert.equal(engine.getRevealSeconds(), 11);
assert.ok(engine.getSnapshot(now + 41_800).totalSeconds >= 11, 'Khi chỉnh thời gian mở đáp án lên 11s phải áp dụng ngay');

engine.setRoundSeconds([12, 14, 15, 18]);
assert.deepEqual(engine.getRoundSeconds(), [12, 14, 15, 18]);
engine.jumpToRound(0, now + 50_000);
assert.equal(engine.getSnapshot(now + 50_000).totalSeconds, 12);
engine.setRoundSeconds([25, 28, 30, 35]);
assert.equal(engine.getSnapshot(now + 50_000).totalSeconds, 25, 'Đổi thời gian khi đang chơi phải cập nhật ngay');

// 10. Kiểm thử miễn trừ 5 giây đầu câu bù độ trễ OBS (trả lời ở giây thứ 4.8 vẫn đạt 100% điểm tối đa 120đ ở Vòng 1)
const obsHit = engine.submitChat(
  { username: 'obs_viewer', nickname: 'Khán giả OBS', comment: engine.getSampleCorrectAnswer(), createTime: now + 50_000 + 4_800 },
  now + 50_000 + 4_800
);
assert.equal(obsHit.kind, 'correct');
assert.equal(obsHit.points, 120, 'Khán giả bị trễ sóng OBS 4.8s trả lời ngay khi thấy đề vẫn phải đạt 100% điểm tối đa (120đ)');

console.log('✅ Tất cả 20 bài kiểm thử Vua Chính Tả (1 vs 2 · Bút Sa Gà Chết · Bù Trễ OBS & Đọc Giải Thích) đều PASS tuyệt đối!');

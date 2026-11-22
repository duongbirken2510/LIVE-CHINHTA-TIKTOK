/**
 * Kho dữ liệu 1.550 câu hỏi Chính Tả Tiếng Việt cho "VUA CHÍNH TẢ — ĐẤU TRƯỜNG TIẾNG VIỆT 1 VS 2"
 * Mỗi vòng từ 320 đến 450 câu hỏi độc nhất (tổng cộng 1.550 câu):
 * - Vòng 1 (kho-vong-1.ts): 420 câu Phụ Âm Đầu Dễ Nhầm (S/X, Ch/Tr, D/Gi/R, L/N, G/Gh, Ng/Ngh, V/D)
 * - Vòng 2 (kho-vong-2.ts): 450 câu Dấu Hỏi / Ngã & Vần Cuối (?/~, c/t, n/ng, i/y, ao/au, ai/ay, iu/iêu, uôn/uân)
 * - Vòng 3 (kho-vong-3.ts): 360 câu Bắt Lỗi Chính Tả Trong Câu (ĐÚNG CHÍNH TẢ vs SAI CHÍNH TẢ)
 * - Vòng 4 (kho-vong-4.ts): 320 câu Phân Tích Từ Thuần Việt & Từ Hán Việt · Điểm Nhân Đôi ×2
 */

import { VONG_1_PHU_AM } from './kho-vong-1';
import { VONG_2_DAU_VAN } from './kho-vong-2';
import { VONG_3_BAT_LOI_CAU } from './kho-vong-3';
import { VONG_4_HAN_VIET } from './kho-vong-4';

export interface ChinhTaQuestion {
  id: string;
  round: 1 | 2 | 3 | 4;
  categoryTag: string;
  optionCorrect: string;
  optionWrong: string;
  contextHint: string;
  explanation: string;
  /** Vòng 3 (Bắt lỗi câu) & Vòng 4 Dạng 4A (Phân tích từ trong câu): tách câu văn để tô nổi bật từ khóa */
  sentenceBefore?: string;
  highlightWord?: string;
  sentenceAfter?: string;
  isSentenceCorrect?: boolean;
  /** Cố định nhãn 2 thẻ phương án (VD Vòng 4 Dạng 4A: ['TỪ THUẦN VIỆT', 'TỪ HÁN VIỆT']) */
  fixedOptions?: [string, string];
}

export { VONG_1_PHU_AM, VONG_2_DAU_VAN, VONG_3_BAT_LOI_CAU, VONG_4_HAN_VIET };

export const ALL_CHINHTA_QUESTIONS: ChinhTaQuestion[] = [
  ...VONG_1_PHU_AM,
  ...VONG_2_DAU_VAN,
  ...VONG_3_BAT_LOI_CAU,
  ...VONG_4_HAN_VIET,
];

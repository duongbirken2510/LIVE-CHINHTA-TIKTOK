/**
 * Chuẩn hóa tiếng Việt & nhận diện lựa chọn xen kẽ [1]/[2] (câu lẻ) và [A]/[B] (câu chẵn) trên TikTok LIVE.
 * - Hỗ trợ chuẩn hóa vị trí dấu kiểu cũ / kiểu mới (oà === òa, uý === úy, oè === òe)
 * - Chế độ '12' (câu 1, 3, 5): chỉ nhận "1", "2", "so 1", "số 2", "1 nha", "chon 2"... (từ chối A/B để chống trôi đáp án câu trước do trễ sóng OBS)
 * - Chế độ 'AB' (câu 2, 4): chỉ nhận "A", "B", "a", "b", "câu A", "chọn B", "A nha", "đáp án B"... (từ chối 1/2 để chống trôi đáp án câu trước & chống TikTok chặn spam comment trùng)
 * - Hoặc khớp trực tiếp với văn bản Phương án 1 / Phương án 2 / các alias bổ sung
 */

export type ChoiceMode = '12' | 'AB';

const TONE_MAP: Array<[RegExp, string]> = [
  [/oà/g, 'òa'], [/oá/g, 'óa'], [/oả/g, 'ỏa'], [/oã/g, 'õa'], [/oạ/g, 'ọa'],
  [/oè/g, 'òe'], [/oé/g, 'óe'], [/oẻ/g, 'ỏe'], [/oẽ/g, 'õe'], [/oẹ/g, 'ọe'],
  [/uỳ/g, 'ùy'], [/uý/g, 'úy'], [/uỷ/g, 'ủy'], [/uỹ/g, 'ũy'], [/uỵ/g, 'ụy'],
];

export function normalizeAnswer(raw: string): string {
  if (!raw) return '';
  let s = raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/^(?:đáp án|câu trả lời|từ|chữ|là|chọn|phương án)\s*[:=-]?\s*/iu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [re, to] of TONE_MAP) {
    s = s.replace(re, to);
  }
  return s;
}

export function stripDiacritics(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSameVietnamese(input: string, target: string): boolean {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(target);
  return Boolean(a && b && a === b);
}

/**
 * Nhận diện lựa chọn 1 hoặc 2 từ bình luận của khán giả theo chế độ xen kẽ '12' (câu lẻ) hoặc 'AB' (câu chẵn):
 * - Chế độ '12': nhận "1", "2", "11", "22", "so 1", "số 2", "1 nha", "chon 2"... (bỏ qua A/B)
 * - Chế độ 'AB': nhận "A", "B", "a", "b", "aa", "bb", "câu A", "chọn B", "đáp án A", "A nha", "B nhé"... (bỏ qua 1/2)
 * - Từ chối nếu trong cùng 1 bình luận gõ cả 2 phương án ("1 2", "1 hoặc 2", "A B", "A hay B") để chống gian lận
 * - Hoặc khớp trực tiếp với văn bản Phương án 1 / Phương án 2 / các alias bổ sung
 */
export function parsePlayerChoice(
  raw: string,
  option1Text: string,
  option2Text: string,
  extraAliases?: { choice1?: string[]; choice2?: string[] },
  mode: ChoiceMode = '12'
): 1 | 2 | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Kiểm tra nếu người chơi gõ trực tiếp nội dung từ khóa của Phương án 1 hoặc Phương án 2
  if (option1Text && isSameVietnamese(trimmed, option1Text)) return 1;
  if (option2Text && isSameVietnamese(trimmed, option2Text)) return 2;

  if (extraAliases?.choice1?.some((alias) => isSameVietnamese(trimmed, alias))) return 1;
  if (extraAliases?.choice2?.some((alias) => isSameVietnamese(trimmed, alias))) return 2;

  // Ở chế độ 'AB', cắt tiểu từ lịch sự có dấu ở cuối câu ("ạ", "à") trước khi bỏ dấu để "B ạ" không bị nhầm thành có cả B lẫn A
  const cleanedForAscii =
    mode === 'AB' ? trimmed.normalize('NFC').replace(/\s+[ạàáảã]+[.!~?]*$/iu, '').trim() : trimmed;
  const ascii = stripDiacritics(cleanedForAscii);
  if (!ascii) return null;

  if (mode === 'AB') {
    // Nếu gõ cả A và B trong cùng 1 bình luận (VD: "a b", "a hay b", "a hoac b", "a va b") -> Từ chối
    const hasA = /(?:^|\s)a+(?:\s|$)/.test(ascii);
    const hasB = /(?:^|\s)b+(?:\s|$)/.test(ascii);
    if (hasA && hasB) return null;

    if (/^a+$/.test(ascii)) return 1;
    if (/^b+$/.test(ascii)) return 2;

    const prefixPatternA =
      /^(?:cau|dap an|phuong an|chon|o|phe|ben|chot|chu|em chon|minh chon)\s*a+(?:\s+(?:nha|nhe|di|dung|chuan|chac|luon|oi|thay|ad))?$/;
    const suffixPatternA =
      /^a+\s+(?:nha|nhe|di|dung|chuan|chac|luon|oi|thay|ad|nha thay|nhe thay|dung roi)$/;
    if (prefixPatternA.test(ascii) || suffixPatternA.test(ascii)) return 1;

    const prefixPatternB =
      /^(?:cau|dap an|phuong an|chon|o|phe|ben|chot|chu|em chon|minh chon)\s*b+(?:\s+(?:nha|nhe|di|dung|chuan|chac|luon|oi|thay|ad))?$/;
    const suffixPatternB =
      /^b+\s+(?:nha|nhe|di|dung|chuan|chac|luon|oi|thay|ad|nha thay|nhe thay|dung roi)$/;
    if (prefixPatternB.test(ascii) || suffixPatternB.test(ascii)) return 2;

    return null;
  }

  // Chế độ mặc định '12':
  // Nếu người chơi cố tình gõ cả số 1 và số 2 trong cùng 1 comment (VD: "1 2", "1 hay 2", "1 va 2") -> Từ chối
  const hasOne = /(?:^|\s)(?:1+|01|mot)(?:\s|$)/.test(ascii);
  const hasTwo = /(?:^|\s)(?:2+|02|hai)(?:\s|$)/.test(ascii);
  if (hasOne && hasTwo) return null;

  // 2. Chỉ gõ "1", "11", "111", "01" hoặc "2", "22", "222", "02"
  if (/^(?:1+|01)$/.test(ascii)) return 1;
  if (/^(?:2+|02)$/.test(ascii)) return 2;

  // 3. Các mẫu tự nhiên trên TikTok LIVE:
  // "so 1", "chon 1", "dap an 1", "phuong an 1", "cau 1", "o 1", "phe 1", "ben 1", "chot 1"
  // hoặc "1 nha", "1 nhe", "1 a", "1 di", "1 dung", "1 chuan", "1 chac", "1 luon", "1 oi"
  const prefixPattern1 =
    /^(?:so|chon|dap an|phuong an|cau|o|phe|ben|chot|em chon|minh chon)\s*(?:so\s*)?(?:1+|01|mot)(?:\s+(?:nha|nhe|a|ạ|di|dung|chuan|luon|oi|thay|ad))?$/;
  const suffixPattern1 =
    /^(?:1+|01)\s+(?:nha|nhe|a|di|dung|chuan|chac|luon|oi|thay|ad|nha thay|nhe thay|a thay|dung roi)$/;
  if (prefixPattern1.test(ascii) || suffixPattern1.test(ascii)) return 1;

  const prefixPattern2 =
    /^(?:so|chon|dap an|phuong an|cau|o|phe|ben|chot|em chon|minh chon)\s*(?:so\s*)?(?:2+|02|hai)(?:\s+(?:nha|nhe|a|ạ|di|dung|chuan|luon|oi|thay|ad))?$/;
  const suffixPattern2 =
    /^(?:2+|02)\s+(?:nha|nhe|a|di|dung|chuan|chac|luon|oi|thay|ad|nha thay|nhe thay|a thay|dung roi)$/;
  if (prefixPattern2.test(ascii) || suffixPattern2.test(ascii)) return 2;

  return null;
}

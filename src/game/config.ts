export const GAME = {
  tieuDeMacDinh: 'VUA CHÍNH TẢ',
  tenMcMacDinh: 'Học Giả Quốc Ngữ',
  cuuTroTim: 200, // Đủ 200 tim miễn phí cả phòng: kích hoạt Gợi Ý Ngữ Nghĩa / Loại Trừ
  chuoiMoi: 3, // Chọn đúng liền 3 câu: thưởng nóng +100 điểm
  chuoiThuong: 100,
  buTreObsMs: 5_000, // Miễn trừ 5 giây đầu câu bù độ trễ hình ảnh OBS để người xem trên điện thoại vẫn đạt 100% điểm tối đa
  thoiGianMoDapAnMacDinh: 9, // 9 giây cơ bản mở đáp án (tự co giãn lên 10-12s nếu lời giải thích dài)

  vong: [
    {
      ma: 'phu-am' as const,
      nhan: 'Phụ Âm Đầu Dễ Nhầm',
      phuDe: 'S / X · Ch / Tr · D / Gi / R · L / N — Gõ [1] hoặc [2]',
      luatChoi: 'Luật chơi Vòng 1: Bình luận số 1 hoặc số 2 để chọn từ viết đúng phụ âm đầu!',
      soCau: 5,
      giay: 18,
      diemMax: 120,
      diemSan: 50,
      heSo: 1,
    },
    {
      ma: 'dau-van' as const,
      nhan: 'Dấu Hỏi / Ngã & Vần Cuối',
      phuDe: '? / ~ · c / t · n / ng · i / y — Gõ [A] hoặc [B]',
      luatChoi: 'Luật chơi Vòng 2: Chuyển sang bình luận chữ A hoặc chữ B để chọn từ đúng dấu và vần cuối!',
      soCau: 5,
      giay: 20,
      diemMax: 140,
      diemSan: 60,
      heSo: 1,
    },
    {
      ma: 'bat-loi-cau' as const,
      nhan: 'Bắt Lỗi Chính Tả Trong Câu',
      phuDe: '[1] ĐÚNG CHÍNH TẢ  vs  [2] SAI CHÍNH TẢ',
      luatChoi: 'Luật chơi Vòng 3: Xem từ in đậm trong câu văn, gõ số 1 nếu viết Đúng hoặc số 2 nếu viết Sai!',
      soCau: 5,
      giay: 22,
      diemMax: 160,
      diemSan: 70,
      heSo: 1,
    },
    {
      ma: 'han-viet' as const,
      nhan: 'Thuần Việt & Hán Việt ×2',
      phuDe: 'Phân Tích Nguồn Gốc Từ Vựng · Gõ [A] hoặc [B] (×2 Điểm)',
      luatChoi: 'Luật chơi Vòng 4 nhân đôi điểm số: Bình luận chữ A hoặc chữ B để phân tích từ Thuần Việt và Hán Việt!',
      soCau: 5,
      giay: 25,
      diemMax: 320,
      diemSan: 160,
      heSo: 2,
    },
  ],

  thoiGianMacDinh: [18, 20, 22, 25] as [number, number, number, number],

  presets: [
    {
      label: '⚡ Nhịp Nhanh (12·14·15·18s | Mở ĐA 8s)',
      shortLabel: '⚡ Nhịp Nhanh',
      vals: [12, 14, 15, 18] as [number, number, number, number],
      revealSec: 8,
    },
    {
      label: '🎯 Chuẩn Live TikTok (18·20·22·25s | Mở ĐA 9s)',
      shortLabel: '🎯 Chuẩn Live TikTok',
      vals: [18, 20, 22, 25] as [number, number, number, number],
      revealSec: 9,
    },
    {
      label: '☕ Thong Thả (25·28·30·35s | Mở ĐA 11s)',
      shortLabel: '☕ Thong Thả',
      vals: [25, 28, 30, 35] as [number, number, number, number],
      revealSec: 11,
    },
  ],

  chuanHoaThoiGian: (raw?: unknown): [number, number, number, number] => {
    const def: [number, number, number, number] = [18, 20, 22, 25];
    if (!Array.isArray(raw) || raw.length < 4) return def;
    return [0, 1, 2, 3].map((i) => {
      const n = Math.round(Number(raw[i]));
      return Number.isFinite(n) ? Math.min(300, Math.max(5, n)) : def[i];
    }) as [number, number, number, number];
  },

  chuanHoaThoiGianMoDapAn: (raw?: unknown): number => {
    const n = Math.round(Number(raw));
    return Number.isFinite(n) ? Math.min(30, Math.max(4, n)) : 9;
  },

  danhHieu: (hang: number) => {
    if (hang === 1) return '👑 Vua Chính Tả';
    if (hang === 2) return '🥈 Trạng Nguyên Quốc Ngữ';
    if (hang === 3) return '🥉 Bảng Nhãn Tinh Anh';
    if (hang <= 10) return '📜 Thám Hoa Chữ Việt';
    return '✨ Yêu Tiếng Việt';
  },
};

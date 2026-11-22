import { useEffect, useState } from 'react';
import { emitTest, sendControl } from '../live/page';
import type { CaiDat } from '../live/types';
import type { GameSnapshot } from './chinhta';
import { GAME } from './config';

const CROWD_NAMES = [
  'Minh Khoa', 'Thanh Hà', 'Quốc Tuấn', 'Bảo Ngọc', 'Hoàng Nam', 'Thảo Vy', 'Đức Anh', 'Khánh Linh',
  'Trọng Nhân', 'Hải Yến', 'Tuấn Kiệt', 'Phương Thảo', 'Gia Huy', 'Ngọc Ánh', 'Văn Hùng', 'Mai Phương',
  'Nhật Minh', 'Thu Thủy', 'Đình Phong', 'Lan Hương', 'Quang Vinh', 'Bích Ngọc', 'Hữu Phước', 'Mỹ Tâm',
];

const CHOICE_1_VARIANTS = ['1', '1', 'so 1', 'số 1', '1 nha', 'chon 1', '1 nhé'];
const CHOICE_2_VARIANTS = ['2', '2', 'so 2', 'số 2', '2 nha', 'chon 2', '2 nhé'];
const CHOICE_A_VARIANTS = ['A', 'a', 'câu A', 'chon A', 'A nha', 'đáp án A', 'A nhé'];
const CHOICE_B_VARIANTS = ['B', 'b', 'câu B', 'chon B', 'B nha', 'đáp án B', 'B nhé'];

export function GameControls({
  caiDat,
  snapshot,
  sleepEndsAt,
}: {
  caiDat: CaiDat;
  snapshot: GameSnapshot;
  sleepEndsAt: number | null;
}) {
  const [tieuDe, setTieuDe] = useState(caiDat.tieuDe || GAME.tieuDeMacDinh);
  const [tenMc, setTenMc] = useState(caiDat.tenMc || GAME.tenMcMacDinh);
  const [thoiGianVong, setThoiGianVong] = useState<[number, number, number, number]>(
    GAME.chuanHoaThoiGian(caiDat.thoiGianVong)
  );
  const [thoiGianMoDapAn, setThoiGianMoDapAn] = useState<number>(
    GAME.chuanHoaThoiGianMoDapAn(caiDat.thoiGianMoDapAn)
  );
  const [savedNote, setSavedNote] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setTieuDe(caiDat.tieuDe || GAME.tieuDeMacDinh);
    setTenMc(caiDat.tenMc || GAME.tenMcMacDinh);
    if (caiDat.thoiGianVong) {
      setThoiGianVong(GAME.chuanHoaThoiGian(caiDat.thoiGianVong));
    }
    if (caiDat.thoiGianMoDapAn !== undefined) {
      setThoiGianMoDapAn(GAME.chuanHoaThoiGianMoDapAn(caiDat.thoiGianMoDapAn));
    }
  }, [caiDat.tieuDe, caiDat.tenMc, caiDat.thoiGianVong, caiDat.thoiGianMoDapAn]);

  useEffect(() => {
    if (!sleepEndsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sleepEndsAt]);

  const saveLabels = async () => {
    try {
      const r = await fetch('/api/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tieuDe, tenMc }),
      }).then((x) => x.json());
      if (r.success) {
        setSavedNote('✅ Đã cập nhật bảng hoành phi & tên Học Giả MC!');
        setTimeout(() => setSavedNote(''), 2500);
      }
    } catch {}
  };

  const saveRoundTimers = async (customTimers?: [number, number, number, number], customRevealSec?: number) => {
    const clean = GAME.chuanHoaThoiGian(customTimers ?? thoiGianVong);
    const cleanReveal = GAME.chuanHoaThoiGianMoDapAn(customRevealSec ?? thoiGianMoDapAn);
    setThoiGianVong(clean);
    setThoiGianMoDapAn(cleanReveal);
    try {
      const r = await fetch('/api/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thoiGianVong: clean, thoiGianMoDapAn: cleanReveal }),
      }).then((x) => x.json());
      if (r.success) {
        setSavedNote(
          `⏱️ Đã lưu: V1–V4 (${clean[0]}s · ${clean[1]}s · ${clean[2]}s · ${clean[3]}s) | Mở đáp án & Giải thích: ${cleanReveal}s!`
        );
        setTimeout(() => setSavedNote(''), 3000);
      }
    } catch {}
  };

  /**
   * Giả lập đám đông bình chọn [1] vs [2] (hoặc [A] vs [B] ở câu chẵn) để test hiệu ứng thanh kéo co tỷ lệ nhảy mượt mà
   */
  const simulateCrowd = (count: number, accuracyRatio = 0.65, assignAllRegions = false) => {
    const regions = ['miền Bắc', 'miền Trung', 'miền Nam'];
    const isAB = snapshot.puzzle.choiceMode === 'AB' || snapshot.sampleAnswer === 'A' || snapshot.sampleAnswer === 'B';
    const correctChoice: 1 | 2 = snapshot.sampleAnswer === '2' || snapshot.sampleAnswer === 'B' ? 2 : 1;
    const pool1 = isAB ? CHOICE_A_VARIANTS : CHOICE_1_VARIANTS;
    const pool2 = isAB ? CHOICE_B_VARIANTS : CHOICE_2_VARIANTS;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const base = CROWD_NAMES[Math.floor(Math.random() * CROWD_NAMES.length)];
        const nickname = `${base} ${Math.floor(10 + Math.random() * 89)}`;
        const username = `situ_${i}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Đầu quân đội 3 miền trước khi chốt 1/2 hoặc A/B
        if (assignAllRegions || i % 3 === 0) {
          void emitTest('chat', { username, nickname, comment: regions[i % 3] });
        }

        const isCorrectVote = Math.random() < accuracyRatio;
        const pickedChoice: 1 | 2 = isCorrectVote ? correctChoice : correctChoice === 1 ? 2 : 1;
        const pool = pickedChoice === 1 ? pool1 : pool2;
        const comment = pool[Math.floor(Math.random() * pool.length)];

        setTimeout(() => {
          void emitTest('chat', {
            username,
            nickname,
            comment,
            createTime: Date.now() - Math.floor(Math.random() * 600),
          });
        }, 100);
      }, i * 85);
    }
  };

  const remainMin = sleepEndsAt ? Math.max(0, Math.ceil((sleepEndsAt - now) / 60_000)) : 0;

  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Điều khiển Vua Chính Tả (Đấu Trường 1 vs 2)</h2>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          Vòng {snapshot.puzzle.roundIndex + 1}/4 · {snapshot.puzzle.roundLabel}
        </span>
      </div>

      {/* Đổi Tiêu đề bảng vàng & Tên Học giả MC */}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-amber-400"
          placeholder="Tiêu đề hoành phi (VD: VUA CHÍNH TẢ)"
          maxLength={34}
          value={tieuDe}
          onChange={(e) => setTieuDe(e.target.value)}
        />
        <input
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-amber-400"
          placeholder="Danh xưng MC (VD: Học Giả Quốc Ngữ)"
          maxLength={34}
          value={tenMc}
          onChange={(e) => setTenMc(e.target.value)}
        />
        <button
          onClick={saveLabels}
          className="rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
        >
          Lưu bảng tên
        </button>
      </div>
      {savedNote && <div className="text-xs text-emerald-400">{savedNote}</div>}

      {/* Điều khiển nhịp độ ván đấu */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => sendControl('custom', 'vanmoi')}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
        >
          ▶ Ván mới ngay
        </button>
        <button
          onClick={() => sendControl('custom', 'bocau')}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
        >
          ⏭ Qua câu khác
        </button>
        <button
          onClick={() => sendControl('custom', 'keugoifollow')}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          ➕ MC kêu gọi Follow ngay
        </button>
        <button
          onClick={() => sendControl('custom', 'tatlive')}
          className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          👋 MC chào kết thúc Live
        </button>
      </div>

      {/* Chuyển nhanh tới từng Vòng thi */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-400">Chuyển nhanh vòng thi:</div>
        <div className="flex flex-wrap gap-2">
          {GAME.vong.map((v, idx) => {
            const active = snapshot.puzzle.roundIndex === idx;
            return (
              <button
                key={v.ma}
                onClick={() => sendControl('custom', `vong:${idx}`)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ${
                  active
                    ? 'bg-amber-500/20 text-amber-300 ring-amber-400/50'
                    : 'bg-slate-800 text-slate-300 ring-slate-700 hover:bg-slate-700'
                }`}
              >
                Vòng {idx + 1}: {v.nhan} ({thoiGianVong[idx]}s)
              </button>
            );
          })}
        </div>
      </div>

      {/* Điều chỉnh thời gian đoán 4 vòng & Thời gian mở đáp án đọc giải thích */}
      <div className="rounded-xl bg-slate-950/60 p-3 ring-1 ring-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-300">
            ⏱️ Thời gian đoán 4 vòng & Mở đáp án đọc giải thích:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {GAME.presets.map((preset) => {
              const isMatch =
                preset.vals.every((v, i) => thoiGianVong[i] === v) && thoiGianMoDapAn === preset.revealSec;
              return (
                <button
                  key={preset.label}
                  onClick={() => saveRoundTimers(preset.vals, preset.revealSec)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition ${
                    isMatch
                      ? 'bg-amber-500/25 text-amber-200 ring-amber-400/60'
                      : 'bg-slate-800 text-slate-300 ring-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          {GAME.vong.map((v, idx) => (
            <label key={v.ma} className="flex flex-col gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 ring-1 ring-slate-800">
              <span className="truncate text-[11px] font-medium text-slate-400">
                V{idx + 1} · {v.nhan}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={thoiGianVong[idx]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setThoiGianVong((prev) => {
                      const next = [...prev] as [number, number, number, number];
                      next[idx] = val;
                      return next;
                    });
                  }}
                  className="w-full rounded bg-slate-800 px-2 py-1 text-sm font-bold text-amber-200 outline-none ring-1 ring-slate-700 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-400">s</span>
              </div>
            </label>
          ))}

          {/* Ô thứ 5: Thời gian mở đáp án & đọc giải thích từ điển */}
          <label className="flex flex-col gap-1 rounded-lg bg-emerald-950/40 px-2.5 py-1.5 ring-1 ring-emerald-500/40">
            <span className="truncate text-[11px] font-semibold text-emerald-300">
              📖 Mở ĐA & Giải thích
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={4}
                max={30}
                value={thoiGianMoDapAn}
                onChange={(e) => setThoiGianMoDapAn(Number(e.target.value))}
                className="w-full rounded bg-slate-800 px-2 py-1 text-sm font-bold text-emerald-200 outline-none ring-1 ring-emerald-600/60 focus:ring-emerald-400"
              />
              <span className="text-xs text-emerald-300/80">s</span>
            </div>
          </label>

          <button
            onClick={() => saveRoundTimers()}
            className="flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Lưu thời gian
          </button>
        </div>
        <div className="text-[11px] text-slate-400">
          💡 Đã tích hợp <b>Miễn trừ 5s đầu câu bù trễ OBS</b> (người xem trên điện thoại vẫn đạt 100% điểm tối đa) & <b>Tự động co giãn +1–3.5s</b> nếu lời giải thích từ điển dài để MC luôn đọc trọn câu.
        </div>
      </div>

      {/* Giả lập đám đông bình chọn 1/2 hoặc A/B (test thanh kéo co) */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-400">
          Giả lập đám đông bình chọn [{snapshot.puzzle.choiceLabels?.[0] || '1'}] vs [{snapshot.puzzle.choiceLabels?.[1] || '2'}] (test Thanh Kéo Co & Bảng Vàng):
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => simulateCrowd(8, 0.75, false)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            ⚡ 8 sĩ tử chọn {snapshot.puzzle.choiceLabels?.join('/') || '1/2'}
          </button>
          <button
            onClick={() => simulateCrowd(25, 0.52, false)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            🔥 25 sĩ tử chia 2 phe tranh luận
          </button>
          <button
            onClick={() => simulateCrowd(50, 0.64, true)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            🌊 50 sĩ tử đại chiến 3 miền
          </button>
        </div>
      </div>

      {/* Hẹn giờ tự chào kết thúc Live */}
      <div className="border-t border-slate-800 pt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
          <span>⏰ Hẹn giờ MC tự chào nghỉ Live:</span>
          {sleepEndsAt && <b className="text-amber-300">Còn ~{remainMin} phút</b>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[15, 30, 60, 90, 120].map((m) => (
            <button
              key={m}
              onClick={() => sendControl('custom', `hengio:${m}`)}
              className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              +{m} phút
            </button>
          ))}
          {sleepEndsAt && (
            <button
              onClick={() => sendControl('custom', 'hengio:off')}
              className="rounded-md bg-rose-900/60 px-2.5 py-1 text-xs font-medium text-rose-200 hover:bg-rose-800"
            >
              ✖ Hủy hẹn giờ
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { containsBanned, maskBanned } from '../live/bannedWords';
import { IS_STAGE, MUTE, STAGE_ID } from '../live/page';
import type { AudioConfig, CaiDat, LiveStatus } from '../live/types';
import { useLiveEvents } from '../live/useLiveEvents';
import { speakableName, voice } from '../live/voice';
import { ChinhTaEngine, type GameSnapshot } from './chinhta';
import { GAME } from './config';
import { sfx } from './sfx';

export interface WeeklyTopEntry {
  id: string;
  name: string;
  avatar: string;
  diem: number;
}

const DEFAULT_AUDIO: AudioConfig = {
  masterEnabled: true,
  musicEnabled: true,
  voiceEnabled: true,
  musicVolume: 0.16,
  sfxVolume: 0.45,
  voiceVolume: 1,
};

const REGION_LABEL = { B: 'Miền Bắc', T: 'Miền Trung', N: 'Miền Nam' } as const;

/**
 * Kho 16 lời khen đa dạng, giàu sắc thái văn chương cho sĩ tử mở hàng trả lời đúng đầu tiên
 * (xoay vòng liên tục để không bao giờ lặp lại nhàm chán cụm "Quá nhanh!").
 */
const FIRST_SOLVE_PRAISES: Array<(name: string, choice: string | number, pts: number) => string> = [
  (name, choice, pts) => `Xuất sắc! ${name} mở hàng chọn phương án ${choice}, ghi ${pts} điểm!`,
  (name, choice, pts) => `Chuẩn xác tuyệt đối! ${name} dẫn đầu câu này với phương án ${choice}, cộng ${pts} điểm!`,
  (name, choice, pts) => `Nhanh như chớp! ${name} chốt ngay phương án ${choice}, rinh ${pts} điểm đầu tiên!`,
  (name, choice, pts) => `Mở hàng hồng phát! Chúc mừng ${name} chọn đúng phương án ${choice}, nhận ${pts} điểm!`,
  (name, choice, pts) => `Kiến thức uyên bác! ${name} giải mã thành công phương án ${choice}, bỏ túi ${pts} điểm!`,
  (name, choice, pts) => `Nhãn quan sắc bén! ${name} là người đầu tiên chọn đúng phương án ${choice}, cộng ${pts} điểm!`,
  (name, choice, pts) => `Tuyệt vời! ${name} nổ phát súng đầu tiên ở phương án ${choice} với ${pts} điểm!`,
  (name, choice, pts) => `Xứng danh kỳ tài chữ Việt! ${name} chốt chuẩn phương án ${choice}, ghi ngay ${pts} điểm!`,
  (name, choice, pts) => `Đỉnh cao phản xạ! ${name} mở điểm câu này ở phương án ${choice}, nhận ${pts} điểm!`,
  (name, choice, pts) => `Không lệch một ly! ${name} tiên phong chọn đúng phương án ${choice}, cộng ${pts} điểm!`,
  (name, choice, pts) => `Quá bản lĩnh! ${name} dẫn đầu bảng câu này với phương án ${choice}, mang về ${pts} điểm!`,
  (name, choice, pts) => `Tinh anh xuất lộ! ${name} chọn chính xác phương án ${choice}, ghi ${pts} điểm!`,
  (name, choice, pts) => `Một pha chốt đáp án cực kỳ quyết đoán của ${name} ở phương án ${choice}, cộng ${pts} điểm!`,
  (name, choice, pts) => `Trí tuệ hơn người! ${name} mở bát chuẩn chỉnh phương án ${choice}, nhận ${pts} điểm!`,
  (name, choice, pts) => `Phong độ rực rỡ! ${name} chiếm ngôi đầu câu này với phương án ${choice}, ghi ${pts} điểm!`,
  (name, choice, pts) => `Thật đáng nể! ${name} khai bút chuẩn xác ở phương án ${choice}, bỏ túi ${pts} điểm!`,
];

const STREAK_BONUS_PRAISES: Array<(name: string, pts: number) => string> = [
  (name, pts) => `${name} lập chuỗi ba câu đúng liên tiếp, thưởng nóng ${pts} điểm!`,
  (name, pts) => `Phong độ hủy diệt! ${name} thông cả ba câu liền, nhận tổng ${pts} điểm!`,
  (name, pts) => `Tam liên thắng cho ${name}! Thưởng nóng chuỗi ba câu với ${pts} điểm!`,
  (name, pts) => `Bách phát bách trúng! ${name} đúng liền ba câu, mang về ${pts} điểm!`,
];

const buildIdleLines = (channelName: string, choiceLabels: ['1', '2'] | ['A', 'B'] = ['1', '2']) => {
  const [lbl1, lbl2] = choiceLabels;
  return [
    `Các sĩ tử chỉ cần gõ ${lbl1} hoặc ${lbl2} ngay dưới bình luận nhé! Nhớ kỹ luật bút sa gà chết, hệ thống chỉ tính lựa chọn đầu tiên thôi!`,
    `Quý sĩ tử mới vào phòng nhớ bấm nút Follow kênh ${channelName} ở góc trên bên trái màn hình để lưu điểm Bảng Vàng Tuần và thử tài chính tả mỗi ngày nhé!`,
    `Thanh kéo co đang nhảy liên tục! Phe ${lbl1} hay phe ${lbl2} sẽ chiến thắng ở câu này đây?`,
    `Gõ Bắc, Trung hoặc Nam vào bình luận để đầu quân cho đội quê hương ba miền, và đừng quên bấm Follow ${channelName} nhé!`,
    'Cả phòng cùng thả đủ hai trăm tim miễn phí là hệ thống tự động mở gợi ý ngữ nghĩa cứu trợ ngay!',
  ];
};

export function useGame() {
  const engineRef = useRef<ChinhTaEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new ChinhTaEngine();
  }
  const engine = engineRef.current;

  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [caiDat, setCaiDat] = useState<CaiDat>({
    tieuDe: GAME.tieuDeMacDinh,
    tenMc: GAME.tenMcMacDinh,
    channelName: 'Vua Chính Tả',
    thoiGianVong: [...GAME.thoiGianMacDinh],
    thoiGianMoDapAn: GAME.thoiGianMoDapAnMacDinh,
  });
  const [audioCfg, setAudioCfg] = useState<AudioConfig>(DEFAULT_AUDIO);
  const [adminMonitor, setAdminMonitor] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chinhta_admin_monitor') === '1';
    } catch {
      return false;
    }
  });
  const [stageInfo, setStageInfo] = useState<{ id: string | null; count: number }>({
    id: IS_STAGE ? STAGE_ID : null,
    count: IS_STAGE ? 1 : 0,
  });
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [serverStopped, setServerStopped] = useState(false);
  const [weeklyTop, setWeeklyTop] = useState<WeeklyTopEntry[]>([]);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [localSnap, setLocalSnap] = useState<GameSnapshot>(() => engine.getSnapshot());
  const [remoteSnap, setRemoteSnap] = useState<GameSnapshot | null>(null);

  const isPrimaryStage = IS_STAGE && (stageInfo.id === null || stageInfo.id === STAGE_ID);
  const isEngineOwner = IS_STAGE ? isPrimaryStage : stageInfo.count === 0;
  const isOwnerRef = useRef(isEngineOwner);
  isOwnerRef.current = isEngineOwner;

  const caiDatRef = useRef(caiDat);
  caiDatRef.current = caiDat;

  const sleepRef = useRef<number | null>(null);
  sleepRef.current = sleepEndsAt;

  const lastGreetAtRef = useRef(0);
  const lastFollowAtRef = useRef(0);
  const lastIdleAtRef = useRef(Date.now());
  const lastLockedWarnAtRef = useRef(0);
  const idleIdxRef = useRef(0);
  const praiseIdxRef = useRef(0);
  const streakPraiseIdxRef = useRef(0);
  const lastCountdownSecRef = useRef(-1);
  const lastBroadcastJsonRef = useRef('');

  // Kết nối bộ nén pre-ducking 95% & khuếch đại giọng MC 1.55x
  useEffect(() => {
    voice.onSpeakingChange = (speaking) => sfx.setDucking(speaking);
    voice.boostProvider = (el, vol) => sfx.boostVoiceElement(el, vol);
    voice.onBlocked = () => setAudioBlocked(true);
    return () => {
      voice.onSpeakingChange = undefined;
      voice.boostProvider = undefined;
      voice.onBlocked = undefined;
    };
  }, []);

  // Tải lịch sử câu đã hỏi & bảng vàng tuần khi khởi động
  useEffect(() => {
    fetch('/api/da-hoi')
      .then((r) => r.json())
      .then((used) => {
        if (used && typeof used === 'object' && Object.keys(used).length > 0 && isOwnerRef.current) {
          const prevSec = engineRef.current?.getRoundSeconds();
          const prevReveal = engineRef.current?.getRevealSeconds();
          engineRef.current = new ChinhTaEngine(used);
          if (prevSec) engineRef.current.setRoundSeconds(prevSec);
          if (prevReveal) engineRef.current.setRevealSeconds(prevReveal);
          setLocalSnap(engineRef.current.getSnapshot());
        }
      })
      .catch(() => {});

    fetch('/api/bang-tuan')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.top)) setWeeklyTop(d.top);
      })
      .catch(() => {});
  }, []);

  // Đồng bộ quyền phát tiếng (Stage chính hoặc nút Nghe tại Admin)
  useEffect(() => {
    const canOut = IS_STAGE ? !MUTE && isPrimaryStage : adminMonitor;
    voice.setSpeaker(IS_STAGE ? !MUTE && isPrimaryStage : false);
    voice.setAdminMonitor(!IS_STAGE && adminMonitor);
    voice.applyConfig(audioCfg);
    sfx.setCanOutput(canOut);
    sfx.applyConfig(audioCfg);
  }, [audioCfg, adminMonitor, isPrimaryStage]);

  // Tự mở khóa WebAudio ngay lần chạm chuột / phím đầu tiên
  useEffect(() => {
    const unlock = () => {
      setAudioBlocked(false);
      sfx.resume();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const syncSnapshot = useCallback((forcePost = false) => {
    const cur = engineRef.current!;
    const snap = cur.getSnapshot();
    setLocalSnap(snap);
    if (IS_STAGE && isOwnerRef.current) {
      const json = JSON.stringify(snap);
      if (forcePost || json !== lastBroadcastJsonRef.current) {
        lastBroadcastJsonRef.current = json;
        void fetch('/api/game/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
        }).catch(() => {});
      }
    }
  }, []);

  const persistMatchResults = useCallback(() => {
    const cur = engineRef.current!;
    void fetch('/api/da-hoi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cur.getUsedHistory()),
    }).catch(() => {});

    const ds = [...cur.players.values()]
      .filter((p) => p.score > 0)
      .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, diem: p.score }));
    if (ds.length > 0) {
      fetch('/api/bang-tuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ds }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d?.top)) setWeeklyTop(d.top);
        })
        .catch(() => {});
    }
  }, []);

  // Vòng lặp 250ms điều phối ván đấu trên tab chủ quản
  useEffect(() => {
    if (!isEngineOwner) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const cur = engineRef.current!;

      // Kiểm tra hẹn giờ tự động chào kết thúc Live
      if (sleepRef.current && now >= sleepRef.current) {
        setSleepEndsAt(null);
        sfx.play('fanfare');
        voice.say(
          `Đã tới giờ nghỉ ngơi hẹn trước! ${caiDatRef.current.channelName} xin cảm ơn quý sĩ tử đã tham gia tranh tài và hẹn gặp lại ở phiên live tiếp theo!`,
          true
        );
      }

      // Cơ chế Voice-Sync Hold: Nếu MC vẫn đang đọc dở hoặc vừa dứt chữ < 450ms thì giữ cảnh chờ đọc xong mới chuyển
      const holdForVoice = voice.busy || voice.quietForMs(now) < 450;
      const res = cur.tick(now, holdForVoice);
      const snap = cur.getSnapshot(now);

      if (res.phaseChanged) {
        lastCountdownSecRef.current = -1;
        if (res.phaseChanged === 'reveal') {
          sfx.play('gong');
          voice.stop();
          voice.say(cur.mcSpeech, true);
        } else if (res.phaseChanged === 'round_board') {
          sfx.play('drum');
          voice.stop();
          voice.say(cur.mcSpeech, true);
        } else if (res.phaseChanged === 'podium') {
          sfx.play('fanfare');
          voice.stop();
          voice.say(cur.mcSpeech, true);
          if (res.matchFinished) persistMatchResults();
        } else if (res.phaseChanged === 'playing') {
          sfx.play(snap.puzzle.questionInRound === 1 ? 'drum' : 'reveal');
          voice.stop();
          voice.say(cur.mcSpeech, true);
          voice.prefetch(cur.getCurrentRevealSpeech());
        }
      } else if (snap.phase === 'playing') {
        // Tiếng gõ mõ 5 giây cuối
        if (snap.secondsLeft >= 1 && snap.secondsLeft <= 5 && snap.secondsLeft !== lastCountdownSecRef.current) {
          lastCountdownSecRef.current = snap.secondsLeft;
          sfx.play('tick');
        }
        // MC khuấy động tự nhiên & kêu gọi Follow xen kẽ khi phòng im ắng lâu
        if (snap.secondsLeft >= 7 && voice.quietForMs(now) > 15_000 && now - lastIdleAtRef.current > 17_000) {
          lastIdleAtRef.current = now;
          const lines = buildIdleLines(caiDatRef.current.channelName, snap.puzzle.choiceLabels);
          const line = lines[idleIdxRef.current % lines.length];
          idleIdxRef.current += 1;
          voice.say(line);
        }
      }

      syncSnapshot();
    }, 250);

    return () => clearInterval(timer);
  }, [isEngineOwner, persistMatchResults, syncSnapshot]);

  useLiveEvents({
    onStatus: (s) => setStatus(s),
    onCaiDat: (c) => {
      setCaiDat(c);
      if (engineRef.current) {
        if (c.thoiGianVong) engineRef.current.setRoundSeconds(c.thoiGianVong);
        if (c.thoiGianMoDapAn !== undefined) engineRef.current.setRevealSeconds(c.thoiGianMoDapAn);
        syncSnapshot(true);
      }
    },
    onAudioCfg: (a) => setAudioCfg(a),
    onSpeaker: (info) => setStageInfo(info),
    onShutdown: () => {
      voice.stop();
      sfx.setCanOutput(false);
      setServerStopped(true);
    },
    onGameState: (s) => {
      if (!IS_STAGE && s && s.puzzle) setRemoteSnap(s as GameSnapshot);
    },
    onChat: (ev) => {
      if (!isOwnerRef.current) return;
      if (containsBanned(ev.comment)) return;
      const safeNick = maskBanned(ev.nickname || ev.username || 'Sĩ tử');
      const res = engineRef.current!.submitChat({ ...ev, nickname: safeNick });
      const spName = speakableName(safeNick);
      const curSnap = engineRef.current!.getSnapshot();
      // Chỉ chèn thoại phụ khi MC đã đọc xong câu đề bài chính (!voice.busy) và đồng hồ còn >= 7 giây
      // để tránh xếp chồng hàng đợi khiến câu nói kéo dài quá thời gian câu hỏi rồi bị ngắt khi mở đáp án
      const canInsertSideSpeech = curSnap.phase === 'playing' && curSnap.secondsLeft >= 7 && !voice.busy;

      if (res.kind === 'region' && res.region) {
        sfx.play('solve');
        if (canInsertSideSpeech && voice.quietForMs() > 6_000) {
          voice.say(`${spName} đầu quân về đội ${REGION_LABEL[res.region]}!`);
        }
        syncSnapshot(true);
        return;
      }

      if (res.kind === 'correct') {
        sfx.play('solve');
        if (canInsertSideSpeech) {
          if (res.rankInStep === 1) {
            const buildPraise = FIRST_SOLVE_PRAISES[praiseIdxRef.current % FIRST_SOLVE_PRAISES.length];
            praiseIdxRef.current += 1;
            voice.say(buildPraise(spName, res.choiceLabel || res.choice || '1', res.points || 0));
          } else if (res.streakBonus) {
            const buildStreak = STREAK_BONUS_PRAISES[streakPraiseIdxRef.current % STREAK_BONUS_PRAISES.length];
            streakPraiseIdxRef.current += 1;
            voice.say(buildStreak(spName, res.points || 0));
          }
        }
        syncSnapshot(true);
        return;
      }

      if (res.kind === 'wrong') {
        sfx.play('wrong');
        syncSnapshot(true);
        return;
      }

      if (res.kind === 'locked_wrong') {
        const now = Date.now();
        if (canInsertSideSpeech && now - lastLockedWarnAtRef.current > 11_000 && voice.quietForMs(now) > 5_000) {
          lastLockedWarnAtRef.current = now;
          voice.say(
            `Bút sa gà chết ${spName} ơi! Đã chốt phương án ${res.lockedChoiceLabel || res.lockedChoice} rồi không quay xe sang ${res.choiceLabel || res.choice} được đâu nhé!`
          );
        }
        return;
      }

      // Khán giả trò chuyện / xin gợi ý ngoài đáp án
      if (res.kind === 'none' && canInsertSideSpeech) {
        const lower = ev.comment.toLowerCase();
        const [lbl1, lbl2] = curSnap.puzzle.choiceLabels;
        if (/(gợi ý|goi y|khó quá|kho qua|bí quá)/.test(lower) && voice.quietForMs() > 9_000) {
          voice.say(`${spName} ơi, hãy đọc kỹ ngữ cảnh trong khung cuốn thư vàng để chọn ${lbl1} hoặc ${lbl2} nhé!`);
        } else if (/(hay quá|hay qua|cuốn quá|vui quá|dễ nhầm)/.test(lower) && voice.quietForMs() > 11_000) {
          voice.say(`Cảm ơn ${spName} đã cổ vũ ${caiDatRef.current.channelName}, cùng bình luận ${lbl1} hoặc ${lbl2} so tài tiếp nào!`);
        }
      }
    },
    onLike: (ev) => {
      if (!isOwnerRef.current) return;
      engineRef.current!.addLikes(ev.likeCount || 1);
      syncSnapshot();
    },
    onGift: (ev) => {
      if (!isOwnerRef.current) return;
      const safeNick = maskBanned(ev.nickname || 'Quý nhân');
      const item = engineRef.current!.addGift({ ...ev, nickname: safeNick });
      sfx.play(item.big ? 'fanfare' : 'boost');
      const spName = speakableName(safeNick);
      const curSnap = engineRef.current!.getSnapshot();
      if (item.big) {
        voice.say(
          `Xin cảm ơn đại gia ${spName} đã trao tặng ${item.count} ${ev.giftName}, rực rỡ pháo hoa chúc mừng đấu trường ${caiDatRef.current.channelName}!`,
          true
        );
      } else if (!voice.busy && curSnap.secondsLeft >= 5) {
        voice.say(`Cảm ơn ${spName} đã gửi tặng ${ev.giftName} tiếp lửa cho các sĩ tử!`);
      }
      syncSnapshot(true);
    },
    onMember: (ev) => {
      if (!isOwnerRef.current) return;
      const now = Date.now();
      const curSnap = engineRef.current!.getSnapshot();
      if (curSnap.phase !== 'playing' || curSnap.secondsLeft < 6) return;
      if (now - lastGreetAtRef.current < 15_000 || voice.quietForMs(now) < 6_500) return;
      lastGreetAtRef.current = now;
      const spName = speakableName(maskBanned(ev.nickname || ev.username));
      const [lbl1, lbl2] = curSnap.puzzle.choiceLabels;
      voice.say(`Chào mừng ${spName} ghé thăm ${caiDatRef.current.channelName}! Gõ ${lbl1} hoặc ${lbl2} để thử tài chính tả nhé!`);
    },
    onFollow: (ev) => {
      if (!isOwnerRef.current) return;
      const now = Date.now();
      const curSnap = engineRef.current!.getSnapshot();
      if (curSnap.secondsLeft < 6 || now - lastFollowAtRef.current < 12_000 || voice.busy) return;
      lastFollowAtRef.current = now;
      const spName = speakableName(maskBanned(ev.nickname || ev.username));
      voice.say(
        `Cảm ơn ${spName} vừa bấm theo dõi ${caiDatRef.current.channelName}! Các sĩ tử mới vào phòng cũng bấm Follow ở góc trên màn hình để cùng so tài chữ Việt mỗi ngày nhé!`
      );
    },
    onControl: (cmd) => {
      if (cmd.action === 'setRate' && cmd.text) {
        const r = Number(cmd.text);
        if (Number.isFinite(r) && r >= 0.6 && r <= 1.6) {
          voice.rate = r;
          voice.clearPrefetch();
        }
        return;
      }
      if (cmd.action === 'setName' && cmd.text) {
        setCaiDat((prev) => ({ ...prev, channelName: cmd.text! }));
        return;
      }
      if (cmd.action === 'speak' && cmd.text) {
        if (isOwnerRef.current || (!IS_STAGE && adminMonitor)) {
          voice.say(cmd.text, true);
        }
        return;
      }
      if (cmd.action === 'custom' && cmd.text?.startsWith('hengio:')) {
        const arg = cmd.text.slice('hengio:'.length);
        if (arg === 'off') {
          setSleepEndsAt(null);
        } else {
          const mins = Number(arg);
          if (Number.isFinite(mins) && mins > 0) setSleepEndsAt(Date.now() + mins * 60_000);
        }
        return;
      }

      if (!isOwnerRef.current) return;
      const cur = engineRef.current!;

      if (cmd.action === 'reset' || (cmd.action === 'custom' && cmd.text === 'vanmoi')) {
        cur.matchNumber += 1;
        cur.startNewMatch();
        sfx.play('drum');
        voice.stop();
        voice.say(`Khởi tranh ván mới tại ${caiDatRef.current.channelName}! ${cur.mcSpeech}`, true);
        syncSnapshot(true);
        return;
      }

      if (cmd.action === 'custom' && cmd.text === 'bocau') {
        cur.skipCurrentStep();
        sfx.play('reveal');
        voice.stop();
        voice.say(cur.mcSpeech, true);
        syncSnapshot(true);
        return;
      }

      if (cmd.action === 'custom' && cmd.text === 'keugoifollow') {
        sfx.play('boost');
        voice.say(
          `Quý sĩ tử đang xem trực tiếp ơi, hãy bấm ngay nút Follow kênh ${caiDatRef.current.channelName} ở góc trên bên trái màn hình để ghi danh Bảng Vàng Tuần và không bỏ lỡ các trận đấu Vua Chính Tả kịch tính mỗi ngày nhé!`,
          true
        );
        return;
      }

      if (cmd.action === 'custom' && cmd.text === 'tatlive') {
        sfx.play('fanfare');
        voice.stop();
        voice.say(
          `Đấu trường ${caiDatRef.current.channelName} xin phép khép lại buổi phát sóng hôm nay. Chân thành cảm ơn quý sĩ tử đã tham gia và hẹn gặp lại!`,
          true
        );
        return;
      }

      if (cmd.action === 'custom' && cmd.text?.startsWith('vong:')) {
        const vIdx = Number(cmd.text.slice(5));
        if (Number.isFinite(vIdx) && vIdx >= 0 && vIdx <= 3) {
          cur.jumpToRound(vIdx);
          sfx.play('drum');
          voice.stop();
          voice.say(cur.mcSpeech, true);
          syncSnapshot(true);
        }
      }
    },
  });

  const toggleAdminMonitor = useCallback(() => {
    setAdminMonitor((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('chinhta_admin_monitor', next ? '1' : '0');
      } catch {}
      if (next) sfx.resume();
      return next;
    });
  }, []);

  const activeSnapshot = !IS_STAGE && stageInfo.count > 0 && remoteSnap ? remoteSnap : localSnap;

  return {
    status,
    caiDat,
    audioCfg,
    adminMonitor,
    stageCount: stageInfo.count,
    audioBlocked,
    serverStopped,
    weeklyTop,
    sleepEndsAt,
    snapshot: activeSnapshot,
    toggleAdminMonitor,
    unlockAudio: () => {
      setAudioBlocked(false);
      sfx.resume();
    },
  };
}

import { GAME } from './config';
import { parsePlayerChoice, stripDiacritics, type ChoiceMode } from './compare';
import {
  VONG_1_PHU_AM,
  VONG_2_DAU_VAN,
  VONG_3_BAT_LOI_CAU,
  VONG_4_HAN_VIET,
  type ChinhTaQuestion,
} from './du-lieu';

export type RegionKey = 'B' | 'T' | 'N';
export type StagePhase = 'playing' | 'reveal' | 'round_board' | 'podium';
export type RoundCode = 'phu-am' | 'dau-van' | 'bat-loi-cau' | 'han-viet';

export interface PlayerRecord {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  region?: RegionKey;
  solvedCount: number;
  wrongCount: number;
  totalTimeMs: number;
  joinedAt: number;
}

export interface RecentSolve {
  id: string;
  name: string;
  choice: 1 | 2;
  choiceLabel: '1' | '2' | 'A' | 'B';
  word: string;
  points: number;
  streak: number;
  streakBonus?: boolean;
}

export interface GiftBannerItem {
  id: number;
  name: string;
  avatar: string;
  giftName: string;
  count: number;
  coins: number;
  big: boolean;
  expiresAt: number;
}

export interface TugOfWarStats {
  count1: number;
  count2: number;
  total: number;
  pct1: number;
  pct2: number;
}

export interface ActivePuzzleView {
  id: string;
  roundIndex: number;
  roundCode: RoundCode;
  roundLabel: string;
  roundSubtitle: string;
  isDoublePoints: boolean;
  questionInRound: number;
  totalInRound: number;
  globalStep: number;
  totalSteps: number;
  choiceMode: ChoiceMode;
  choiceLabels: ['1', '2'] | ['A', 'B'];
  categoryTag: string;
  prompt: string;
  contextHint: string;
  option1: string;
  option2: string;
  option1Sub?: string;
  option2Sub?: string;
  sentenceParts?: {
    before: string;
    highlight: string;
    after: string;
  };
  rescueHint?: string;
  revealedChoice?: 1 | 2;
  revealedCorrectWord?: string;
  revealedWrongWord?: string;
  explanation?: string;
}

export interface GameSnapshot {
  matchNumber: number;
  phase: StagePhase;
  secondsLeft: number;
  totalSeconds: number;
  heartsInStage: number;
  heartTarget: number;
  heartBoostUsed: boolean;
  puzzle: ActivePuzzleView;
  tugOfWar: TugOfWarStats;
  recentSolves: RecentSolve[];
  solverCount: number;
  wrongCount: number;
  leaderboard: Array<{
    rank: number;
    id: string;
    name: string;
    avatar: string;
    score: number;
    streak: number;
    region?: RegionKey;
    title: string;
  }>;
  regions: Record<RegionKey, number>;
  leadingRegion: RegionKey | null;
  giftBanner: GiftBannerItem | null;
  mcSpeech: string;
  sampleAnswer: string;
  sampleWrongAnswer: string;
}

interface InternalStep {
  roundIndex: number;
  questionInRound: number;
  totalInRound: number;
  kind: RoundCode;
  choiceMode: ChoiceMode;
  choiceLabels: ['1', '2'] | ['A', 'B'];
  data: ChinhTaQuestion;
  option1: string;
  option2: string;
  correctChoice: 1 | 2;
}

export class ChinhTaEngine {
  matchNumber = 1;
  phase: StagePhase = 'playing';
  private steps: InternalStep[] = [];
  private stepIdx = 0;
  private phaseStartedAt = Date.now();
  private phaseDurationMs = 18_000;
  private roundSeconds: [number, number, number, number] = [...GAME.thoiGianMacDinh];
  private revealSeconds: number = GAME.thoiGianMoDapAnMacDinh;
  private usedIds: Record<string, number> = {};

  players = new Map<string, PlayerRecord>();
  /** Luật "Bút Sa Gà Chết": khóa chặt lựa chọn ĐẦU TIÊN (1 hoặc 2) của mỗi người chơi trong từng câu */
  lockedChoices = new Map<string, 1 | 2>();
  private solvedThisStep = new Set<string>();
  private wrongThisStep = new Set<string>();
  private votes1 = 0;
  private votes2 = 0;
  recentSolves: RecentSolve[] = [];
  private solveSeq = 0;

  heartsInStage = 0;
  heartBoostUsed = false;
  mcSpeech = 'Chào mừng quý sĩ tử đến với Vua Chính Tả — Đấu Trường Tiếng Việt 1 vs 2!';

  private giftQueue: GiftBannerItem[] = [];
  private nextGiftId = 1;

  constructor(usedHistory: Record<string, number> = {}) {
    this.usedIds = { ...usedHistory };
    this.startNewMatch(Date.now());
  }

  getUsedHistory() {
    return { ...this.usedIds };
  }

  getRoundSeconds(): [number, number, number, number] {
    return [...this.roundSeconds] as [number, number, number, number];
  }

  setRoundSeconds(raw?: unknown) {
    const next = GAME.chuanHoaThoiGian(raw);
    const prev = this.roundSeconds;
    this.roundSeconds = next;
    const step = this.steps[this.stepIdx];
    if (this.phase === 'playing' && step && prev[step.roundIndex] !== next[step.roundIndex]) {
      this.phaseDurationMs = next[step.roundIndex] * 1000;
    }
  }

  getRevealSeconds(): number {
    return this.revealSeconds;
  }

  setRevealSeconds(raw?: unknown) {
    const next = GAME.chuanHoaThoiGianMoDapAn(raw);
    const prev = this.revealSeconds;
    this.revealSeconds = next;
    if (this.phase === 'reveal' && prev !== next) {
      this.phaseDurationMs = this.computeRevealDurationMs(this.mcSpeech);
    }
  }

  /**
   * Ước lượng chính xác thời lượng giọng đọc tiếng Việt (tính cả nhịp nghỉ dấu câu .,!?:; và độ trễ nạp audio)
   * để đảm bảo đồng hồ hiển thị khớp với thời gian Học Giả MC đọc trọn vẹn câu.
   */
  private computeSpeechDurationMs(speechText: string, minSeconds: number, maxExtraMs = 7_500): number {
    const baseMs = minSeconds * 1000;
    const trimmed = speechText.trim();
    if (!trimmed) return baseMs;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const pauseCount = (trimmed.match(/[.,!?:;…]/g) || []).length;
    const estimatedSpeakMs = Math.ceil((wordCount / 2.85 + pauseCount * 0.32 + 1.4) * 1000);
    return Math.max(baseMs, Math.min(baseMs + maxExtraMs, estimatedSpeakMs));
  }

  /**
   * Thời gian Mở Đáp Án tối ưu theo từng vòng:
   * - Vòng 1 & Vòng 2: Mở đáp án siêu tốc 4 giây (không đọc giải thích dài dòng)
   * - Vòng 3 (Bắt lỗi câu): Mở đáp án 4.5 giây (chỉ báo từ in đậm Đúng hay Sai và từ sửa đúng)
   * - Vòng 4 (Thuần Việt & Hán Việt ×2): Đọc giải thích ngắn gọn trong 1 câu (~6.5s - 8s)
   */
  private computeRevealDurationMs(speechText: string): number {
    const step = this.steps[this.stepIdx];
    if (step && (step.kind === 'phu-am' || step.kind === 'dau-van')) {
      return GAME.thoiGianMoDapAnVong123 * 1000;
    }
    if (step && step.kind === 'bat-loi-cau') {
      return 4_500;
    }
    return this.computeSpeechDurationMs(speechText, this.revealSeconds, 4_000);
  }

  /** Trả về lời đọc Mở Đáp Án của câu hiện tại để hệ thống nạp trước (Prefetch) âm thanh AI từ lúc đang đếm ngược */
  getCurrentRevealSpeech(): string {
    const step = this.steps[this.stepIdx];
    if (!step) return '';
    const q = step.data;
    const [lbl1, lbl2] = step.choiceLabels;
    const winLbl = step.correctChoice === 1 ? lbl1 : lbl2;
    const winningOptionText = step.correctChoice === 1 ? step.option1 : step.option2;

    // Vòng 1 & Vòng 2: Chốt đáp án nhanh gọn 1 câu, không đọc giải nghĩa từ điển
    if (step.kind === 'phu-am' || step.kind === 'dau-van') {
      return `Hết giờ! Đáp án đúng là phương án ${winLbl}: «${winningOptionText}»!`;
    }

    // Vòng 3 (Bắt lỗi trong câu): Chỉ báo từ in đậm viết Đúng hay Sai (và từ sửa đúng nếu Sai)
    if (step.kind === 'bat-loi-cau') {
      if (step.correctChoice === 1) {
        return `Hết giờ! Đáp án là số 1: Từ «${q.highlightWord}» đã viết ĐÚNG chính tả!`;
      }
      return `Hết giờ! Đáp án là số 2: Viết SAI! Phải viết là «${q.optionCorrect}»!`;
    }

    // Vòng 4 (Thuần Việt & Hán Việt ×2): Chỉ đọc 1 câu giải thích cốt lõi ngắn gọn
    const afterBang = q.explanation.includes('!')
      ? q.explanation.split('!').slice(1).join('!').trim()
      : q.explanation.trim();
    const shortSentence = afterBang.split(/\.\s+/)[0].replace(/\.+$/, '');
    return `Hết giờ! Đáp án đúng là phương án ${winLbl}: «${winningOptionText}». ${shortSentence}.`;
  }

  private pickFresh<T extends { id: string }>(pool: T[], count: number): T[] {
    const sorted = [...pool].sort((a, b) => (this.usedIds[a.id] ?? 0) - (this.usedIds[b.id] ?? 0) || Math.random() - 0.5);
    const chosen = sorted.slice(0, count);
    const now = Date.now();
    for (const item of chosen) this.usedIds[item.id] = now;
    return chosen;
  }

  private buildInternalStep(d: ChinhTaQuestion, roundIndex: number, questionInRound: number, totalInRound: number): InternalStep {
    const kind = GAME.vong[roundIndex].ma;
    // Vòng 1 & Vòng 3 (roundIndex 0, 2): cố định dùng [1] / [2] suốt cả vòng
    // Vòng 2 & Vòng 4 (roundIndex 1, 3): cố định dùng [A] / [B] suốt cả vòng
    // Giúp khán giả không bị bất ngờ giữa chừng mà vẫn chống trôi đáp án khi chuyển vòng!
    const choiceMode: ChoiceMode = roundIndex % 2 === 0 ? '12' : 'AB';
    const choiceLabels: ['1', '2'] | ['A', 'B'] = choiceMode === '12' ? ['1', '2'] : ['A', 'B'];

    if (kind === 'bat-loi-cau') {
      const correctChoice: 1 | 2 = d.isSentenceCorrect ? 1 : 2;
      return {
        roundIndex,
        questionInRound,
        totalInRound,
        kind,
        choiceMode,
        choiceLabels,
        data: d,
        option1: 'ĐÚNG CHÍNH TẢ',
        option2: 'SAI CHÍNH TẢ',
        correctChoice,
      };
    }

    if (d.fixedOptions) {
      const correctChoice: 1 | 2 = d.isSentenceCorrect ? 1 : 2;
      return {
        roundIndex,
        questionInRound,
        totalInRound,
        kind,
        choiceMode,
        choiceLabels,
        data: d,
        option1: d.fixedOptions[0],
        option2: d.fixedOptions[1],
        correctChoice,
      };
    }

    // Vòng 1, 2 và Vòng 4 (Dạng 4B đối chiếu 2 từ): Đảo ngẫu nhiên 50/50 vị trí từ đúng giữa 2 thẻ
    const correctChoice: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
    return {
      roundIndex,
      questionInRound,
      totalInRound,
      kind,
      choiceMode,
      choiceLabels,
      data: d,
      option1: correctChoice === 1 ? d.optionCorrect : d.optionWrong,
      option2: correctChoice === 2 ? d.optionCorrect : d.optionWrong,
      correctChoice,
    };
  }

  startNewMatch(now = Date.now()) {
    this.players.forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.solvedCount = 0;
      p.wrongCount = 0;
      p.totalTimeMs = 0;
    });

    const r1 = this.pickFresh(VONG_1_PHU_AM, GAME.vong[0].soCau);
    const r2 = this.pickFresh(VONG_2_DAU_VAN, GAME.vong[1].soCau);
    const r3 = this.pickFresh(VONG_3_BAT_LOI_CAU, GAME.vong[2].soCau);
    const r4 = this.pickFresh(VONG_4_HAN_VIET, GAME.vong[3].soCau);

    this.steps = [
      ...r1.map((d, i) => this.buildInternalStep(d, 0, i + 1, r1.length)),
      ...r2.map((d, i) => this.buildInternalStep(d, 1, i + 1, r2.length)),
      ...r3.map((d, i) => this.buildInternalStep(d, 2, i + 1, r3.length)),
      ...r4.map((d, i) => this.buildInternalStep(d, 3, i + 1, r4.length)),
    ];

    this.stepIdx = 0;
    this.enterCurrentStep(now);
  }

  jumpToRound(roundIndex: number, now = Date.now()) {
    const idx = this.steps.findIndex((s) => s.roundIndex === roundIndex);
    if (idx >= 0) {
      this.stepIdx = idx;
      this.enterCurrentStep(now);
    }
  }

  skipCurrentStep(now = Date.now()) {
    const cur = this.steps[this.stepIdx];
    if (cur) this.usedIds[cur.data.id] = now + 86_400_000;
    this.advanceAfterReveal(now);
  }

  private enterCurrentStep(now = Date.now()) {
    const step = this.steps[this.stepIdx];
    const roundSec = this.roundSeconds[step.roundIndex] ?? GAME.vong[step.roundIndex].giay;
    this.phase = 'playing';
    this.phaseStartedAt = now;
    this.phaseDurationMs = roundSec * 1000;

    this.lockedChoices.clear();
    this.solvedThisStep.clear();
    this.wrongThisStep.clear();
    this.votes1 = 0;
    this.votes2 = 0;
    this.recentSolves = [];
    this.heartsInStage = 0;
    this.heartBoostUsed = false;

    const q = step.data;
    const [lbl1, lbl2] = step.choiceLabels;
    const roundCfg = GAME.vong[step.roundIndex];
    const isFirstOfRound = step.questionInRound === 1;
    const roundIntro = isFirstOfRound ? `${roundCfg.luatChoi} ` : '';

    if (step.kind === 'bat-loi-cau') {
      this.mcSpeech = `${roundIntro}Vòng 3 Câu ${step.questionInRound}: Trong câu "${q.sentenceBefore} ${q.highlightWord} ${q.sentenceAfter}", từ «${q.highlightWord}» là ĐÚNG gõ ${lbl1} hay SAI gõ ${lbl2}?`;
    } else if (step.kind === 'han-viet') {
      if (q.fixedOptions && q.highlightWord) {
        this.mcSpeech = `${roundIntro}Vòng 4 Câu ${step.questionInRound}: Từ «${q.highlightWord}» là Từ Thuần Việt gõ ${lbl1}, hay Từ Hán Việt gõ ${lbl2}?`;
      } else {
        this.mcSpeech = `${roundIntro}Vòng 4 Câu ${step.questionInRound}: ${q.contextHint} Gõ ${lbl1} chọn «${step.option1}» hay gõ ${lbl2} chọn «${step.option2}»?`;
      }
    } else {
      this.mcSpeech = `${roundIntro}Vòng ${step.roundIndex + 1} Câu ${step.questionInRound} (${q.categoryTag}): Gõ ${lbl1} chọn «${step.option1}» hay gõ ${lbl2} chọn «${step.option2}»?`;
    }
  }

  private ensurePlayer(id: string, name: string, avatar = '', now = Date.now()): PlayerRecord {
    let p = this.players.get(id);
    if (!p) {
      p = {
        id,
        name: name || 'Sĩ tử',
        avatar,
        score: 0,
        streak: 0,
        solvedCount: 0,
        wrongCount: 0,
        totalTimeMs: 0,
        joinedAt: now,
      };
      this.players.set(id, p);
    } else {
      if (name) p.name = name;
      if (avatar) p.avatar = avatar;
    }
    return p;
  }

  /**
   * Xử lý bình luận của khán giả:
   * - Đầu quân 3 miền: Bắc / Trung / Nam
   * - Bình chọn phương án [1] hoặc [2] với luật "Bút Sa Gà Chết" (chỉ ghi nhận lựa chọn đầu tiên!)
   */
  submitChat(
    ev: { username: string; nickname: string; comment: string; avatar?: string; createTime?: number },
    now = Date.now()
  ): {
    kind: 'region' | 'correct' | 'wrong' | 'locked_wrong' | 'already' | 'none';
    region?: RegionKey;
    choice?: 1 | 2;
    choiceLabel?: '1' | '2' | 'A' | 'B';
    lockedChoice?: 1 | 2;
    lockedChoiceLabel?: '1' | '2' | 'A' | 'B';
    points?: number;
    word?: string;
    rankInStep?: number;
    streakBonus?: number;
  } {
    const raw = (ev.comment || '').trim();
    if (!raw) return { kind: 'none' };
    const ascii = stripDiacritics(raw);
    if (!ascii) return { kind: 'none' };

    const player = this.ensurePlayer(ev.username || ev.nickname, ev.nickname, ev.avatar, now);

    // 1. Chọn phe 3 miền: Bắc / Trung / Nam
    if (/^(?:mien bac|bac|bac bo|doi bac|team bac)$/.test(ascii)) {
      player.region = 'B';
      return { kind: 'region', region: 'B' };
    }
    if (/^(?:mien trung|trung|trung bo|doi trung|team trung)$/.test(ascii)) {
      player.region = 'T';
      return { kind: 'region', region: 'T' };
    }
    if (/^(?:mien nam|nam|nam bo|doi nam|team nam)$/.test(ascii)) {
      player.region = 'N';
      return { kind: 'region', region: 'N' };
    }

    if (this.phase !== 'playing') return { kind: 'none' };
    const step = this.steps[this.stepIdx];
    const roundCfg = GAME.vong[step.roundIndex];

    const extraAliases =
      step.kind === 'bat-loi-cau'
        ? {
            choice1: ['đúng', 'đúng chính tả', ...(step.correctChoice === 1 ? [step.data.optionCorrect] : [step.data.optionWrong])],
            choice2: ['sai', 'sai chính tả', ...(step.correctChoice === 2 ? [step.data.optionCorrect] : [step.data.optionWrong])],
          }
        : step.data.fixedOptions
          ? {
              choice1: ['thuần việt', 'từ thuần việt'],
              choice2: ['hán việt', 'từ hán việt'],
            }
          : undefined;

    const choice = parsePlayerChoice(raw, step.option1, step.option2, extraAliases, step.choiceMode);
    if (!choice) return { kind: 'none' };
    const choiceLabel = step.choiceLabels[choice - 1];

    // 2. Luật "BÚT SA GÀ CHẾT": Kiểm tra xem người chơi đã khóa lựa chọn ở câu này chưa
    const existingChoice = this.lockedChoices.get(player.id);
    if (existingChoice !== undefined) {
      const lockedChoiceLabel = step.choiceLabels[existingChoice - 1];
      if (existingChoice === step.correctChoice) {
        return { kind: 'already', choice, choiceLabel, lockedChoice: existingChoice, lockedChoiceLabel };
      }
      return { kind: 'locked_wrong', choice, choiceLabel, lockedChoice: existingChoice, lockedChoiceLabel };
    }

    // 3. Ghi nhận lựa chọn ĐẦU TIÊN và khóa ngay lập tức
    this.lockedChoices.set(player.id, choice);
    if (choice === 1) this.votes1 += 1;
    else this.votes2 += 1;

    // 4. Nếu lần gõ đầu tiên chọn SAI phương án -> Cắt chuỗi thắng & khóa luôn câu đó
    if (choice !== step.correctChoice) {
      player.streak = 0;
      player.wrongCount += 1;
      this.wrongThisStep.add(player.id);
      const chosenWord = choice === 1 ? step.option1 : step.option2;
      return { kind: 'wrong', choice, choiceLabel, lockedChoice: choice, lockedChoiceLabel: choiceLabel, word: chosenWord };
    }

    // 5. Nếu lần gõ đầu tiên chọn ĐÚNG phương án -> Cộng điểm tốc độ (miễn trừ 5s đầu bù trễ OBS) + thưởng chuỗi 3 câu (+100đ)
    this.solvedThisStep.add(player.id);
    const sendTime = ev.createTime && ev.createTime >= this.phaseStartedAt - 1000 ? ev.createTime : now;
    const rawElapsed = Math.max(0, Math.min(this.phaseDurationMs, sendTime - this.phaseStartedAt));
    const graceMs = Math.min(GAME.buTreObsMs, Math.floor(this.phaseDurationMs * 0.35));
    const effectiveElapsed = Math.max(0, rawElapsed - graceMs);
    const effectiveWindow = Math.max(1000, this.phaseDurationMs - graceMs);
    const speedRatio = 1 - Math.min(1, effectiveElapsed / effectiveWindow);
    const basePts = Math.round(roundCfg.diemSan + (roundCfg.diemMax - roundCfg.diemSan) * speedRatio);

    player.streak += 1;
    let streakBonus = 0;
    if (player.streak > 0 && player.streak % GAME.chuoiMoi === 0) {
      streakBonus = GAME.chuoiThuong;
    }
    const totalPts = basePts + streakBonus;
    player.score += totalPts;
    player.solvedCount += 1;
    player.totalTimeMs += rawElapsed;

    const rankInStep = this.solvedThisStep.size;
    const displayWord =
      step.kind === 'bat-loi-cau' || step.data.fixedOptions
        ? `[${choiceLabel}] ${step.data.optionCorrect}`
        : step.data.optionCorrect;
    this.recentSolves = [
      {
        id: `${++this.solveSeq}`,
        name: player.name,
        choice,
        choiceLabel,
        word: displayWord,
        points: totalPts,
        streak: player.streak,
        streakBonus: streakBonus > 0,
      },
      ...this.recentSolves,
    ].slice(0, 6);

    return {
      kind: 'correct',
      choice,
      choiceLabel,
      lockedChoice: choice,
      lockedChoiceLabel: choiceLabel,
      points: totalPts,
      word: step.data.optionCorrect,
      rankInStep,
      streakBonus,
    };
  }

  /** Cứu trợ bằng 200 Tim miễn phí của cả phòng: mở Gợi Ý Ngữ Nghĩa / Loại Trừ */
  addLikes(count: number): boolean {
    if (this.phase !== 'playing') return false;
    this.heartsInStage += Math.max(1, count);
    if (!this.heartBoostUsed && this.heartsInStage >= GAME.cuuTroTim) {
      this.heartBoostUsed = true;
      return true;
    }
    return false;
  }

  addGift(ev: { nickname: string; avatar?: string; giftName: string; diamondCount: number; repeatCount: number }, now = Date.now()) {
    const totalCoins = (ev.diamondCount || 1) * (ev.repeatCount || 1);
    const big = totalCoins >= 99;
    const existing = this.giftQueue.find((g) => g.name === ev.nickname && g.giftName === ev.giftName);
    if (existing) {
      existing.count += ev.repeatCount || 1;
      existing.coins += totalCoins;
      existing.big = existing.big || big;
      existing.expiresAt = Math.max(existing.expiresAt, now + (existing.big ? 7500 : 4200));
      return existing;
    }
    const item: GiftBannerItem = {
      id: this.nextGiftId++,
      name: ev.nickname || 'Quý nhân',
      avatar: ev.avatar || '',
      giftName: ev.giftName || 'Quà tặng',
      count: ev.repeatCount || 1,
      coins: totalCoins,
      big,
      expiresAt: now + (big ? 7500 : 4200),
    };
    if (big) this.giftQueue.unshift(item);
    else if (this.giftQueue.length < 6) this.giftQueue.push(item);
    return item;
  }

  private enterReveal(now = Date.now()) {
    // Ai bỏ qua câu này không trả lời cũng bị reset chuỗi thắng liên tiếp
    for (const p of this.players.values()) {
      if (!this.solvedThisStep.has(p.id)) p.streak = 0;
    }
    this.phase = 'reveal';
    this.phaseStartedAt = now;
    this.mcSpeech = this.getCurrentRevealSpeech();
    this.phaseDurationMs = this.computeRevealDurationMs(this.mcSpeech);
  }

  private advanceAfterReveal(now = Date.now()) {
    const cur = this.steps[this.stepIdx];
    const next = this.steps[this.stepIdx + 1];
    if (!next) {
      this.phase = 'podium';
      this.phaseStartedAt = now;
      const top = this.getSortedLeaderboard();
      this.mcSpeech = top[0]
        ? `Chúc mừng Tân Vua Chính Tả hôm nay: ${top[0].name} đăng quang với ${top[0].score} điểm! Quý sĩ tử nhớ bấm nút Follow kênh ở góc trên màn hình để lưu danh Bảng Vàng Tuần và đón chờ ván mới ngay sau đây!`
        : 'Ván đấu khép lại! Quý sĩ tử nhớ bấm nút Follow kênh ở góc trên màn hình để cùng bước vào ván mới khởi tranh sau ít giây!';
      this.phaseDurationMs = this.computeSpeechDurationMs(this.mcSpeech, 15, 6_000);
      return;
    }
    if (next.roundIndex !== cur.roundIndex) {
      this.stepIdx += 1;
      this.phase = 'round_board';
      this.phaseStartedAt = now;
      const nextRound = GAME.vong[next.roundIndex];
      const followHooks = [
        'Các sĩ tử nhớ bấm nút Follow ở góc trên bên trái màn hình để lưu điểm vào Bảng Vàng Tuần nhé!',
        'Đừng quên bấm Follow kênh để đồng hành cùng đấu trường chữ Việt mỗi ngày nhé!',
        'Hãy bấm Follow kênh và thả tim cổ vũ cho vòng quyết chiến nhân đôi điểm số ngay sau đây!',
      ];
      const hook = followHooks[cur.roundIndex % followHooks.length];
      this.mcSpeech = `Khép lại Vòng ${cur.roundIndex + 1}: ${GAME.vong[cur.roundIndex].nhan}! ${hook} Chuẩn bị bước sang Vòng ${next.roundIndex + 1}: ${nextRound.nhan}. ${nextRound.luatChoi}`;
      this.phaseDurationMs = this.computeSpeechDurationMs(this.mcSpeech, 12, 6_500);
      return;
    }
    this.stepIdx += 1;
    this.enterCurrentStep(now);
  }

  /**
   * Gọi định kỳ mỗi 250ms để tự chuyển pha mượt mà.
   * @param holdForVoice Nếu true (MC vẫn đang đọc dở câu hoặc vừa dứt chữ < 0.45s), hệ thống giữ cảnh đợi MC đọc trọn câu mới chuyển cảnh (tối đa +8s bảo vệ).
   */
  tick(now = Date.now(), holdForVoice = false): { phaseChanged?: StagePhase; matchFinished?: boolean } {
    while (this.giftQueue.length > 0 && this.giftQueue[0].expiresAt <= now) {
      this.giftQueue.shift();
    }
    const elapsed = now - this.phaseStartedAt;
    if (elapsed < this.phaseDurationMs) return {};

    // Cơ chế Voice-Sync Hold: Đợi MC đọc dứt câu hoàn toàn rồi mới chuyển cảnh (kèm trần an toàn để không bao giờ treo)
    const maxHoldExtraMs = this.phase === 'playing' ? 9_000 : 14_000;
    if (holdForVoice && elapsed < this.phaseDurationMs + maxHoldExtraMs) {
      return {};
    }

    if (this.phase === 'playing') {
      this.enterReveal(now);
      return { phaseChanged: 'reveal' };
    }
    if (this.phase === 'reveal') {
      this.advanceAfterReveal(now);
      const nextPhase = this.phase as StagePhase;
      return { phaseChanged: nextPhase, matchFinished: nextPhase === 'podium' };
    }
    if (this.phase === 'round_board') {
      this.enterCurrentStep(now);
      return { phaseChanged: 'playing' };
    }
    if (this.phase === 'podium') {
      this.matchNumber += 1;
      this.startNewMatch(now);
      return { phaseChanged: 'playing' };
    }
    return {};
  }

  getSortedLeaderboard() {
    return [...this.players.values()]
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs || a.joinedAt - b.joinedAt)
      .slice(0, 20)
      .map((p, i) => ({
        rank: i + 1,
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        streak: p.streak,
        region: p.region,
        title: GAME.danhHieu(i + 1),
      }));
  }

  /** Trả về lựa chọn ĐÚNG hiện tại ("1" / "2" ở câu lẻ hoặc "A" / "B" ở câu chẵn) để nút Test trên Admin hoặc kiểm thử gọi ngay */
  getSampleCorrectAnswer(): string {
    const step = this.steps[this.stepIdx];
    if (!step) return '1';
    return step.choiceLabels[step.correctChoice - 1];
  }

  /** Trả về lựa chọn SAI hiện tại ("1" / "2" ở câu lẻ hoặc "A" / "B" ở câu chẵn) */
  getSampleWrongAnswer(): string {
    const step = this.steps[this.stepIdx];
    if (!step) return '2';
    return step.choiceLabels[step.correctChoice === 1 ? 1 : 0];
  }

  /** Lấy số thứ tự phương án đúng hiện tại (1 | 2) */
  getCurrentCorrectChoice(): 1 | 2 {
    const step = this.steps[this.stepIdx];
    return step ? step.correctChoice : 1;
  }

  private buildRescueHint(step: InternalStep): string | undefined {
    if (!this.heartBoostUsed) return undefined;
    const q = step.data;
    if (step.kind === 'bat-loi-cau') {
      return `💡 CỨU TRỢ 200 TIM: Từ chuẩn trong từ điển phải viết là «${q.optionCorrect}»!`;
    }
    if (step.kind === 'han-viet' && q.explanation.includes('!')) {
      const afterBang = q.explanation.split('!').slice(1).join('!').trim().split(/[.;]/)[0];
      if (afterBang) return `💡 CỨU TRỢ 200 TIM: ${afterBang}.`;
    }
    const shortClue = q.explanation.split(/[.;]/)[0];
    return `💡 CỨU TRỢ 200 TIM: ${shortClue}.`;
  }

  getSnapshot(now = Date.now()): GameSnapshot {
    const step = this.steps[this.stepIdx];
    const roundCfg = GAME.vong[step.roundIndex];
    const secondsLeft = Math.max(0, Math.ceil((this.phaseDurationMs - (now - this.phaseStartedAt)) / 1000));
    const totalSeconds = Math.round(this.phaseDurationMs / 1000);

    const regions: Record<RegionKey, number> = { B: 0, T: 0, N: 0 };
    for (const p of this.players.values()) {
      if (p.region && p.score > 0) regions[p.region] += p.score;
    }
    const maxRegionScore = Math.max(regions.B, regions.T, regions.N);
    const leadingRegion: RegionKey | null =
      maxRegionScore <= 0 ? null : regions.B === maxRegionScore ? 'B' : regions.T === maxRegionScore ? 'T' : 'N';

    const totalVotes = this.votes1 + this.votes2;
    const pct1 = totalVotes > 0 ? Math.round((this.votes1 / totalVotes) * 100) : 50;
    const pct2 = totalVotes > 0 ? 100 - pct1 : 50;
    const tugOfWar: TugOfWarStats = {
      count1: this.votes1,
      count2: this.votes2,
      total: totalVotes,
      pct1,
      pct2,
    };

    const q = step.data;
    const isRevealed = this.phase !== 'playing';
    const [lbl1, lbl2] = step.choiceLabels;
    const hasSentenceBox = Boolean(q.sentenceBefore !== undefined && q.highlightWord);

    const puzzle: ActivePuzzleView = {
      id: q.id,
      roundIndex: step.roundIndex,
      roundCode: step.kind,
      roundLabel: roundCfg.nhan,
      roundSubtitle: roundCfg.phuDe,
      isDoublePoints: roundCfg.heSo === 2,
      questionInRound: step.questionInRound,
      totalInRound: step.totalInRound,
      globalStep: this.stepIdx + 1,
      totalSteps: this.steps.length,
      choiceMode: step.choiceMode,
      choiceLabels: step.choiceLabels,
      categoryTag: q.categoryTag,
      prompt:
        step.kind === 'bat-loi-cau'
          ? `BẮT LỖI CHÍNH TẢ TRONG CÂU · CHỈ GÕ [${lbl1}] HOẶC [${lbl2}]`
          : step.kind === 'han-viet'
            ? q.fixedOptions
              ? `PHÂN TÍCH THUẦN VIỆT & HÁN VIỆT (×2) · CHỈ GÕ [${lbl1}] HOẶC [${lbl2}]`
              : `ĐỐI CHIẾU THUẦN VIỆT & HÁN VIỆT (×2) · CHỈ GÕ [${lbl1}] HOẶC [${lbl2}]`
            : `TỪ NÀO VIẾT ĐÚNG CHÍNH TẢ? · CHỈ GÕ [${lbl1}] HOẶC [${lbl2}]`,
      contextHint: q.contextHint,
      option1: step.option1,
      option2: step.option2,
      option1Sub:
        step.kind === 'bat-loi-cau'
          ? `Từ «${q.highlightWord}» là viết ĐÚNG · Gõ [${lbl1}]`
          : step.kind === 'han-viet' && q.fixedOptions
            ? `Từ «${q.highlightWord}» là Thuần Việt · Gõ [${lbl1}]`
            : `Bình luận [${lbl1}] để chốt phương án này`,
      option2Sub:
        step.kind === 'bat-loi-cau'
          ? `Từ «${q.highlightWord}» là viết SAI · Gõ [${lbl2}]`
          : step.kind === 'han-viet' && q.fixedOptions
            ? `Từ «${q.highlightWord}» là gốc Hán Việt · Gõ [${lbl2}]`
            : `Bình luận [${lbl2}] để chốt phương án này`,
      sentenceParts: hasSentenceBox
        ? {
            before: q.sentenceBefore || '',
            highlight: q.highlightWord || '',
            after: q.sentenceAfter || '',
          }
        : undefined,
      rescueHint: this.buildRescueHint(step),
      revealedChoice: isRevealed ? step.correctChoice : undefined,
      revealedCorrectWord: isRevealed ? q.optionCorrect : undefined,
      revealedWrongWord: isRevealed ? q.optionWrong : undefined,
      explanation: !isRevealed
        ? undefined
        : step.kind === 'han-viet'
          ? q.explanation
          : step.kind === 'bat-loi-cau'
            ? step.correctChoice === 1
              ? `✓ Từ «${q.highlightWord}» trong câu đã viết ĐÚNG chính tả!`
              : `✗ Từ «${q.highlightWord}» viết SAI — Từ viết đúng phải là: «${q.optionCorrect}»!`
            : undefined,
    };

    return {
      matchNumber: this.matchNumber,
      phase: this.phase,
      secondsLeft,
      totalSeconds,
      heartsInStage: this.heartsInStage,
      heartTarget: GAME.cuuTroTim,
      heartBoostUsed: this.heartBoostUsed,
      puzzle,
      tugOfWar,
      recentSolves: this.recentSolves,
      solverCount: this.solvedThisStep.size,
      wrongCount: this.wrongThisStep.size,
      leaderboard: this.getSortedLeaderboard(),
      regions,
      leadingRegion,
      giftBanner: this.giftQueue[0] ?? null,
      mcSpeech: this.mcSpeech,
      sampleAnswer: this.getSampleCorrectAnswer(),
      sampleWrongAnswer: this.getSampleWrongAnswer(),
    };
  }
}

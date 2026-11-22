/**
 * Server chuẩn cho Vua Chính Tả — Đấu Trường Tiếng Việt 1 vs 2 (LIVE-CHINHTA-TIKTOK · Port 4016)
 * Đồng nhất hệ sinh thái LIVE-CHUVIET, LIVE-TRANGNGUYEN & LIVE-PHO:
 * - Kết nối trực tiếp TikTok LIVE (tiktok-live-connector) + tự kết nối lại
 * - SSE /api/tiktok/events + đồng bộ ảnh chụp màn hình game /api/game/state
 * - Đồng bộ âm thanh thời gian thực Admin <-> Stage: /api/audio
 * - Tắt Server & giải phóng hoàn toàn Port 4016: /api/server/shutdown
 * - Giọng đọc VieNeu-TTS AI (Adam bựa / đa giọng) + Microsoft Edge Neural + Google TTS
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawn, type ChildProcessByStdio } from 'child_process';
import type { Readable, Writable } from 'stream';
import { fileURLToPath } from 'url';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4016;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', 'lvh.me']);
const hostOk = (h?: string) => !!h && LOCAL_HOSTS.has(h.replace(/:\d+$/, '').toLowerCase());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!hostOk(req.headers.host) || (origin && !hostOk(origin.replace(/^https?:\/\//, '')))) return res.status(403).end();
  next();
});

app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

interface LiveStats {
  isConnected: boolean;
  isConnecting: boolean;
  username: string;
  roomId: string;
  viewerCount: number;
  totalLikes: number;
  error?: string;
}

const emptyStats = (): LiveStats => ({
  isConnected: false,
  isConnecting: false,
  username: '',
  roomId: '',
  viewerCount: 0,
  totalLikes: 0,
  error: '',
});

let liveStats = emptyStats();
let sseClients: express.Response[] = [];
let stageIds: string[] = [];
const announceSpeaker = () => broadcast('speaker', { id: stageIds[stageIds.length - 1] ?? null, count: stageIds.length });
let activeConn: InstanceType<typeof TikTokLiveConnection> | null = null;
let lastRateControl: { action: string; text: string } | null = null;
let lastNameControl: { action: string; text: string } | null = null;
let latestGameState: unknown = null;

const SETTINGS_FILE = path.join(__dirname, 'settings.json');
let wantUser = '';

const clamp01 = (v: unknown, fb: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fb;
};

interface SettingsData {
  channelName?: string;
  tiktokUser?: string;
  tieuDe?: string;
  tenMc?: string;
  thoiGianVong?: [number, number, number, number];
  thoiGianMoDapAn?: number;
  vieneuVoice?: string;
  edgeVoice?: string;
  masterEnabled?: boolean;
  musicEnabled?: boolean;
  voiceEnabled?: boolean;
  musicVolume?: number;
  sfxVolume?: number;
  voiceVolume?: number;
}

let settings: SettingsData = {};
try {
  settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  if (typeof settings.channelName === 'string' && settings.channelName.trim()) {
    lastNameControl = { action: 'setName', text: settings.channelName.trim() };
  }
  if (typeof settings.tiktokUser === 'string') wantUser = settings.tiktokUser;
} catch {
  // Dùng mặc định
}

const saveSettings = (patch: Partial<SettingsData>) => {
  settings = { ...settings, ...patch };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Không lưu được settings.json:', err);
  }
};

const chuanHoaThoiGian = (raw?: unknown): [number, number, number, number] => {
  const def: [number, number, number, number] = [18, 20, 22, 25];
  if (!Array.isArray(raw) || raw.length < 4) return def;
  return [0, 1, 2, 3].map((i) => {
    const n = Math.round(Number(raw[i]));
    return Number.isFinite(n) ? Math.min(300, Math.max(5, n)) : def[i];
  }) as [number, number, number, number];
};

const chuanHoaThoiGianMoDapAn = (raw?: unknown): number => {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.min(30, Math.max(4, n)) : 9;
};

const caiDat = () => ({
  tieuDe: settings.tieuDe || 'VUA CHÍNH TẢ',
  tenMc: settings.tenMc || 'Học Giả Quốc Ngữ',
  channelName: settings.channelName || 'Vua Chính Tả',
  thoiGianVong: chuanHoaThoiGian(settings.thoiGianVong),
  thoiGianMoDapAn: chuanHoaThoiGianMoDapAn(settings.thoiGianMoDapAn),
});

const audioCfg = () => ({
  masterEnabled: settings.masterEnabled !== false,
  musicEnabled: settings.musicEnabled !== false,
  voiceEnabled: settings.voiceEnabled !== false,
  musicVolume: clamp01(settings.musicVolume, 0.16),
  sfxVolume: clamp01(settings.sfxVolume, 0.45),
  voiceVolume: clamp01(settings.voiceVolume, 1.0),
});

function broadcast(eventType: string, data: unknown) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      // Đã đóng
    }
  }
}

app.get('/api/tiktok/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: status\ndata: ${JSON.stringify(liveStats)}\n\n`);
  res.write(`event: caiDat\ndata: ${JSON.stringify(caiDat())}\n\n`);
  res.write(`event: audioCfg\ndata: ${JSON.stringify(audioCfg())}\n\n`);
  res.write(`event: vieneu\ndata: ${JSON.stringify(getVieneuStatus())}\n\n`);
  if (latestGameState) res.write(`event: gamestate\ndata: ${JSON.stringify(latestGameState)}\n\n`);
  if (lastRateControl) res.write(`event: control\ndata: ${JSON.stringify(lastRateControl)}\n\n`);
  if (lastNameControl) res.write(`event: control\ndata: ${JSON.stringify(lastNameControl)}\n\n`);
  sseClients.push(res);

  const stageId = typeof req.query.stage === 'string' ? req.query.stage.slice(0, 40) : '';
  if (stageId) {
    stageIds = [...stageIds.filter((x) => x !== stageId), stageId];
    announceSpeaker();
  } else {
    res.write(`event: speaker\ndata: ${JSON.stringify({ id: stageIds[stageIds.length - 1] ?? null, count: stageIds.length })}\n\n`);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((c) => c !== res);
    if (stageId) {
      stageIds = stageIds.filter((x) => x !== stageId);
      announceSpeaker();
    }
  });
});

app.get('/api/tiktok/status', (_req, res) => res.json({ success: true, data: liveStats }));

const userOf = (data: any) => data?.user?.displayId || data?.user?.uniqueId || data?.uniqueId || 'nguoi-xem';
const nickOf = (data: any) => data?.user?.nickname || data?.nickname || data?.uniqueId || 'Bạn';
const avatarOf = (data: any) => data?.user?.avatarThumb?.urlList?.[0] || '';

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTries = 0;
function scheduleReconnect(why: string) {
  if (!wantUser || reconnectTimer) return;
  const delay = Math.min(120_000, 15_000 * 2 ** reconnectTries);
  reconnectTries++;
  liveStats = { ...liveStats, isConnected: false, isConnecting: false, error: `${why}. Tự kết nối lại sau ${delay / 1000} giây` };
  broadcast('status', liveStats);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectTikTok(wantUser).catch((err) => scheduleReconnect(`Chưa kết nối lại được (${err instanceof Error ? err.message : err})`));
  }, delay);
}
const stopReconnect = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  reconnectTries = 0;
};

app.post('/api/tiktok/connect', async (req, res) => {
  const cleanUser = String(req.body?.username || '').replace(/^@/, '').trim();
  if (!cleanUser) return res.status(400).json({ success: false, error: 'Chưa nhập username TikTok' });
  stopReconnect();
  wantUser = cleanUser;
  saveSettings({ tiktokUser: cleanUser });
  try {
    const state = await connectTikTok(cleanUser);
    return res.json({ success: true, roomId: state?.roomId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    scheduleReconnect(`Không kết nối được: ${msg}`);
    return res.status(400).json({
      success: false,
      error: `Không kết nối được @${cleanUser}: ${msg}. Tài khoản phải đang LIVE trên TikTok. Server sẽ tự thử lại.`,
    });
  }
});

async function connectTikTok(cleanUser: string) {
  if (activeConn) {
    try { activeConn.disconnect(); } catch {}
    activeConn = null;
  }
  liveStats = { ...emptyStats(), isConnecting: true, username: cleanUser };
  broadcast('status', liveStats);

  const conn = new TikTokLiveConnection(cleanUser, {
    processInitialData: true,
    enableExtendedGiftInfo: false,
  });

  conn.on(ControlEvent.CONNECTED, (state: { roomId?: string }) => {
    liveStats = { ...liveStats, isConnected: true, isConnecting: false, roomId: state?.roomId || '', error: '' };
    broadcast('status', liveStats);
    reconnectTries = 0;
  });

  conn.on(ControlEvent.DISCONNECTED, () => {
    if (activeConn !== conn) return;
    liveStats = { ...liveStats, isConnected: false, isConnecting: false };
    broadcast('status', liveStats);
    scheduleReconnect('Mất kết nối TikTok');
  });

  conn.on(WebcastEvent.STREAM_END, () => {
    if (activeConn !== conn) return;
    liveStats = { ...liveStats, isConnected: false, isConnecting: false, error: 'Phiên live đã kết thúc' };
    broadcast('status', liveStats);
    scheduleReconnect('Phiên live đã kết thúc');
  });

  conn.on(WebcastEvent.CHAT, (data: any) => {
    const rawCreate = Number(data?.common?.createTime) || 0;
    const createTime = rawCreate > 0 && rawCreate < 1e11 ? rawCreate * 1000 : (rawCreate || Date.now());
    broadcast('chat', {
      username: userOf(data),
      nickname: nickOf(data),
      comment: data?.content || data?.comment || '',
      avatar: avatarOf(data),
      timestamp: Date.now(),
      createTime,
    });
  });

  const streakCounts = new Map<string, number>();
  conn.on(WebcastEvent.GIFT, (data: any) => {
    const username = userOf(data);
    const giftId = data?.giftId || 0;
    const key = `${username}_${giftId}`;
    const total = data?.repeatCount || 1;
    const delta = total - (streakCounts.get(key) || 0);
    const isStreakable = (data?.gift?.type ?? data?.giftDetails?.giftType ?? data?.giftType) === 1;
    if (isStreakable && !data?.repeatEnd) streakCounts.set(key, total);
    else streakCounts.delete(key);
    if (delta <= 0) return;

    broadcast('gift', {
      username,
      nickname: nickOf(data),
      giftName: data?.gift?.name || data?.giftDetails?.giftName || data?.giftName || 'Quà',
      giftId,
      diamondCount: data?.gift?.diamondCount || data?.diamondCount || data?.giftDetails?.diamondCount || 1,
      repeatCount: delta,
      avatar: avatarOf(data),
      timestamp: Date.now(),
    });
  });

  conn.on(WebcastEvent.MEMBER, (data: any) => {
    broadcast('member', { username: userOf(data), nickname: nickOf(data), avatar: avatarOf(data), timestamp: Date.now() });
  });
  conn.on(WebcastEvent.FOLLOW, (data: any) => {
    broadcast('follow', { username: userOf(data), nickname: nickOf(data), avatar: avatarOf(data), timestamp: Date.now() });
  });
  conn.on(WebcastEvent.SHARE, (data: any) => {
    broadcast('share', { username: userOf(data), nickname: nickOf(data), avatar: avatarOf(data), timestamp: Date.now() });
  });
  conn.on(WebcastEvent.ROOM_USER, (data: any) => {
    if (typeof data?.viewerCount === 'number') {
      liveStats.viewerCount = data.viewerCount;
      broadcast('roomUser', { viewerCount: data.viewerCount });
    }
  });
  conn.on(WebcastEvent.LIKE, (data: any) => {
    if (typeof data?.totalLikeCount === 'number') liveStats.totalLikes = data.totalLikeCount;
    broadcast('like', {
      username: userOf(data),
      nickname: nickOf(data),
      likeCount: data?.likeCount || 1,
      totalLikes: liveStats.totalLikes,
    });
  });
  conn.on(ControlEvent.ERROR, (err: unknown) => {
    liveStats.error = err instanceof Error ? err.message : String(err);
    broadcast('status', liveStats);
  });

  activeConn = conn;
  try {
    const live = await conn.fetchIsLive().catch(() => true);
    if (!live) throw new Error('TikTok báo tài khoản này CHƯA LIVE. Bấm Phát trực tiếp trong LIVE Studio trước rồi mới kết nối');
    return await Promise.race([
      conn.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('quá 30 giây không vào được phòng live')), 30_000)),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    liveStats = { ...liveStats, isConnected: false, isConnecting: false, error: msg };
    broadcast('status', liveStats);
    if (activeConn === conn) {
      try { conn.disconnect(); } catch {}
      activeConn = null;
    }
    throw err;
  }
}

app.post('/api/tiktok/disconnect', (_req, res) => {
  stopReconnect();
  wantUser = '';
  saveSettings({ tiktokUser: '' });
  try { activeConn?.disconnect(); } catch {}
  activeConn = null;
  liveStats = emptyStats();
  broadcast('status', liveStats);
  res.json({ success: true });
});

// ---------- Tắt Server & giải phóng Port 4016 ----------
let httpServer: ReturnType<typeof app.listen> | null = null;
app.post('/api/server/shutdown', (_req, res) => {
  stopReconnect();
  wantUser = '';
  try { activeConn?.disconnect(); } catch {}
  activeConn = null;
  broadcast('shutdown', { port: PORT });
  res.json({ success: true, port: PORT, message: `Đã tắt Server và giải phóng hoàn toàn cổng ${PORT}` });
  setTimeout(() => {
    for (const c of sseClients) {
      try { c.end(); } catch {}
    }
    sseClients = [];
    cleanupWorker();
    try { (httpServer as any)?.closeAllConnections?.(); } catch {}
    httpServer?.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 300).unref();
  }, 180);
});

// ---------- Đồng bộ âm thanh Admin <-> Stage ----------
app.get('/api/audio', (_req, res) => res.json(audioCfg()));
app.post('/api/audio', (req, res) => {
  const body = req.body || {};
  const patch: Partial<SettingsData> = {};
  for (const k of ['masterEnabled', 'musicEnabled', 'voiceEnabled'] as const) {
    if (body[k] !== undefined) patch[k] = Boolean(body[k]);
  }
  if (body.musicVolume !== undefined) patch.musicVolume = clamp01(body.musicVolume, 0.16);
  if (body.sfxVolume !== undefined) patch.sfxVolume = clamp01(body.sfxVolume, 0.45);
  if (body.voiceVolume !== undefined) patch.voiceVolume = clamp01(body.voiceVolume, 1.0);
  saveSettings(patch);
  const next = audioCfg();
  broadcast('audioCfg', next);
  res.json({ success: true, ...next });
});

// ---------- Lệnh điều khiển ----------
const CONTROL_ACTIONS = ['speak', 'setRate', 'reset', 'setName', 'custom'];
app.post('/api/control', (req, res) => {
  const { action, text } = req.body || {};
  if (!CONTROL_ACTIONS.includes(action)) return res.status(400).json({ success: false, error: 'Lệnh không hợp lệ' });
  if (action === 'speak' && (typeof text !== 'string' || !text.trim())) {
    return res.status(400).json({ success: false, error: 'Chưa nhập nội dung cần đọc' });
  }
  const payload = { action, text: typeof text === 'string' ? text.trim().slice(0, 1000) : undefined };
  if (action === 'setRate' && payload.text) lastRateControl = { action, text: payload.text };
  if (action === 'setName') {
    const name = (payload.text || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 40);
    if (!name) return res.status(400).json({ success: false, error: 'Chưa nhập tên kênh' });
    payload.text = name;
    lastNameControl = { action, text: name };
    saveSettings({ channelName: name });
    broadcast('caiDat', caiDat());
  }
  broadcast('control', payload);
  res.json({ success: true, pages: sseClients.length });
});

// ---------- Giả lập sự kiện ----------
const TEST_EVENTS = ['chat', 'gift', 'member', 'follow', 'share', 'like'];
app.post('/api/test/emit', (req, res) => {
  const { type, data } = req.body || {};
  if (!TEST_EVENTS.includes(type)) return res.status(400).json({ success: false, error: 'Loại sự kiện không hợp lệ' });
  const event = { timestamp: Date.now(), avatar: '', ...(data || {}) };
  if (type === 'like') {
    liveStats.totalLikes += Number(event.likeCount) || 1;
    event.totalLikes = liveStats.totalLikes;
  }
  broadcast(type, event);
  res.json({ success: true });
});

// ---------- Cài đặt hiển thị & Dữ liệu ván đấu ----------
app.get('/api/cai-dat', (_req, res) => res.json(caiDat()));
app.post('/api/cai-dat', (req, res) => {
  const sach = (x: unknown) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, 34) : undefined);
  const tieuDe = sach(req.body?.tieuDe);
  const tenMc = sach(req.body?.tenMc);
  const thoiGianVong = Array.isArray(req.body?.thoiGianVong) ? chuanHoaThoiGian(req.body.thoiGianVong) : undefined;
  const thoiGianMoDapAn = req.body?.thoiGianMoDapAn !== undefined ? chuanHoaThoiGianMoDapAn(req.body.thoiGianMoDapAn) : undefined;
  saveSettings({
    ...(tieuDe !== undefined && { tieuDe }),
    ...(tenMc !== undefined && { tenMc }),
    ...(thoiGianVong !== undefined && { thoiGianVong }),
    ...(thoiGianMoDapAn !== undefined && { thoiGianMoDapAn }),
  });
  broadcast('caiDat', caiDat());
  res.json({ success: true, ...caiDat() });
});

app.post('/api/game/state', (req, res) => {
  latestGameState = req.body || {};
  broadcast('gamestate', latestGameState);
  res.json({ success: true });
});

const USED_FILE = path.join(__dirname, 'data', 'da-hoi.json');
app.get('/api/da-hoi', (_req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(USED_FILE, 'utf8')));
  } catch {
    res.json({});
  }
});
app.post('/api/da-hoi', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ success: false });
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(body)) if (typeof v === 'number' && k.length < 300) clean[k] = v;
  try {
    fs.mkdirSync(path.dirname(USED_FILE), { recursive: true });
    fs.writeFileSync(USED_FILE, JSON.stringify(clean));
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

const TUAN_FILE = path.join(__dirname, 'data', 'bang-tuan.json');
type BangTuan = { tuan: string; ds: Record<string, { name: string; avatar: string; diem: number; van: number }> };
function tuanNay(d = new Date()) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
function docTuan(): BangTuan {
  try {
    const b = JSON.parse(fs.readFileSync(TUAN_FILE, 'utf8')) as BangTuan;
    if (b.tuan === tuanNay() && b.ds) return b;
  } catch {}
  return { tuan: tuanNay(), ds: {} };
}
const topTuan = (b: BangTuan, n = 10) =>
  Object.entries(b.ds)
    .sort((a, c) => c[1].diem - a[1].diem)
    .slice(0, n)
    .map(([id, x]) => ({ id, name: x.name, avatar: x.avatar, diem: x.diem }));

app.get('/api/bang-tuan', (_req, res) => res.json({ top: topTuan(docTuan()) }));
app.post('/api/bang-tuan', (req, res) => {
  const ds = Array.isArray(req.body?.ds) ? req.body.ds.slice(0, 2000) : null;
  if (!ds) return res.status(400).json({ success: false });
  const b = docTuan();
  for (const x of ds) {
    const id = typeof x?.id === 'string' ? x.id.slice(0, 100) : '';
    const diem = Number(x?.diem);
    if (!id || !Number.isFinite(diem) || diem <= 0 || diem > 30_000) continue;
    const cu = b.ds[id] ?? { name: '', avatar: '', diem: 0, van: 0 };
    b.ds[id] = {
      name: String(x.name ?? cu.name).slice(0, 60),
      avatar: typeof x.avatar === 'string' && x.avatar.startsWith('https://') ? x.avatar.slice(0, 500) : cu.avatar,
      diem: cu.diem + Math.round(diem),
      van: cu.van + 1,
    };
  }
  try {
    fs.mkdirSync(path.dirname(TUAN_FILE), { recursive: true });
    fs.writeFileSync(TUAN_FILE, JSON.stringify(b));
  } catch {}
  res.json({ top: topTuan(b) });
});

// ---------- Giọng đọc (VieNeu AI v3 Turbo + Microsoft Edge Neural + Google TTS) ----------
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Làm sạch văn bản trước khi đưa vào bộ tổng hợp giọng đọc tiếng Việt:
 * - Loại bỏ chữ Hán tự trong ngoặc (VD: "(燦爛: «xán» là sáng sủa)" -> "(xán là sáng sủa)", "(婦)" -> "")
 *   để bộ âm vị VieNeu / Edge TTS không bị ngắt câu giữa chừng khi gặp ký tự CJK.
 * - Chuẩn hóa các ký hiệu « », ×2, 1/2, A/B thành từ đọc tự nhiên.
 */
function sanitizeTextForTts(raw: string): string {
  return raw
    .replace(/\[[^\]]*\]\s*/g, '')
    .replace(/[\u3400-\u9FBF\uF900-\uFAFF]+/g, '')
    .replace(/\(\s*[:;,-]?\s*\)/g, '')
    .replace(/\(\s*[:;,-]+\s*/g, '(')
    .replace(/[«»“”"]/g, ' ')
    .replace(/×\s*2\b/gi, ' nhân đôi ')
    .replace(/\b1\s*\/\s*2\b/g, '1 hoặc 2')
    .replace(/\bA\s*\/\s*B\b/g, 'A hoặc B')
    .replace(/\s+/g, ' ')
    .trim();
}
function splitText(text: string, max = 190): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const win = rest.slice(0, max + 1);
    let cut = Math.max(win.lastIndexOf('. '), win.lastIndexOf('! '), win.lastIndexOf('? '));
    if (cut < max / 2) cut = Math.max(win.lastIndexOf(', '), win.lastIndexOf('; '));
    if (cut < max / 2) cut = win.lastIndexOf(' ');
    if (cut <= 0) cut = max - 1;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function edgeTts(text: string, rate: number, voiceId = 'vi-VN-NamMinhNeural'): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const pitch = voiceId.includes('HoaiMy') ? '+2%' : '-3%';
    const { audioStream } = tts.toStream(escapeXml(text), { rate: `${Math.round((rate - 1) * 100)}%`, pitch });
    const chunks: Buffer[] = [];
    const read = (async () => {
      for await (const c of audioStream) chunks.push(c as Buffer);
    })();
    await Promise.race([read, new Promise((_, reject) => setTimeout(() => reject(new Error('Edge TTS timeout')), 18_000))]);
    if (chunks.length === 0) throw new Error('Edge TTS empty');
    return Buffer.concat(chunks);
  } finally {
    tts.close();
  }
}

async function googleTts(text: string): Promise<Buffer> {
  const parts: Buffer[] = [];
  for (const chunk of splitText(text)) {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`Google TTS HTTP ${r.status}`);
    parts.push(Buffer.from(await r.arrayBuffer()));
  }
  return Buffer.concat(parts);
}

const ttsCache = new Map<string, Buffer>();
interface VieneuVoiceInfo { id: string; name: string; description: string; gender: string; }
interface VieneuJob {
  id: number;
  text: string;
  voice: string;
  res: express.Response;
  parts: Buffer[];
  timer: ReturnType<typeof setTimeout>;
  resolve: (ok: boolean) => void;
}

let activeVieneuVoice = settings.vieneuVoice !== undefined ? settings.vieneuVoice : (process.env.VIENEU_VOICE ?? 'Adam bựa');
let activeEdgeVoice = settings.edgeVoice || 'vi-VN-NamMinhNeural';
let vieneuState: 'loading' | 'ready' | 'unavailable' = 'loading';
let vieneuVoices: VieneuVoiceInfo[] = [];
const vieneuCache = new Map<string, Buffer>();
let vieneuProc: ChildProcessByStdio<Writable, Readable, null> | null = null;
let nextJobId = 1;
let currentJob: VieneuJob | null = null;
const priorityJobs: VieneuJob[] = [];
const prefetchJobs: VieneuJob[] = [];

const getVieneuStatus = () => ({
  state: vieneuState,
  voice: activeVieneuVoice,
  edgeVoice: activeEdgeVoice,
  voices: vieneuVoices,
});

function pumpVieneuQueue() {
  if (currentJob || vieneuState !== 'ready' || !vieneuProc?.stdin.writable) return;
  while (priorityJobs.length > 0 || prefetchJobs.length > 0) {
    const job = priorityJobs.shift() ?? prefetchJobs.shift()!;
    if (job.res.writableEnded || job.res.destroyed) {
      clearTimeout(job.timer);
      job.resolve(true);
      continue;
    }
    const cacheKey = `${job.voice}|${job.text}`;
    const cached = vieneuCache.get(cacheKey);
    if (cached) {
      clearTimeout(job.timer);
      job.res.setHeader('Content-Type', 'audio/wav');
      job.res.send(cached);
      job.resolve(true);
      continue;
    }
    currentJob = job;
    try {
      vieneuProc.stdin.write(JSON.stringify({ id: job.id, text: job.text, voice: job.voice }) + '\n');
      return;
    } catch {
      clearTimeout(job.timer);
      currentJob = null;
      job.resolve(false);
    }
  }
}

function findVieneuEnv() {
  const dirs = [
    process.env.VIENEU_DIR,
    path.join(__dirname, 'VieNeu-TTS'),
    path.resolve(__dirname, '..', 'LIVE-TRANGNGUYEN', 'VieNeu-TTS'),
  ].filter((x): x is string => Boolean(x));
  for (const d of dirs) {
    const pyExe = path.join(d, '.venv', 'Scripts', 'python.exe');
    const workers = [
      path.join(__dirname, 'tools', 'vieneu-worker.py'),
      path.resolve(d, '..', 'tools', 'vieneu-worker.py'),
    ];
    const workerScript = workers.find((w) => fs.existsSync(w));
    if (fs.existsSync(pyExe) && workerScript) return { vieneuDir: d, pyExe, workerScript };
  }
  return null;
}

function startVieneuWorker() {
  const found = findVieneuEnv();
  if (!found) {
    vieneuState = 'unavailable';
    broadcast('vieneu', getVieneuStatus());
    return;
  }
  vieneuState = 'loading';
  broadcast('vieneu', getVieneuStatus());

  const proc = spawn(found.pyExe, ['-u', found.workerScript], {
    cwd: found.vieneuDir,
    stdio: ['pipe', 'pipe', 'inherit'],
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
      HF_HUB_OFFLINE: '1',
      VIENEU_PRECISION: process.env.VIENEU_PRECISION || 'int8',
      VIENEU_WATERMARK: '0',
    },
  });
  vieneuProc = proc;

  let rxBuf: Buffer = Buffer.alloc(0);
  proc.stdout.on('data', (chunk: Buffer) => {
    rxBuf = rxBuf.length === 0 ? chunk : Buffer.concat([rxBuf, chunk]);
    while (rxBuf.length >= 9) {
      const frameType = rxBuf.readUInt8(0);
      const reqId = rxBuf.readUInt32BE(1);
      const payloadLen = rxBuf.readUInt32BE(5);
      if (rxBuf.length < 9 + payloadLen) break;
      const payload = rxBuf.subarray(9, 9 + payloadLen);
      rxBuf = rxBuf.subarray(9 + payloadLen);

      if (frameType === 1) {
        try {
          const info = JSON.parse(payload.toString('utf8'));
          vieneuVoices = Array.isArray(info.voices) ? info.voices : [];
        } catch {
          vieneuVoices = [];
        }
        vieneuState = 'ready';
        broadcast('vieneu', getVieneuStatus());
        pumpVieneuQueue();
      } else if (frameType === 2 && currentJob?.id === reqId) {
        currentJob.parts.push(Buffer.from(payload));
      } else if (frameType === 3 && currentJob?.id === reqId) {
        const job = currentJob;
        currentJob = null;
        clearTimeout(job.timer);
        if (job.parts.length > 0) {
          const fullWav = Buffer.concat(job.parts);
          // Ghi chính xác độ dài byte thực tế vào WAV Header (offset 4 và offset 40) thay cho 0xFFFFFFFF
          // giúp trình duyệt phát trọn vẹn từ chữ đầu tới chữ cuối mà không bao giờ bị ngắt giữa các vế câu
          if (fullWav.length >= 44) {
            fullWav.writeUInt32LE(fullWav.length - 8, 4);
            fullWav.writeUInt32LE(fullWav.length - 44, 40);
          }
          vieneuCache.set(`${job.voice}|${job.text}`, fullWav);
          if (vieneuCache.size > 150) vieneuCache.delete(vieneuCache.keys().next().value!);
          if (!job.res.writableEnded && !job.res.destroyed) {
            job.res.setHeader('Content-Type', 'audio/wav');
            job.res.setHeader('Cache-Control', 'public, max-age=86400');
            job.res.send(fullWav);
          }
          job.resolve(true);
        } else {
          job.resolve(false);
        }
        pumpVieneuQueue();
      } else if (frameType === 4 && currentJob?.id === reqId) {
        const job = currentJob;
        currentJob = null;
        clearTimeout(job.timer);
        job.resolve(false);
        pumpVieneuQueue();
      }
    }
  });

  proc.on('exit', () => {
    if (vieneuProc !== proc) return;
    vieneuProc = null;
    if (currentJob) {
      const job = currentJob;
      currentJob = null;
      clearTimeout(job.timer);
      job.resolve(false);
    }
    vieneuState = 'unavailable';
    broadcast('vieneu', getVieneuStatus());
  });
}

const cleanupWorker = () => {
  if (vieneuProc) {
    try { vieneuProc.kill(); } catch {}
    vieneuProc = null;
  }
};
process.on('exit', cleanupWorker);
process.on('SIGINT', () => { cleanupWorker(); process.exit(0); });
process.on('SIGTERM', () => { cleanupWorker(); process.exit(0); });

async function vieneuTts(text: string, res: express.Response, isPrefetch: boolean): Promise<boolean> {
  const voice = activeVieneuVoice;
  if (!voice || voice.startsWith('edge:') || voice.startsWith('google:')) return false;
  const cacheKey = `${voice}|${text}`;
  const cached = vieneuCache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'audio/wav');
    res.send(cached);
    return true;
  }
  if (vieneuState === 'unavailable') return false;
  if (vieneuState === 'loading' && !isPrefetch) return false;

  return new Promise<boolean>((resolve) => {
    const id = nextJobId++;
    const timeoutMs = isPrefetch ? 45_000 : 12_000;
    const job: VieneuJob = {
      id, text, voice, res, parts: [], resolve,
      timer: setTimeout(() => {
        const idx1 = priorityJobs.indexOf(job);
        if (idx1 !== -1) priorityJobs.splice(idx1, 1);
        const idx2 = prefetchJobs.indexOf(job);
        if (idx2 !== -1) prefetchJobs.splice(idx2, 1);
        if (currentJob !== job) resolve(false);
      }, timeoutMs),
    };
    if (isPrefetch) prefetchJobs.push(job);
    else priorityJobs.push(job);
    pumpVieneuQueue();
  });
}

app.get('/api/tts/status', (_req, res) => res.json(getVieneuStatus()));
app.post('/api/tts/voice', (req, res) => {
  const v = typeof req.body?.voice === 'string' ? req.body.voice.trim().slice(0, 60) : '';
  if (v.startsWith('edge:')) {
    activeVieneuVoice = '';
    activeEdgeVoice = v.slice(5) || 'vi-VN-NamMinhNeural';
    saveSettings({ vieneuVoice: '', edgeVoice: activeEdgeVoice });
  } else if (v === 'google:vi') {
    activeVieneuVoice = 'google:vi';
    saveSettings({ vieneuVoice: 'google:vi' });
  } else {
    activeVieneuVoice = v;
    saveSettings({ vieneuVoice: v });
  }
  broadcast('vieneu', getVieneuStatus());
  broadcast('control', { action: 'setVoice', text: v || activeEdgeVoice });
  res.json({ success: true, ...getVieneuStatus() });
});

app.get('/api/tts', async (req, res) => {
  try {
    const raw = String(req.query.text || '').trim().slice(0, 1500);
    if (!raw) return res.status(400).send('Thiếu text');
    const text = sanitizeTextForTts(raw);
    if (!text) return res.status(204).end();
    const rate = Math.min(1.5, Math.max(0.5, Number(req.query.rate) || 1));
    const isPrefetch = req.query.prefetch === '1';
    if (activeVieneuVoice && !activeVieneuVoice.startsWith('edge:') && activeVieneuVoice !== 'google:vi') {
      if (await vieneuTts(text, res, isPrefetch)) return;
    }
    const engineKey = activeVieneuVoice === 'google:vi' ? 'google' : activeEdgeVoice;
    const key = `${engineKey}|${rate}|${text}`;
    let audio = ttsCache.get(key);
    if (!audio) {
      if (activeVieneuVoice === 'google:vi') {
        audio = await googleTts(text);
      } else {
        try {
          audio = await edgeTts(text, rate, activeEdgeVoice);
        } catch {
          audio = await googleTts(text);
        }
      }
      ttsCache.set(key, audio);
      if (ttsCache.size > 200) ttsCache.delete(ttsCache.keys().next().value!);
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(audio);
  } catch (err) {
    console.error('TTS lỗi:', err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

async function start() {
  const distDir = path.join(__dirname, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  if (process.env.NODE_ENV !== 'production' || !fs.existsSync(distIndex)) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: process.env.LIVE_MODE === '1' ? { middlewareMode: true, hmr: false, ws: false } : { middlewareMode: true, hmr: { port: 24686 } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => res.sendFile(distIndex));
  }

  startVieneuWorker();

  httpServer = app.listen(PORT, '127.0.0.1', () => {
    console.log(`Vua Chính Tả chạy ở http://localhost:${PORT}  |  Link LIVE Studio: http://lvh.me:${PORT}/?view=stage`);
    if (wantUser) {
      connectTikTok(wantUser).catch((err) => scheduleReconnect(`Chưa kết nối được (${err instanceof Error ? err.message : err})`));
    }
  });
}

start();

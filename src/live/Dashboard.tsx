import { useEffect, useState, type ReactNode } from 'react';
import type { AudioConfig, LiveStatus } from './types';
import { emitTest, pushAudioConfig, sendControl } from './page';

interface VieneuVoice {
  id: string;
  name: string;
  description: string;
  gender: string;
}
interface VieneuStatus {
  state: 'loading' | 'ready' | 'unavailable';
  voice: string;
  edgeVoice?: string;
  voices: VieneuVoice[];
}

const FAKE_NAMES = ['Lan Anh', 'Minh Tuấn', 'Bé Na 🌸', 'Hoàng Long', 'Thu Trang', 'Quốc Bảo', 'duyanh99', 'Ngọc Hà Nội'];
const pick = () => {
  const nickname = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  return { nickname, username: `${nickname.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'khach'}_${Math.floor(10 + Math.random() * 89)}` };
};

export function Dashboard({
  status,
  channelName,
  audioCfg,
  adminMonitor,
  stageCount,
  onToggleAdminMonitor,
  sampleAnswer,
  preview,
  extra,
}: {
  status: LiveStatus | null;
  channelName: string;
  audioCfg: AudioConfig;
  adminMonitor: boolean;
  stageCount: number;
  onToggleAdminMonitor: () => void;
  sampleAnswer?: string;
  preview: ReactNode;
  extra?: ReactNode;
}) {
  const [user, setUser] = useState(() => localStorageGet('tiktokUser'));
  const [nameText, setNameText] = useState('');
  const [msg, setMsg] = useState('');
  const [speakText, setSpeakText] = useState('');
  const [busy, setBusy] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vieneu, setVieneu] = useState<VieneuStatus>({ state: 'loading', voice: 'Adam bựa', edgeVoice: 'vi-VN-NamMinhNeural', voices: [] });

  const port = window.location.port || '4016';
  const stageUrl = `http://lvh.me:${port}/?view=stage`;
  const isAB = sampleAnswer === 'A' || sampleAnswer === 'B';
  const lbl1 = isAB ? 'A' : '1';
  const lbl2 = isAB ? 'B' : '2';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = () => {
      fetch('/api/tts/status')
        .then((r) => r.json())
        .then((d: VieneuStatus) => {
          setVieneu(d);
          if (d.state === 'loading') timer = setTimeout(load, 2000);
        })
        .catch(() => {});
    };
    load();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const selectedVoiceValue = vieneu.voice
    ? vieneu.voice
    : `edge:${vieneu.edgeVoice || 'vi-VN-NamMinhNeural'}`;

  const changeVoice = async (newVoice: string) => {
    try {
      const r = await fetch('/api/tts/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: newVoice }),
      }).then((x) => x.json());
      if (r.state) setVieneu(r);
      setMsg(
        newVoice.startsWith('edge:')
          ? `Đã đổi sang giọng Microsoft Edge (${newVoice.includes('HoaiMy') ? 'Hoài My' : 'Nam Minh'})`
          : newVoice === 'google:vi'
            ? 'Đã đổi sang giọng Google Tiếng Việt'
            : `Đã đổi sang giọng AI VieNeu: ${newVoice}`
      );
    } catch (e) {
      setMsg(String(e));
    }
  };

  const connect = async () => {
    setBusy(true);
    setMsg('');
    localStorageSet('tiktokUser', user);
    try {
      const r = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user }),
      }).then((x) => x.json());
      setMsg(r.success ? 'Đã kết nối phòng LIVE!' : r.error);
    } catch (e) {
      setMsg(String(e));
    }
    setBusy(false);
  };

  const disconnect = () => {
    void fetch('/api/tiktok/disconnect', { method: 'POST' });
    setMsg('Đã ngắt kết nối TikTok LIVE');
  };

  const shutdownServer = async () => {
    setShuttingDown(true);
    try {
      const r = await fetch('/api/server/shutdown', { method: 'POST' }).then((x) => x.json());
      setMsg(r.message || `Đã tắt Server và giải phóng hoàn toàn cổng ${port}!`);
    } catch {
      setMsg(`Server đã dừng và cổng ${port} đã được giải phóng.`);
    }
  };

  const speak = async () => {
    if (!audioCfg.masterEnabled || !audioCfg.voiceEnabled) {
      setMsg('⚠️ Hãy bật "Âm thanh game" và "Giọng MC" trước khi bấm Đọc ngay.');
      return;
    }
    const r = await sendControl('speak', speakText);
    setMsg(r.pages > 1 ? `Đã gửi câu đọc (${r.pages} trang đang mở)` : 'Đã gửi câu đọc');
    setSpeakText('');
  };

  const saveName = async () => {
    const r = await sendControl('setName', nameText);
    setMsg(r.success ? `Đã lưu tên kênh: ${nameText.trim()}` : r.error);
    if (r.success) setNameText('');
  };

  const copyStageUrl = async () => {
    try {
      await navigator.clipboard.writeText(stageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          {/* CARD 1: Kết nối TikTok LIVE + Giải phóng Port */}
          <Card
            title="Kết nối TikTok LIVE (Vua Chính Tả · Port 4016)"
            right={
              <Btn tone="danger" onClick={shutdownServer} disabled={shuttingDown}>
                {shuttingDown ? 'Đang tắt...' : `🔌 Tắt Live & Giải phóng Port ${port}`}
              </Btn>
            }
          >
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-amber-400"
                placeholder="username TikTok (không cần @)"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && user.trim() && connect()}
              />
              <Btn onClick={connect} disabled={busy || !user.trim()}>
                {busy ? 'Đang nối...' : 'Kết nối'}
              </Btn>
              <Btn onClick={disconnect} tone="ghost">
                Ngắt
              </Btn>
            </div>
            <div className="mt-3 text-sm">
              Trạng thái:{' '}
              {status?.isConnected ? (
                <span className="text-emerald-400">
                  Đang live @{status.username} · {status.viewerCount} người xem · {status.totalLikes} tim
                </span>
              ) : status?.isConnecting ? (
                <span className="text-amber-400">Đang kết nối...</span>
              ) : (
                <span className="text-slate-400">Chưa kết nối</span>
              )}
            </div>
            {(msg || status?.error) && <div className="mt-1.5 text-sm text-amber-300">{msg || status?.error}</div>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
              <div>
                Link cho TikTok LIVE Studio: <b className="text-slate-200">{stageUrl}</b> · 1080 × 1920. Chỉ trang đó phát tiếng.
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={copyStageUrl}
                  className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:ring-amber-400"
                >
                  {copied ? '✅ Đã chép' : '📋 Sao chép'}
                </button>
                <a
                  href="/?view=stage"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:ring-amber-400"
                >
                  ↗ Mở Stage
                </a>
              </div>
            </div>
          </Card>

          {/* CARD 2: Giọng đọc & Âm thanh trên stage */}
          <Card title="Giọng đọc & Âm thanh trên stage">
            <div className="mb-3 rounded-xl bg-slate-800/70 p-3 text-sm ring-1 ring-slate-700/60">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-200">Bộ giọng đọc Học Giả MC:</span>
                {vieneu.state === 'loading' ? (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    ⏳ Đang nạp model AI VieNeu (~10s)...
                  </span>
                ) : vieneu.state === 'ready' && vieneu.voice && vieneu.voice !== 'google:vi' ? (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                    🟢 VieNeu AI sẵn sàng ({vieneu.voice})
                  </span>
                ) : vieneu.voice === 'google:vi' ? (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    🌐 Đang dùng Google Tiếng Việt
                  </span>
                ) : (
                  <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                    🔵 Microsoft Edge ({vieneu.edgeVoice?.includes('HoaiMy') ? 'Hoài My' : 'Nam Minh'})
                  </span>
                )}
              </div>
              <select
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-amber-400"
                value={selectedVoiceValue}
                onChange={(e) => changeVoice(e.target.value)}
              >
                {(vieneu.voices.length > 0
                  ? vieneu.voices
                  : [{ id: 'Adam bựa', name: 'Adam bựa', description: 'Nam · Bắc · Tự nhiên hài hước', gender: 'male' }]
                ).map((v) => (
                  <option key={v.id} value={v.id}>
                    🎙️ VieNeu AI: {v.name} {v.description ? `— ${v.description}` : ''}
                  </option>
                ))}
                <option value="edge:vi-VN-NamMinhNeural">🌐 Microsoft Edge: Nam Minh (Nam · Đĩnh đạc)</option>
                <option value="edge:vi-VN-HoaiMyNeural">🌐 Microsoft Edge: Hoài My (Nữ · Truyền cảm)</option>
                <option value="google:vi">🌐 Google Tiếng Việt (Chị Google — cực nhanh)</option>
              </select>

              {/* Bàn trộn âm thanh 3 kênh đồng bộ thời gian thực */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-700/60 pt-3">
                <button
                  onClick={() => pushAudioConfig({ masterEnabled: !audioCfg.masterEnabled })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ${
                    audioCfg.masterEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 ring-rose-500/40'
                  }`}
                >
                  {audioCfg.masterEnabled ? '🔊 Âm thanh game: BẬT' : '🔇 Âm thanh game: TẮT'}
                </button>
                <button
                  onClick={() => pushAudioConfig({ musicEnabled: !audioCfg.musicEnabled })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ${
                    audioCfg.masterEnabled && audioCfg.musicEnabled
                      ? 'bg-amber-500/20 text-amber-300 ring-amber-500/40'
                      : 'bg-slate-900 text-slate-400 ring-slate-700'
                  }`}
                >
                  {audioCfg.musicEnabled ? '♫ Nhạc nền: BẬT' : '♫ Nhạc nền: TẮT'}
                </button>
                <button
                  onClick={() => pushAudioConfig({ voiceEnabled: !audioCfg.voiceEnabled })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ${
                    audioCfg.masterEnabled && audioCfg.voiceEnabled
                      ? 'bg-amber-500/20 text-amber-300 ring-amber-500/40'
                      : 'bg-slate-900 text-slate-400 ring-slate-700'
                  }`}
                >
                  {audioCfg.voiceEnabled ? '🗣 Giọng MC: BẬT' : '🗣 Giọng MC: TẮT'}
                </button>
              </div>
              <div className="mt-2.5 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                <label className="flex items-center gap-2">
                  <span className="shrink-0">Nhạc nền</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={audioCfg.musicVolume}
                    onChange={(e) => pushAudioConfig({ musicVolume: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <b className="w-9 text-right text-amber-300">{Math.round(audioCfg.musicVolume * 100)}%</b>
                </label>
                <label className="flex items-center gap-2">
                  <span className="shrink-0">Hiệu ứng</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioCfg.sfxVolume}
                    onChange={(e) => pushAudioConfig({ sfxVolume: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <b className="w-9 text-right text-amber-300">{Math.round(audioCfg.sfxVolume * 100)}%</b>
                </label>
                <label className="flex items-center gap-2">
                  <span className="shrink-0">Giọng MC</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioCfg.voiceVolume}
                    onChange={(e) => pushAudioConfig({ voiceVolume: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <b className="w-9 text-right text-amber-300">{Math.round(audioCfg.voiceVolume * 100)}%</b>
                </label>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span>
                Tên kênh: <b className="text-amber-300">{channelName}</b>
              </span>
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-amber-400"
                placeholder="Đổi tên kênh mà MC xưng..."
                maxLength={40}
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nameText.trim() && saveName()}
              />
              <Btn onClick={saveName} disabled={!nameText.trim()}>
                Lưu tên
              </Btn>
            </div>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg bg-slate-800 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-amber-400"
                placeholder="Gõ câu muốn MC đọc ngay..."
                value={speakText}
                onChange={(e) => setSpeakText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && speakText.trim() && speak()}
              />
              <Btn onClick={speak} disabled={!speakText.trim()}>
                Đọc ngay
              </Btn>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              Tốc độ:
              {['0.85', '1', '1.15', '1.3'].map((r) => (
                <Btn key={r} tone="ghost" onClick={() => sendControl('setRate', r)}>
                  {r}×
                </Btn>
              ))}
              <Btn tone="danger" onClick={() => sendControl('reset')}>
                Reset ván đấu
              </Btn>
            </div>
          </Card>

          {/* CARD 3: Giả lập (test khi chưa live) */}
          <Card title="Giả lập 1 chạm (test khi chưa live)">
            <div className="flex flex-wrap gap-2">
              <Btn tone="ghost" onClick={() => emitTest('member', pick())}>
                👋 Người vào
              </Btn>
              {sampleAnswer && (
                <Btn tone="primary" onClick={() => emitTest('chat', { ...pick(), comment: sampleAnswer, createTime: Date.now() - 350 })}>
                  🎯 Gõ đúng: "{sampleAnswer}"
                </Btn>
              )}
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: lbl1, createTime: Date.now() - 400 })}>
                🔵 Bình luận chọn [{lbl1}]
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: lbl2, createTime: Date.now() - 400 })}>
                🟠 Bình luận chọn [{lbl2}]
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'miền Bắc' })}>
                🚩 Chọn Miền Bắc
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'câu này dễ nhầm thật thầy ơi' })}>
                💬 Comment khen hay
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('chat', { ...pick(), comment: 'khó quá gợi ý đi ạ' })}>
                🤔 Xin gợi ý
              </Btn>
              <Btn
                tone="ghost"
                onClick={() => emitTest('gift', { ...pick(), giftName: 'Hoa hồng', giftId: 5655, diamondCount: 1, repeatCount: 5 })}
              >
                🌹 5 Hoa hồng
              </Btn>
              <Btn
                tone="ghost"
                onClick={() => emitTest('gift', { ...pick(), giftName: 'Pháo hoa vinh quy', giftId: 6369, diamondCount: 299, repeatCount: 1 })}
              >
                🎆 Quà lớn (Pháo hoa)
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('follow', pick())}>
                ➕ Follow
              </Btn>
              <Btn tone="ghost" onClick={() => emitTest('like', { ...pick(), likeCount: 200 })}>
                ❤️ +200 tim (Cứu trợ gợi ý)
              </Btn>
            </div>
            <p className="mt-2 text-xs text-slate-500">Sự kiện giả đi tới mọi trang đang mở, kể cả stage trong LIVE Studio.</p>
          </Card>

          {extra}

          {/* CARD 5: Thông tin dự án & Tác giả */}
          <Card title="Thông tin dự án & Tác giả (Info)">
            <div className="space-y-2.5 text-sm text-slate-300">
              <p>
                <b className="text-amber-300">Vua Chính Tả — Đấu Trường Tiếng Việt 1 vs 2 (LIVE-CHINHTA-TIKTOK v1.0)</b> — Game show đối kháng chính tả Tiếng Việt siêu tốc gõ <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">1</code> hoặc <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">2</code> với luật Bút Sa Gà Chết & thanh kéo co đám đông trực tiếp cho TikTok LIVE, phát triển bởi{' '}
                <a
                  href="https://duongbirken.deta.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-amber-400 underline decoration-amber-400/50 hover:text-amber-300"
                >
                  Duong Birken
                </a>
                .
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="https://duongbirken.deta.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  🌐 Website: duongbirken.deta.vn
                </a>
                <a
                  href="/?view=stage"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700"
                >
                  📺 Mở màn hình Stage (1080 × 1920)
                </a>
              </div>
            </div>
          </Card>
        </div>

        <div className="justify-self-center md:sticky md:top-6 md:self-start">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              {!audioCfg.masterEnabled
                ? 'Xem trước (đã tắt âm thanh)'
                : adminMonitor
                  ? 'Xem trước (đang bật loa Admin)'
                  : stageCount > 0
                    ? 'Xem trước (im lặng · Stage đang phát)'
                    : 'Xem trước (im lặng)'}
            </span>
            <button
              onClick={onToggleAdminMonitor}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${
                adminMonitor
                  ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                  : 'bg-slate-900 text-slate-300 ring-slate-700 hover:ring-amber-400'
              }`}
            >
              {adminMonitor ? '🔊 Tắt loa Admin' : '🔈 Nghe tại Admin'}
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-700 shadow-2xl">{preview}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  tone = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'ghost' | 'danger';
}) {
  const cls = {
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    ghost: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    danger: 'bg-rose-700 text-white hover:bg-rose-600',
  }[tone];
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

function localStorageGet(k: string) {
  try {
    return localStorage.getItem(k) || '';
  } catch {
    return '';
  }
}
function localStorageSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

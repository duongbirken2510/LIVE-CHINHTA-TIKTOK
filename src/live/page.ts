const params = new URLSearchParams(window.location.search);
export const IS_STAGE = params.get('view') === 'stage' || params.has('overlay');
export const MUTE = params.get('mute') === '1';
export const STAGE_ID = IS_STAGE ? Math.random().toString(36).slice(2, 10) : '';

export const STAGE_W = 1080;
export const STAGE_H = 1920;

export async function sendControl(action: string, text?: string) {
  const r = await fetch('/api/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, text }),
  });
  return r.json();
}

export async function emitTest(type: string, data: Record<string, unknown>) {
  await fetch('/api/test/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });
}

export async function pushAudioConfig(patch: Record<string, unknown>) {
  const r = await fetch('/api/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return r.json();
}

import { useEffect, useRef } from 'react';
import type { LiveHandlers } from './types';
import { IS_STAGE, STAGE_ID } from './page';
import { voice } from './voice';

export function useLiveEvents(handlers: LiveHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const on = (name: string, fn: (data: any) => void) =>
      source!.addEventListener(name, (e) => {
        try {
          fn(JSON.parse((e as MessageEvent).data));
        } catch (err) {
          console.warn(`Lỗi xử lý sự kiện ${name}:`, err);
        }
      });

    const connect = () => {
      source = new EventSource(IS_STAGE ? `/api/tiktok/events?stage=${STAGE_ID}` : '/api/tiktok/events');
      on('status', (d) => ref.current.onStatus?.(d));
      on('chat', (d) => ref.current.onChat?.(d));
      on('gift', (d) => ref.current.onGift?.(d));
      on('member', (d) => ref.current.onMember?.(d));
      on('follow', (d) => ref.current.onFollow?.(d));
      on('share', (d) => ref.current.onShare?.(d));
      on('like', (d) => ref.current.onLike?.(d));
      on('roomUser', (d) => ref.current.onViewers?.(d.viewerCount));
      on('control', (d) => ref.current.onControl?.(d));
      on('gamestate', (d) => ref.current.onGameState?.(d));
      on('caiDat', (d) => ref.current.onCaiDat?.(d));
      on('audioCfg', (d) => ref.current.onAudioCfg?.(d));
      on('shutdown', (d) => ref.current.onShutdown?.(d));
      on('speaker', (d) => {
        if (IS_STAGE) voice.setSpeaker(d.id === STAGE_ID);
        ref.current.onSpeaker?.(d);
      });
      source.onerror = () => {
        source?.close();
        if (!closed) retry = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      source?.close();
    };
  }, []);
}

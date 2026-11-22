export interface LiveStatus {
  isConnected: boolean;
  isConnecting: boolean;
  username: string;
  roomId: string;
  viewerCount: number;
  totalLikes: number;
  error?: string;
}

export interface ChatEvent {
  username: string;
  nickname: string;
  comment: string;
  avatar: string;
  timestamp: number;
  createTime?: number;
}

export interface GiftEvent {
  username: string;
  nickname: string;
  giftName: string;
  giftId: number;
  diamondCount: number;
  repeatCount: number;
  avatar: string;
  timestamp: number;
}

export interface UserEvent {
  username: string;
  nickname: string;
  avatar: string;
  timestamp: number;
}

export interface LikeEvent {
  username: string;
  nickname: string;
  likeCount: number;
  totalLikes: number;
}

export interface AudioConfig {
  masterEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
}

export interface CaiDat {
  tieuDe: string;
  tenMc: string;
  channelName: string;
  thoiGianVong?: [number, number, number, number];
  thoiGianMoDapAn?: number;
}

export interface ControlCommand {
  action: 'speak' | 'setRate' | 'reset' | 'setName' | 'setVoice' | 'custom';
  text?: string;
}

export interface LiveHandlers {
  onStatus?: (s: LiveStatus) => void;
  onChat?: (e: ChatEvent) => void;
  onGift?: (e: GiftEvent) => void;
  onMember?: (e: UserEvent) => void;
  onFollow?: (e: UserEvent) => void;
  onShare?: (e: UserEvent) => void;
  onLike?: (e: LikeEvent) => void;
  onViewers?: (count: number) => void;
  onControl?: (c: ControlCommand) => void;
  onGameState?: (s: any) => void;
  onCaiDat?: (c: CaiDat) => void;
  onAudioCfg?: (a: AudioConfig) => void;
  onSpeaker?: (info: { id: string | null; count: number }) => void;
  onShutdown?: (info: { port: number }) => void;
}

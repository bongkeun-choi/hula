export type Suit = 'SPADE' | 'HEART' | 'DIAMOND' | 'CLUB' | 'JOKER';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 (A) ~ 13 (K), Joker is 0
  name: string; // 'A', '2'~'10', 'J', 'Q', 'K', 'JK'
  display: string; // '♠7', '♥A' 등
  score: number; // 계산용 점수 (A:1, 2~9:숫자, 10,J,Q,K:10)
}

export type MeldType = 'SEVEN' | 'SAME_RANK' | 'SEQUENCE';

export interface Meld {
  id: string;
  type: MeldType;
  ownerId: string;
  cards: Card[];
}

export interface Player {
  id: string;
  nickname: string;
  chips: number;
  cards: Card[];
  hasRegistered: boolean; // 이번 판에서 한 번이라도 패를 등록했는지 (훌라 판정용)
  isTurn: boolean;
  isReady: boolean;
  hasDrawn: boolean; // 이번 턴에서 덱 또는 버린 패를 가져왔는지
}

export interface GameState {
  roomId: string;
  status: 'WAITING' | 'PLAYING' | 'ENDED';
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  registeredMelds: Meld[];
  currentTurnIndex: number;
  turnTimer: number; // 초 단위 타이머 (기본 15초)
  winner: {
    player: Player;
    type: 'HOOLA' | 'NORMAL' | 'STOP' | 'DDAENG';
    score: number;
    chipsWon: number;
  } | null;
  history: string[]; // 게임 로그
}

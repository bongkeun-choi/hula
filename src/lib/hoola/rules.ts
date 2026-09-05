import { Card, Suit, Meld, MeldType } from './types';

// 트럼프 카드 52장 (옵션으로 조커 2장) 생성
export function createDeck(includeJokers: boolean = false): Card[] {
  const suits: { suit: Suit; symbol: string }[] = [
    { suit: 'SPADE', symbol: '♠' },
    { suit: 'HEART', symbol: '♥' },
    { suit: 'DIAMOND', symbol: '♦' },
    { suit: 'CLUB', symbol: '♣' },
  ];

  const cards: Card[] = [];

  suits.forEach(({ suit, symbol }) => {
    for (let rank = 1; rank <= 13; rank++) {
      let name = rank.toString();
      if (rank === 1) name = 'A';
      else if (rank === 11) name = 'J';
      else if (rank === 12) name = 'Q';
      else if (rank === 13) name = 'K';

      // 훌라 점수 규칙: A=1, 2~9=숫자, 10,J,Q,K=10
      const score = rank === 1 ? 1 : rank > 10 ? 10 : rank;

      cards.push({
        id: `${suit[0]}${rank}`,
        suit,
        rank,
        name,
        display: `${symbol}${name}`,
        score,
      });
    }
  });

  if (includeJokers) {
    cards.push({
      id: 'JK1',
      suit: 'JOKER',
      rank: 0,
      name: 'JK',
      display: '🃏JOKER',
      score: 0,
    });
    cards.push({
      id: 'JK2',
      suit: 'JOKER',
      rank: 0,
      name: 'JK',
      display: '🃏JOKER',
      score: 0,
    });
  }

  return shuffleDeck(cards);
}

// Fisher-Yates 알고리즘으로 덱 셔플
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 1) 7 단독 등록 검사
export function isValidSeven(cards: Card[]): boolean {
  return cards.length === 1 && cards[0].rank === 7;
}

// 2) 동일 숫자 3장 이상 (트리플 / 포카드) 검사
export function isValidSameRank(cards: Card[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  const targetRank = cards[0].rank;
  if (targetRank === 0) return false; // 조커 단독 세트 제외

  // 모든 카드의 랭크가 동일해야 함
  if (!cards.every((c) => c.rank === targetRank)) return false;

  // 무늬는 모두 서로 달라야 함
  const suits = new Set(cards.map((c) => c.suit));
  return suits.size === cards.length;
}

// 3) 동일 무늬 연속 숫자 3장 이상 (스트레이트) 검사
export function isValidSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  const firstSuit = cards[0].suit;
  if (firstSuit === 'JOKER') return false;

  // 모든 카드의 무늬가 같아야 함
  if (!cards.every((c) => c.suit === firstSuit)) return false;

  // 랭크 기준 오름차순 정렬
  const sorted = [...cards].sort((a, b) => a.rank - b.rank);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].rank !== sorted[i].rank + 1) {
      return false;
    }
  }

  return true;
}

// 주어진 카드 목록이 유효한 등록(Meld)인지 판별
export function validateMeld(cards: Card[]): { valid: boolean; type: MeldType | null } {
  if (isValidSeven(cards)) {
    return { valid: true, type: 'SEVEN' };
  }
  if (isValidSameRank(cards)) {
    return { valid: true, type: 'SAME_RANK' };
  }
  if (isValidSequence(cards)) {
    return { valid: true, type: 'SEQUENCE' };
  }
  return { valid: false, type: null };
}

// 4) 붙이기(Lay-off) 가능 여부 검사
// 기존 등록된 패(existingMeld)에 한 장의 카드(cardToAttach)를 붙일 수 있는지 검사
export function canAttachCard(
  existingMeld: Meld,
  cardToAttach: Card
): { canAttach: boolean; newCards: Card[] | null } {
  // 1. 기존 패가 7 단독인 경우 -> 같은 무늬의 6 또는 8을 붙여 스트레이트 확장 가능
  if (existingMeld.type === 'SEVEN' || (existingMeld.cards.length === 1 && existingMeld.cards[0].rank === 7)) {
    const baseCard = existingMeld.cards[0];
    if (cardToAttach.suit === baseCard.suit && (cardToAttach.rank === 6 || cardToAttach.rank === 8)) {
      const newCards = [baseCard, cardToAttach].sort((a, b) => a.rank - b.rank);
      return { canAttach: true, newCards };
    }
    return { canAttach: false, newCards: null };
  }

  // 2. 기존 패가 동일 숫자(트리플)인 경우 -> 동일 숫자의 다른 무늬 4번째 카드 붙이기 가능
  if (existingMeld.type === 'SAME_RANK') {
    if (existingMeld.cards.length >= 4) return { canAttach: false, newCards: null };
    const baseRank = existingMeld.cards[0].rank;
    if (cardToAttach.rank === baseRank) {
      // 이미 같은 무늬가 있는지 확인
      const hasSuit = existingMeld.cards.some((c) => c.suit === cardToAttach.suit);
      if (!hasSuit) {
        return { canAttach: true, newCards: [...existingMeld.cards, cardToAttach] };
      }
    }
    return { canAttach: false, newCards: null };
  }

  // 3. 기존 패가 스트레이트(연속 패)인 경우
  if (existingMeld.type === 'SEQUENCE' || existingMeld.cards.length >= 2) {
    const sorted = [...existingMeld.cards].sort((a, b) => a.rank - b.rank);
    const suit = sorted[0].suit;

    if (cardToAttach.suit === suit) {
      const minRank = sorted[0].rank;
      const maxRank = sorted[sorted.length - 1].rank;

      // 앞쪽에 붙이기 (예: 4,5,6에 3 붙이기)
      if (cardToAttach.rank === minRank - 1 && cardToAttach.rank >= 1) {
        return { canAttach: true, newCards: [cardToAttach, ...sorted] };
      }
      // 뒤쪽에 붙이기 (예: 4,5,6에 7 붙이기)
      if (cardToAttach.rank === maxRank + 1 && cardToAttach.rank <= 13) {
        return { canAttach: true, newCards: [...sorted, cardToAttach] };
      }
    }
  }

  return { canAttach: false, newCards: null };
}

// 손패 총점 계산
export function calculateHandScore(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + c.score, 0);
}

// 카드 정렬 유틸리티
export function sortCards(cards: Card[], by: 'RANK' | 'SUIT'): Card[] {
  const suitOrder: Record<Suit, number> = {
    SPADE: 1,
    DIAMOND: 2,
    HEART: 3,
    CLUB: 4,
    JOKER: 5,
  };

  return [...cards].sort((a, b) => {
    if (by === 'RANK') {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return suitOrder[a.suit] - suitOrder[b.suit];
    } else {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
      return a.rank - b.rank;
    }
  });
}

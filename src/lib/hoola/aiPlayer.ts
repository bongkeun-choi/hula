import { Card, Meld, Player } from './types';
import { canAttachCard, calculateHandScore, validateMeld } from './rules';

// AI 봇의 턴 의사결정 결과
export interface AIDecision {
  action: 'DRAW' | 'MELD' | 'ATTACH' | 'DISCARD' | 'STOP';
  drawFromDiscard?: boolean;
  cardsToMeld?: string[];
  attachTarget?: { meldId: string; cardId: string };
  cardToDiscard?: string;
  callStop?: boolean;
}

// AI 봇 두뇌: 손패에서 7 등록 가능한지 검사
export function findSevenToMeld(cards: Card[]): Card | null {
  return cards.find((c) => c.rank === 7) || null;
}

// AI 봇 두뇌: 동일 숫자 3~4장(트리플/포카드) 조합 찾기
export function findSameRankMelds(cards: Card[]): Card[][] {
  const groups: { [rank: number]: Card[] } = {};
  cards.forEach((c) => {
    if (!groups[c.rank]) groups[c.rank] = [];
    groups[c.rank].push(c);
  });

  const melds: Card[][] = [];
  Object.values(groups).forEach((group) => {
    if (group.length >= 3) {
      melds.push(group.slice(0, 3));
    }
  });
  return melds;
}

// AI 봇 두뇌: 스트레이트(연속된 무늬 3장 이상) 찾기
export function findSequenceMelds(cards: Card[]): Card[][] {
  const bySuit: { [suit: string]: Card[] } = {};
  cards.forEach((c) => {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit].push(c);
  });

  const melds: Card[][] = [];

  Object.values(bySuit).forEach((suitCards) => {
    if (suitCards.length < 3) return;
    const sorted = [...suitCards].sort((a, b) => a.rank - b.rank);

    let streak: Card[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].rank === sorted[i - 1].rank + 1) {
        streak.push(sorted[i]);
        if (streak.length === 3) {
          melds.push([...streak]);
        }
      } else if (sorted[i].rank !== sorted[i - 1].rank) {
        streak = [sorted[i]];
      }
    }
  });

  return melds;
}

// AI 봇 두뇌: 기존 필드 등록 패에 붙일 수 있는 카드 찾기
export function findAttachableCard(
  botCards: Card[],
  registeredMelds: Meld[]
): { meldId: string; cardId: string } | null {
  for (const card of botCards) {
    for (const meld of registeredMelds) {
      const { canAttach } = canAttachCard(meld, card);
      if (canAttach) {
        return { meldId: meld.id, cardId: card.id };
      }
    }
  }
  return null;
}

// AI 봇 두뇌: 버릴 카드 선택 (가장 점수가 높고, 족보에 들어가지 않는 비효율 패)
export function pickCardToDiscard(cards: Card[], registeredMelds: Meld[]): Card {
  if (cards.length === 0) throw new Error('No cards to discard');

  // 1순위: 7 카드는 등록할 수 있으므로 버리지 않음
  // 2순위: 높은 숫자(K=13, Q=12, J=11, 10...)부터 우선 버림 (손패 점수 최소화)
  const sortedByScoreDesc = [...cards].sort((a, b) => {
    // 7은 버리는 우선순위 최하위
    if (a.rank === 7) return 1;
    if (b.rank === 7) return -1;
    return b.score - a.score;
  });

  return sortedByScoreDesc[0];
}

// AI 봇의 전체 플레이 판단
export function decideBotTurn(
  bot: Player,
  registeredMelds: Meld[],
  topDiscard: Card | null
): {
  shouldDrawFromDiscard: boolean;
  meldsToRegister: string[][];
  attaches: { meldId: string; cardId: string }[];
  cardToDiscard: string;
  shouldCallStop: boolean;
} {
  const currentHand = [...bot.cards];

  // 1. 드로우 판단: 버린 카드가 7이거나, 가져왔을 때 즉시 세트가 완성되면 버린 카드 가져오기
  let shouldDrawFromDiscard = false;
  if (topDiscard) {
    if (topDiscard.rank === 7) {
      shouldDrawFromDiscard = true;
    } else {
      // 버린 카드를 손에 넣었다고 가정해보고 세트가 생기는지 검사
      const testHand = [...currentHand, topDiscard];
      const sameRank = findSameRankMelds(testHand);
      const seq = findSequenceMelds(testHand);
      if (sameRank.length > 0 || seq.length > 0) {
        shouldDrawFromDiscard = true;
      }
    }
  }

  // 2. 등록(Meld) 패 찾기
  const meldsToRegister: string[][] = [];

  // 7 단독 등록
  const seven = findSevenToMeld(currentHand);
  if (seven) {
    meldsToRegister.push([seven.id]);
  }

  // 트리플 등록
  const sameRanks = findSameRankMelds(currentHand);
  sameRanks.forEach((group) => {
    meldsToRegister.push(group.map((c) => c.id));
  });

  // 스트레이트 등록
  const seqs = findSequenceMelds(currentHand);
  seqs.forEach((group) => {
    meldsToRegister.push(group.map((c) => c.id));
  });

  // 3. 붙이기 찾기
  const attaches: { meldId: string; cardId: string }[] = [];
  let attachTarget = findAttachableCard(currentHand, registeredMelds);
  if (attachTarget) {
    attaches.push(attachTarget);
  }

  // 4. 버릴 카드 선택
  const cardToDiscard = pickCardToDiscard(currentHand, registeredMelds).id;

  // 5. 스톱 판단 (남은 점수가 12점 이하일 때 똑똑하게 스톱 선언)
  const remainingScore = calculateHandScore(currentHand);
  const shouldCallStop = remainingScore <= 12;

  return {
    shouldDrawFromDiscard,
    meldsToRegister,
    attaches,
    cardToDiscard,
    shouldCallStop,
  };
}

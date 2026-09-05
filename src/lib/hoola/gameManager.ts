import { GameState, Player, Card, Meld } from './types';
import { createDeck, validateMeld, canAttachCard, calculateHandScore, sortCards } from './rules';

export class GameManager {
  private static instance: GameManager;
  private rooms: Map<string, GameState> = new Map();

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  // 방 생성 또는 가져오기
  public getOrCreateRoom(roomId: string): GameState {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        status: 'WAITING',
        players: [],
        deck: [],
        discardPile: [],
        registeredMelds: [],
        currentTurnIndex: 0,
        turnTimer: 15,
        winner: null,
        history: ['방이 생성되었습니다.'],
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  public getRoom(roomId: string): GameState | undefined {
    return this.rooms.get(roomId);
  }

  // 플레이어 입장
  public joinRoom(roomId: string, user: { id: string; nickname: string; chips?: number }): GameState {
    const room = this.getOrCreateRoom(roomId);
    const existingIndex = room.players.findIndex((p) => p.id === user.id);

    if (existingIndex === -1) {
      if (room.players.length >= 4) {
        throw new Error('방이 꽉 찼습니다. (최대 4인)');
      }
      room.players.push({
        id: user.id,
        nickname: user.nickname,
        chips: user.chips ?? 10000,
        cards: [],
        hasRegistered: false,
        isTurn: false,
        isReady: false,
        hasDrawn: false,
      });
      room.history.push(`${user.nickname}님이 입장했습니다.`);
    }

    return room;
  }

  // 플레이어 퇴장
  public leaveRoom(roomId: string, userId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.id === userId);
    if (player) {
      room.players = room.players.filter((p) => p.id !== userId);
      room.history.push(`${player.nickname}님이 퇴장했습니다.`);

      // 인원이 부족하고 게임 중이면 게임 종료
      if (room.status === 'PLAYING' && room.players.length < 2) {
        room.status = 'WAITING';
        room.history.push('인원 부족으로 게임이 중단되었습니다.');
      }
    }

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    return room;
  }

  // 레디 토글 및 자동 시작 검사
  public toggleReady(roomId: string, userId: string): GameState {
    const room = this.getOrCreateRoom(roomId);
    const player = room.players.find((p) => p.id === userId);
    if (!player) throw new Error('플레이어를 찾을 수 없습니다.');

    player.isReady = !player.isReady;

    // 2인 이상 전원 레디 시 자동 시작
    if (room.players.length >= 2 && room.players.every((p) => p.isReady)) {
      this.startGame(roomId);
    }

    return room;
  }

  // 게임 시작 (카드 7장씩 분배 및 덱 세팅)
  public startGame(roomId: string): GameState {
    const room = this.getOrCreateRoom(roomId);
    if (room.players.length < 2) {
      throw new Error('최소 2명 이상이어야 게임을 시작할 수 있습니다.');
    }

    const deck = createDeck(false); // 52장 기본
    room.status = 'PLAYING';
    room.registeredMelds = [];
    room.winner = null;
    room.currentTurnIndex = 0;

    // 각 플레이어에게 7장씩 분배
    room.players.forEach((player, index) => {
      player.cards = sortCards(deck.splice(0, 7), 'RANK');
      player.hasRegistered = false;
      player.hasDrawn = false;
      player.isTurn = index === 0;
      player.isReady = false;
    });

    // 버린 패에 1장 오픈
    room.discardPile = [deck.pop()!];
    room.deck = deck;
    room.history.push('게임을 시작합니다! 각 플레이어에게 7장씩 분배되었습니다.');

    return room;
  }

  // 카드 뽑기 (덱 또는 버린 패 더미)
  public drawCard(roomId: string, userId: string, fromDiscard: boolean = false): GameState {
    const room = this.getOrCreateRoom(roomId);
    const currentPlayer = room.players[room.currentTurnIndex];

    if (!currentPlayer || currentPlayer.id !== userId) {
      throw new Error('지금은 당신의 턴이 아닙니다.');
    }
    if (currentPlayer.hasDrawn) {
      throw new Error('이미 카드를 뽑았습니다. 패를 등록하거나 카드를 버리세요.');
    }

    let drawnCard: Card | undefined;
    if (fromDiscard) {
      if (room.discardPile.length === 0) throw new Error('가져올 버린 카드가 없습니다.');
      drawnCard = room.discardPile.pop();
      room.history.push(`${currentPlayer.nickname}님이 버려진 카드 [${drawnCard?.display}]를 가져왔습니다.`);
    } else {
      if (room.deck.length === 0) {
        // 덱이 바닥나면 버려진 카드들을 다시 셔플하여 덱으로
        if (room.discardPile.length <= 1) throw new Error('뽑을 카드가 더 이상 없습니다.');
        const topDiscard = room.discardPile.pop()!;
        room.deck = createDeck(false); // 재구성
        room.discardPile = [topDiscard];
      }
      drawnCard = room.deck.pop();
      room.history.push(`${currentPlayer.nickname}님이 덱에서 카드를 1장 뽑았습니다.`);
    }

    if (drawnCard) {
      currentPlayer.cards.push(drawnCard);
      currentPlayer.cards = sortCards(currentPlayer.cards, 'RANK');
      currentPlayer.hasDrawn = true;
    }

    return room;
  }

  // 패 등록하기 (7 단독, 동일 숫자 세트, 스트레이트)
  public registerMeld(roomId: string, userId: string, cardIds: string[]): GameState {
    const room = this.getOrCreateRoom(roomId);
    const player = room.players.find((p) => p.id === userId);

    if (!player || !player.isTurn) {
      throw new Error('당신의 턴에만 패를 등록할 수 있습니다.');
    }
    if (!player.hasDrawn) {
      throw new Error('먼저 카드를 1장 뽑아야 합니다.');
    }

    const cardsToMeld = player.cards.filter((c) => cardIds.includes(c.id));
    if (cardsToMeld.length !== cardIds.length) {
      throw new Error('손에 없는 카드가 포함되어 있습니다.');
    }

    const { valid, type } = validateMeld(cardsToMeld);
    if (!valid || !type) {
      throw new Error('유효한 훌라 등록 족보가 아닙니다. (7 단독, 같은숫자 3장, 또는 같은무늬 연속3장)');
    }

    // 손패에서 제거 및 필드 등록
    player.cards = player.cards.filter((c) => !cardIds.includes(c.id));
    player.hasRegistered = true;

    const meld: Meld = {
      id: `meld_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      ownerId: userId,
      cards: cardsToMeld,
    };
    room.registeredMelds.push(meld);

    room.history.push(
      `${player.nickname}님이 [${cardsToMeld.map((c) => c.display).join(' ')}] 등록을 완료했습니다!`
    );

    // 등록으로 손패가 0장이 된 경우 즉시 승리 판정
    if (player.cards.length === 0) {
      this.handleGameEnd(room, player, 'NORMAL');
    }

    return room;
  }

  // 카드 붙이기 (Lay-off)
  public attachCard(roomId: string, userId: string, meldId: string, cardId: string): GameState {
    const room = this.getOrCreateRoom(roomId);
    const player = room.players.find((p) => p.id === userId);

    if (!player || !player.isTurn) {
      throw new Error('당신의 턴에만 카드를 붙일 수 있습니다.');
    }
    if (!player.hasDrawn) {
      throw new Error('먼저 카드를 1장 뽑아야 합니다.');
    }

    const targetMeld = room.registeredMelds.find((m) => m.id === meldId);
    if (!targetMeld) throw new Error('대상 등록 패를 찾을 수 없습니다.');

    const card = player.cards.find((c) => c.id === cardId);
    if (!card) throw new Error('손에 해당 카드가 없습니다.');

    const { canAttach, newCards } = canAttachCard(targetMeld, card);
    if (!canAttach || !newCards) {
      throw new Error('이 패에는 해당 카드를 붙일 수 없습니다.');
    }

    // 붙이기 성공
    targetMeld.cards = newCards;
    player.cards = player.cards.filter((c) => c.id !== cardId);
    player.hasRegistered = true;

    room.history.push(`${player.nickname}님이 등록 패에 [${card.display}]를 이어붙였습니다!`);

    if (player.cards.length === 0) {
      this.handleGameEnd(room, player, 'NORMAL');
    }

    return room;
  }

  // 카드 버리기 (1장 버리고 턴 종료)
  public discardCard(roomId: string, userId: string, cardId: string): GameState {
    const room = this.getOrCreateRoom(roomId);
    const player = room.players.find((p) => p.id === userId);

    if (!player || !player.isTurn) {
      throw new Error('당신의 턴이 아닙니다.');
    }
    if (!player.hasDrawn) {
      throw new Error('먼저 카드를 뽑으셔야 합니다.');
    }

    const cardIndex = player.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('버릴 카드를 찾을 수 없습니다.');

    const [discarded] = player.cards.splice(cardIndex, 1);
    room.discardPile.push(discarded);
    room.history.push(`${player.nickname}님이 [${discarded.display}] 카드를 버렸습니다.`);

    // 카드를 버리고 손패가 0장이 된 경우 승리!
    if (player.cards.length === 0) {
      const isHoola = !player.hasRegistered; // 한 번도 등록 안하고 한 번에 다 털었으면 훌라!
      this.handleGameEnd(room, player, isHoola ? 'HOOLA' : 'NORMAL');
      return room;
    }

    // 다음 플레이어로 턴 넘기기
    player.isTurn = false;
    player.hasDrawn = false;
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    room.players[room.currentTurnIndex].isTurn = true;
    room.players[room.currentTurnIndex].hasDrawn = false;

    return room;
  }

  // 스톱(Stop) 선언
  public callStop(roomId: string, userId: string): GameState {
    const room = this.getOrCreateRoom(roomId);
    const player = room.players.find((p) => p.id === userId);

    if (!player || !player.isTurn) throw new Error('당신의 턴에만 스톱을 선언할 수 있습니다.');
    if (!player.hasDrawn) throw new Error('카드를 뽑은 후 스톱할 수 있습니다.');

    const callerScore = calculateHandScore(player.cards);
    let minScore = callerScore;
    let actualWinner = player;
    let isBak = false; // 바가지(독박) 여부

    // 다른 플레이어들의 점수와 비교
    for (const other of room.players) {
      if (other.id === player.id) continue;
      const otherScore = calculateHandScore(other.cards);
      if (otherScore <= minScore) {
        minScore = otherScore;
        actualWinner = other;
        isBak = true;
      }
    }

    if (isBak) {
      room.history.push(
        `🚨 ${player.nickname}님의 스톱 실패 (바가지 독박)! ${actualWinner.nickname}님이 더 낮은 점수로 승리했습니다.`
      );
      this.handleGameEnd(room, actualWinner, 'STOP', true, player);
    } else {
      room.history.push(`🎉 ${player.nickname}님이 ${callerScore}점으로 스톱에 성공하여 승리했습니다!`);
      this.handleGameEnd(room, player, 'STOP', false);
    }

    return room;
  }

  // 게임 종료 처리 및 칩 정산
  private handleGameEnd(
    room: GameState,
    winner: Player,
    winType: 'HOOLA' | 'NORMAL' | 'STOP' | 'DDAENG',
    isBak: boolean = false,
    bakPlayer?: Player
  ) {
    room.status = 'ENDED';

    // 칩 계산: 기본 판돈 1000칩, 훌라는 2배(2000칩씩)
    const baseBet = 1000;
    const multiplier = winType === 'HOOLA' ? 2 : 1;
    let totalWon = 0;

    if (isBak && bakPlayer) {
      // 바가지: 스톱 실패한 플레이어가 모든 패자 몫을 독박 지불
      const penalty = baseBet * (room.players.length - 1) * multiplier;
      bakPlayer.chips = Math.max(0, bakPlayer.chips - penalty);
      winner.chips += penalty;
      totalWon = penalty;
    } else {
      // 일반 승리: 패자들이 승자에게 지불
      room.players.forEach((p) => {
        if (p.id !== winner.id) {
          const pay = Math.min(p.chips, baseBet * multiplier);
          p.chips -= pay;
          totalWon += pay;
        }
      });
      winner.chips += totalWon;
    }

    room.winner = {
      player: winner,
      type: winType,
      score: calculateHandScore(winner.cards),
      chipsWon: totalWon,
    };

    room.history.push(
      `🏆 [게임 종료] ${winner.nickname}님 승리! (${winType === 'HOOLA' ? '🌟훌라 완승!' : winType}) +${totalWon}칩 획득`
    );
  }
}

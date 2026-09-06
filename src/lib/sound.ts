// Web Audio API 기반 모바일 완벽 호환 고품질 게임 효과음 엔진

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 사용자가 화면 어디든 첫 터치/클릭 시 오디오 잠금을 완전히 해제
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('touchend', unlockHandler);
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };

      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('touchend', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  // 모바일 브라우저(iOS Safari / Chrome) 오디오 강제 언락
  public unlockAudio() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // iOS Safari를 위한 무음 1프레임 버퍼 재생 (확실한 하드웨어 스피커 언락)
      if (!this.isUnlocked && this.ctx) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  }

  private getContext(): AudioContext | null {
    this.unlockAudio();
    return this.ctx;
  }

  // 1. 카드 선택 / 탭 소리 (경쾌하고 찰진 딱! 소리)
  public playCardSelect() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 2. 카드 뽑기 / 딜링 소리 (카드 스치는 샤악~ 소리)
  public playCardDraw() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  // 3. 카드 버리기 소리 (테이블에 딱! 내려놓는 묵직한 타격음)
  public playCardDiscard() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 4. 패 등록 (7등록, 트리플, 스트레이트) 성공 소리 (신나는 골드 챠임)
  public playMeld() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  // 5. 카드 붙이기 소리 (찰칵! 달라붙는 소리)
  public playAttach() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 6. 내 턴 알림음 (띵~동 부드러운 챠임)
  public playMyTurn() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chord = [880, 1174.66]; // A5, D6
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + i * 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // 7. 스톱 선언 효과음 (긴장감 넘치는 비프/사이렌)
  public playStopAlert() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.12);
    osc.frequency.linearRampToValueAtTime(700, now + 0.25);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 8. 일반 승리 팡파레 & 칩 소리
  public playWin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    fanfare.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.11;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.7, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });

    setTimeout(() => this.playChips(), 550);
  }

  // 9. 대역전 🌟 훌라(완승) 팡파레! (더 화려하고 웅장한 승리 멜로디)
  public playHoolaWin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, d: 0.14 },
      { f: 659.25, d: 0.14 },
      { f: 783.99, d: 0.14 },
      { f: 1046.5, d: 0.2 },
      { f: 987.77, d: 0.12 },
      { f: 1046.5, d: 0.5 },
    ];

    let t = ctx.currentTime;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.85;
    });

    setTimeout(() => this.playChips(), 600);
    setTimeout(() => this.playChips(), 900);
  }

  // 10. 바가지 독박 / 패배 효과음 (띠로리~)
  public playLose() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.16;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.45, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // 11. 칩 짤랑거리는 소리
  public playChips() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1900 + Math.random() * 900, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      }, i * 45);
    }
  }

  // 사운드 On/Off 토글 (켜질 때 테스트 소리 딩~ 울림)
  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playCardSelect();
    }
    return this.enabled;
  }
}

export const sound = new SoundManager();

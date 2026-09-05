# 🎴 실시간 음성 채팅 모바일 훌라 (Voice Hoola)

한국 전통 카드 게임인 **훌라(Hoola)**를 여러 사람이 스마트폰 모바일 환경에서 **실시간 음성 채팅(Voice Chat)**을 하면서 즐길 수 있는 온라인 멀티플레이어 웹 게임입니다.

---

## ✨ 핵심 기능

1. **한국 정통 훌라 룰 완벽 구현**
   - **7 단독 등록**: 훌라의 시그니처 룰인 '7' 카드 단독 등록 지원
   - **세트 등록 (Melds)**: 같은 숫자 3장 이상(트리플/포카드) 또는 같은 무늬 연속 3장 이상(스트레이트)
   - **붙이기 (Lay-off)**: 이미 필드에 등록된 패에 내 패를 이어붙여 손패 털기
   - **승리 & 정산**: 
     - 🌟 **훌라 (완승)**: 단 한 번도 패를 내지 않고 한 번에 다 털어 2배 대역전승!
     - ✋ **스톱 (Stop)**: 손패 점수가 가장 낮을 때 선언 (단, 더 낮은 상대가 있으면 바가지 독박!)

2. **모바일 최적화 대형 카드 UI/UX**
   - 스마트폰 화면에서도 숫자와 무늬가 선명하게 보이는 대형 카드 디자인
   - 카드 터치 시 돌출 애니메이션 및 다중 선택 지원
   - [숫자순 정렬] / [무늬순 정렬] 원터치 토글
   - 등록 가능한 패 및 붙이기 가능한 필드 세트 자동 하이라이트

3. **실시간 WebRTC P2P 음성 통화**
   - PeerJS 기반으로 별도 유료 미디어 서버 없이 0원 P2P 음성 채팅
   - Web Audio API로 마이크 음성을 감지하여 **말하고 있는 플레이어 프로필에 초록색 파동 링** 표시
   - 원터치 마이크 음소거 (Mute / Unmute)

4. **회원가입, 로그인 & Turso DB 연동**
   - 이메일/비밀번호 정식 가입 & 로그인 (JWT 보안 토큰)
   - 닉네임만 넣고 1초 만에 입장 가능한 **게스트 빠른 시작 (10,000칩 지급)**
   - **Turso (libSQL)** 분산 클라우드 DB 완벽 호환 (로컬 개발 시에는 파일 SQLite 자동 대체)

---

## 🚀 시작하기 (로컬 실행)

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`에 접속하여 플레이할 수 있습니다.  
(같은 Wi-Fi 공유기 내 모바일 폰에서는 `http://내컴퓨터IP:3000`으로 접속하여 실제 폰으로 테스트 가능합니다.)

---

## ☁️ Turso 데이터베이스 연동 방법

기본적으로 환경변수가 없으면 프로젝트 루트의 `local.db`에 데이터가 저장됩니다.  
클라우드 분산 DB인 **Turso**에 연결하려면:

1. [Turso](https://turso.tech/) 가입 및 무료 DB 생성
2. `.env` 파일 생성 후 다음 값 설정:
```env
TURSO_DATABASE_URL=libsql://[내-데이터베이스-이름].turso.io
TURSO_AUTH_TOKEN=[내-turso-인증-토큰]
JWT_SECRET=super-secure-hoola-secret-2026
PORT=3000
```

---

## 🌐 Git 연동 및 서버 배포 (GitHub & Railway/Render)

훌라는 상시 웹소켓(Socket.io) 연결이 필요하므로 **Railway** 또는 **Render**에 배포하는 것을 가장 추천합니다.

1. **GitHub 저장소에 푸시**:
   ```bash
   git add .
   git commit -m "Initial commit: Mobile Voice Hoola Game"
   git branch -M main
   git remote add origin [내-깃허브-저장소-URL]
   git push -u origin main
   ```

2. **Railway 또는 Render에서 배포**:
   - 새 프로젝트 생성 -> **GitHub Repository 연결**
   - Start Command: `npm start`
   - 환경 변수에 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET` 등록
   - 완료되면 제공되는 도메인(예: `https://my-hoola.up.railway.app`)으로 전 세계 어디서든 모바일로 접속 가능!

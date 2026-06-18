# Muse — Offline Music PWA

유튜브처럼 검색해서 음악을 듣고, 재생한 곡은 자동으로 오프라인 저장되는 모바일 웹앱입니다.

## 기능

- 🔍 **검색** — Piped API로 곡 검색 및 스트리밍
- 📴 **오프라인** — 재생한 곡 자동 캐시, 라이브러리에서 재생
- 📱 **PWA** — iPhone 홈 화면에 추가해서 앱처럼 사용
- 🎵 **미니 플레이어** — 하단 플레이어 + 전체 화면 재생 UI
- ⭐ **즐겨찾기** — 라이브러리에서 즐겨찾기 관리

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### iPhone에 추가하기

1. Safari에서 사이트 열기
2. 공유 버튼 → **홈 화면에 추가**
3. Muse 아이콘으로 앱처럼 실행

## 빌드 & 배포

```bash
npm run build
npm run preview
```

HTTPS로 배포해야 PWA·오프라인 기능이 정상 동작합니다.

## 주의사항

- 음원은 Piped(YouTube 프록시)를 통해 제공됩니다
- 개인 학습·개인 사용 목적으로만 사용하세요
- Piped 공개 서버는 불안정할 수 있습니다

# Muse — Offline Music PWA

유튜브처럼 검색해서 음악을 듣고, 재생한 곡은 자동으로 오프라인 저장되는 모바일 웹앱입니다.

## 기능

- **검색** — YouTube Data API로 곡 검색
- **재생** — Netlify Function으로 오디오 스트림
- **오프라인** — 재생한 곡 자동 캐시, 라이브러리에서 재생
- **PWA** — iPhone 홈 화면에 추가해서 앱처럼 사용

## YouTube API 키 발급 (필수)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. **APIs & Services → Library** → **YouTube Data API v3** 검색 → **Enable**
4. **APIs & Services → Credentials → Create Credentials → API key**
5. 생성된 키 복사

### Netlify에 키 등록

1. Netlify 대시보드 → 사이트 선택
2. **Site configuration → Environment variables**
3. **Add a variable**
   - Key: `YOUTUBE_API_KEY`
   - Value: (복사한 API 키)
4. **Save** 후 **Deploys → Trigger deploy → Deploy site** (재배포)

> API 키는 서버(Netlify Function)에서만 사용되므로 브라우저에 노출되지 않습니다.

## 로컬 개발

```bash
npm install
cp .env.example .env   # YOUTUBE_API_KEY 입력
npx netlify dev        # http://localhost:8888
```

`npm run dev`만 실행하면 검색 API가 동작하지 않습니다. 반드시 `netlify dev`를 사용하세요.

## 배포

GitHub에 push하면 Netlify가 자동 빌드합니다. `YOUTUBE_API_KEY` 환경 변수만 설정되어 있으면 됩니다.

## iPhone에 추가하기

1. Safari에서 배포 URL 열기
2. 공유 → **홈 화면에 추가**
3. Muse 아이콘으로 실행

## 주의사항

- YouTube Data API 무료 할당량: 하루 **10,000 units** (검색 1회 ≈ 2 units)
- 개인 사용 목적으로만 사용하세요

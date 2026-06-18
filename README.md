# Muse — Offline Music PWA

YouTube URL을 붙여넣고 **다운로드**하면 iPhone에 저장되고, **오프라인**에서도 재생됩니다.

## 사용 방법

1. Safari에서 Muse 열기 → **다운로드** 탭
2. YouTube URL 붙여넣기 → **다운로드** 버튼
3. 완료 후 **라이브러리**에서 재생
4. **홈 화면에 추가** 후 앱처럼 사용

## 기능

- **URL 다운로드** — YouTube 링크 → 기기에 저장
- **오프라인 재생** — IndexedDB 저장, 비행기 모드 OK
- **라이브러리** — 검색, 즐겨찾기, 삭제
- **파일 업로드** — PC에서 받은 MP3 직접 올리기 (선택)

## YouTube API 키 (선택)

썸네일·제목 자동 입력을 쓰려면 Netlify에 `YOUTUBE_API_KEY`를 설정하세요. 없어도 MP3 업로드·재생은 됩니다.

1. [Google Cloud Console](https://console.cloud.google.com/) → YouTube Data API v3 활성화
2. API 키 생성
3. Netlify → **Environment variables** → `YOUTUBE_API_KEY`
4. Application restrictions: **None** (Netlify 서버 호출용)

## 로컬 개발

```bash
npm install
cp .env.example .env   # YOUTUBE_API_KEY (선택)
npx netlify dev        # http://localhost:8888
```

메타데이터 API 테스트 시 `netlify dev` 사용. 프론트만 보려면 `npm run dev`.

## 배포

GitHub push → Netlify 자동 빌드. 사이트: https://myytmusic.netlify.app

## iPhone에 추가하기

1. Safari에서 사이트 열기
2. 공유 → **홈 화면에 추가**
3. Muse 아이콘으로 실행

## 왜 스트리밍은 안 되나요?

YouTube는 공식 API로 음원 URL을 주지 않고, 우회 방식은 봇 차단·CORS·서버 IP 차단으로 PWA에서 안정적으로 쓸 수 없습니다. 그래서 **직접 받은 파일을 올리는 방식**으로 바꿨습니다.

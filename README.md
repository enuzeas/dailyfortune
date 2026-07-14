# 오늘의 운세 (Daily Fortune)

버튼을 누르면 카드가 뒤집히며 랜덤 운세와 행운의 아이템을 보여주는 Next.js 앱입니다.

🔗 https://github.com/enuzeas/dailyfortune

## 기능

- **카드 뽑기**: 버튼(또는 카드 자체)을 클릭하면 카드가 180도 회전하며 150%로 확대되어 결과를 보여줍니다.
- **랜덤 운세**: 오늘의 운세 문구, 행운의 아이템·색깔·방향·숫자(1~99)를 매번 무작위로 뽑습니다.
- **홀로그램 효과**: 마우스 포인터를 따라 카드가 살짝 기울고, 대각선 무지개 빛깔의 홀로그램(별빛 + 성운 텍스처)이 카드 내부 표면에서만 반짝입니다. 테두리와 텍스트/타일 영역은 홀로그램의 영향을 받지 않도록 레이어를 분리했습니다.
- **트레이딩 카드 형태**: 실제 카드게임 카드 비율(`aspect-ratio` 0.718)과 곡률(`4.5% / 3.5%`)을 사용한 카드 프레임.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 (커스텀 디자인 토큰: 색상, radius 등을 `app/globals.css`의 `@theme`에 정의)
- 순수 CSS/React 상태만 사용 — 별도 애니메이션·상태관리 라이브러리 없음

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

기타 명령어:

```bash
npm run build   # 프로덕션 빌드
npm run start   # 빌드된 앱 실행
npm run lint    # ESLint 검사
```

## 프로젝트 구조

```
app/
├─ page.tsx                 # 메인 페이지 (헤더 + 카드)
├─ layout.tsx                # 루트 레이아웃, 폰트/메타데이터
├─ globals.css                # 디자인 토큰, 홀로그램/카드 CSS 이펙트
├─ components/
│  └─ FortuneCard.tsx         # 카드 플립·홀로그램·결과 표시 로직
└─ data/
   └─ fortune.ts              # 운세 문구, 행운 아이템/색깔/방향 데이터
```

# AutoVerdict Web

엔카(encar.com) 중고차 매물을 자동 분석해 사고이력·진단·점수를 한눈에 보여주는 **웹앱**.
Android 앱(`daksin-car-aos`)을 Next.js로 마이그레이션한 버전으로, UI와 12규칙 평가 엔진을 그대로 옮겼습니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| 평가 엔진 | 공유 코어 (`src/core`) — 파서 · 규칙 · 브리지 (Android 번들과 동일) |
| 저장소 | IndexedDB (저장 매물 + 24h 캐시) · localStorage (온보딩 플래그) |
| 데이터 수집 | `/api/encar` 서버리스 라우트 (엔카 프록시) + 샘플/붙여넣기 폴백 |
| 광고 | Google AdSense |
| 호스팅 | AWS Amplify Hosting (SSR + API Routes) |

## 아키텍처

```
사용자 URL 입력 / 샘플 / 붙여넣기
  → (URL) /api/encar 서버 라우트
        → fem.encar.com 상세 페이지에서 __PRELOADED_STATE__ 추출
        → api.encar.com record/diagnosis/inspection 호출 (서버 측, CORS 우회)
        → MobileOrchestratorInput JSON 반환
  → orchestrateMobile() → 파서 → 브리지(ChecklistFacts) → 규칙엔진 → RuleReport
  → OverlayPage 렌더 (ScoreCard / SummaryRow / CategoryAccordion)
  → 저장 → IndexedDB (saved_cars) · 24h 캐시 (cache)
```

### 왜 서버 라우트가 필요한가

브라우저는 CORS 때문에 `api.encar.com`을 직접 호출하거나 다른 출처의 `__PRELOADED_STATE__`를
읽을 수 없습니다. Android 앱은 숨은 WebView, Chrome 확장은 MAIN-world 주입으로 이를 우회했습니다.
웹에서는 **같은 도메인의 서버 라우트**(`app/api/encar/route.ts`)가 서버 측에서 엔카를 호출해
동일한 결과를 돌려줍니다. 엔카가 데이터센터 IP를 차단하거나 로그인 쿠키를 요구하면 일부
엔드포인트가 401/404가 될 수 있으며, 이때는 규칙 엔진이 해당 항목을 `미확인`으로 처리하고
**샘플 매물 / JSON 직접 입력** 폴백으로 기능을 확인할 수 있습니다.

## 화면

- **분석(Analyze)** — URL 입력·붙여넣기, 샘플 매물, 24h 최근 조회, 사용법 가이드, 고급 JSON 입력
- **결과(Result)** — 종합 점수·판정·카테고리별 규칙 결과, 저장
- **저장(Saved)** — 저장 매물 목록, 2대 선택 비교
- **비교(Compare)** — Hero 카드 + 섹션별 메트릭 2대 나란히 비교
- **설정(Settings)** · **개인정보 처리방침** · **온보딩** · **스플래시**

## 개발

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 프로덕션 빌드 (tsc + next build)
npm run typecheck    # 타입 체크만
npm test             # vitest (코어 평가 엔진 검증)
```

라이브 엔카 수집은 `next dev`/배포 환경의 서버 라우트로 동작합니다. 차단 시 분석 화면의
샘플 매물 또는 "고급: JSON 직접 입력"을 사용하세요.

## 배포 (AWS Amplify)

### 방법 A — AWS CLI (선언적, 권장)

인프라를 CloudFormation(`infra/amplify.cfn.yml`)으로 선언하고 `aws cloudformation deploy`로 생성·갱신합니다. Amplify 앱·브랜치·(선택)커스텀 도메인이 한 번에 만들어지고, Next.js SSR(WEB_COMPUTE)로 빌드됩니다.

사전 준비: AWS CLI v2 구성(`aws configure`), 코드를 Git 리포지토리에 push, GitHub 액세스 토큰(repo 스코프).

```bash
REPO_URL=https://github.com/<owner>/<repo> \
GITHUB_TOKEN=ghp_xxx \
REGION=ap-northeast-2 \
ADSENSE_CLIENT=ca-pub-xxx ADSENSE_SLOT=xxxx \
DOMAIN=autoverdict.com \
./scripts/deploy-amplify.sh
```

스크립트는 ① 스택 배포 → ② 앱 ID 조회 → ③ 빌드 잡 트리거까지 수행합니다. 이후 브랜치에 push하면 자동 재빌드됩니다. 직접 호출도 가능합니다:

```bash
aws cloudformation deploy \
  --stack-name autoverdict-web \
  --template-file infra/amplify.cfn.yml \
  --parameter-overrides RepositoryUrl=$REPO_URL GithubAccessToken=$GITHUB_TOKEN \
    BranchName=main AdsenseClient=$ADSENSE_CLIENT AdsenseSlot=$ADSENSE_SLOT DomainName=$DOMAIN
```

### 방법 B — Amplify 콘솔

1. 리포지토리를 Amplify Hosting에 연결 (Next.js SSR 자동 감지, 루트 `amplify.yml` 빌드 스펙 사용).
2. 환경 변수: `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT` (선택, 광고용).
3. 커스텀 도메인은 콘솔 → Domain management (ACM 인증서 자동 발급).

> Next.js SSR(`/api/encar` 서버 라우트) 때문에 Platform은 **WEB_COMPUTE**여야 합니다 — CloudFormation 템플릿에 이미 지정돼 있습니다.
> 광고를 붙이면 상업적 사용입니다. AWS는 상업적 사용 제한이 없습니다.

## 디렉터리

```
app/
  layout.tsx              # 루트 레이아웃 + AdSense 스크립트
  page.tsx                # SPA 라우팅 상태머신 (스플래시→온보딩→탭)
  api/encar/route.ts      # 엔카 수집 프록시 (서버리스)
src/
  core/                   # 공유 평가 코어 (파서·규칙·브리지·타입)
  overlay/                # 결과 렌더 컴포넌트 (Android 번들과 동일)
  screens/                # 7개 화면 React 포팅
  storage/                # IndexedDB 저장소 (Room DAO 포팅)
  collect/                # 수집 클라이언트 · 평가 어댑터 · 샘플 데이터
  components/             # BottomNav · AdBanner · TopBar · Splash · icons
  ui/                     # 내비게이션 타입 · 결과/판정 헬퍼
  encar/url.ts            # 엔카 URL 유틸
```

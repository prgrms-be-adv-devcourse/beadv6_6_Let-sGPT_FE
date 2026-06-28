# openAt 디자인 시스템 — 에디토리얼 미니멀 화이트

> **이 문서의 위치**
> openAt(플랫폼)의 프론트엔드 **디자인 지침**이다. 모든 화면·컴포넌트는 이 결을 따른다.
> 토큰의 단일 출처는 [`src/app/styles/globals.css`](../src/app/styles/globals.css) — 여기만 바꾸면 전역에 전파된다.
> **와이어프레임(`screens/`)은 "무엇을 담을지"의 참고일 뿐,** 배치·형식은 이 시스템에 맞춰 자유롭게 재구성한다.
> 변경·추가 시 해당 유형의 **최신 트렌드를 리서치한 뒤 이 결에 맞춰** 적용한다(절차는 `AGENTS.md` §3).

## 0. 원칙 (Quiet Luxury / Editorial Minimal)

1. **여백이 위계를 만든다.** 제품(이미지·이름·가격)이 주인공, UI는 뒤로 빠진다.
2. **모노크롬 규율.** 색은 잉크 블랙~그레이로만 위계를 준다. 채도 있는 색은 **신호(`--live`)** 에만 극소량.
3. **큰 디스플레이 + 절제된 본문.** 헤드라인은 크고 조용하게, 본문/메타는 작고 차분하게.
4. **일관된 비율·하네스.** 카드/이미지 비율 고정(4:5), 헤어라인(1px)으로 구분 — 무거운 보더·섀도우 대신 여백·정렬로 그룹핑.
5. **핵심 정보 즉시 노출.** 가격·재고·상태를 한눈에. 정보 과밀 금지.

> 근거(2026 트렌드): 여백 주도 미니멀 · 콰이엇 럭셔리 모노크롬 · 큰 헤드라인+클린 본문 · 일관 비율 카드. 출처는 문서 하단.

## 1. 컬러 토큰 (oklch · 라이트 기본)

`:root` 에 정의, `@theme inline` 으로 Tailwind 유틸(`bg-*`/`text-*`)에 매핑. **컴포넌트는 시맨틱 토큰만 사용 — 하드코드 색(`#fff`, `bg-blue-500`) 금지.**

| 토큰 | 용도 / 규칙 |
|---|---|
| `background` | 페이지 바탕(화이트) |
| `surface` | 한 단계 들어간 면 — 이미지 플레이스홀더·섹션 배경(오프화이트) |
| `foreground` | 본문 잉크(웜 니어블랙) |
| `primary` / `primary-foreground` | **주 CTA·강조(거의 블랙)**. 한 화면의 "단 하나의 검은 버튼" |
| `secondary` · `muted` · `accent` | 보조 면(라이트 웜 그레이). 세 토큰은 현재 동일 계열 |
| `muted-foreground` | 보조 텍스트·메타·라벨 |
| `border` / `input` | 헤어라인 보더·인풋 경계 |
| `ring` | 포커스 링(잉크) |
| `destructive` | 파괴적 액션(삭제 등) 경고 |
| **`live`** | **버밀리언. "진행중(LIVE)"·"마감 임박"에만.** 그 외 사용 금지 |

- **다크 모드**: `.dark` 에 동일 구조로 정의되어 있음(현재 기본은 라이트). 토큰만 스왑되므로 컴포넌트 수정 불필요.
- 새 색이 필요하면 임의 추가 대신 **토큰을 먼저 늘린다**(globals.css).

## 2. 타이포그래피

| 역할 | 폰트 | 사용 |
|---|---|---|
| 디스플레이 | **Instrument Serif** (`font-serif`) | 브랜드 워드마크, 큰 라틴 헤드라인, 이미지 이니셜 액센트 |
| 본문·UI·**한글** | **Pretendard** (`font-sans`) | 거의 모든 텍스트, 한글 헤드라인 포함 |
| 금액 합계 | **Newsreader** (`font-numeric`) | 지갑 잔액·정산 합계 등 큰 금액 — 세리프보다 차분한 숫자 표기 |

- **한글은 세리프 폴백이 없다.** Instrument Serif는 라틴 전용이라 한글 헤드라인은 Pretendard로 렌더된다 → 이는 의도된 선택(모던 한국 커머스 관행). 세리프는 **라틴/브랜드/이니셜 액센트에 한정**, 한글 본문에 세리프를 강제하지 않는다.
- **숫자(가격·수량·카운트다운)는 `tabular-nums`** — 자리 흔들림 방지. 큰 금액 합계(지갑·정산)는 `font-numeric tabular-nums` 로 한 톤 차분하게.
- 스케일(가이드): 히어로 `text-5xl~6xl`(serif) · 섹션 제목 `text-3xl~4xl` · eyebrow `text-xs uppercase tracking-[0.25em] text-muted-foreground` · 본문 `text-sm~base`.
- 웨이트: Pretendard 400/500/600, Instrument Serif 400. **굵기 남발 금지** — 위계는 크기·색·여백으로.

## 3. 레이아웃 & 스페이싱

- 컨테이너 `max-w-7xl`, 좌우 `px-6`. 메인 세로 `py-10 sm:py-14`.
- 섹션 리듬: 콘텐츠 페이지 `space-y-10~12`, 섹션 내부 `space-y-6~8`. 큰 랜딩 히어로만 더 크게.
- 구분: 섹션 헤더 하단 헤어라인(`border-b`), 헤더/푸터 `border`. 박스보다 **선과 여백**.
- 라운드: `--radius 0.5rem` 기준. 기본 `rounded-md~lg`, 칩·세그먼트·드롭다운 트리거·상태 닷은 `rounded-full`, 팝오버·모달·KPI 카드는 `rounded-xl~2xl`. 절제하되 둥글림 자체는 허용.

## 4. 컴포넌트 패턴

### 4.1 공용 컨트롤 (새로 만들기 전에 먼저 확인)

| 컨트롤 | 용도 |
|---|---|
| `SegmentedControl` | 선택형 필터. `variant="underline"`=텍스트 탭(카테고리 등 보조, 한 줄 넘으면 아래로 wrap) / `variant="solid"`=캡슐 세그먼트(상호배타 주 필터) |
| `MenuSelect` | 모던 커스텀 드롭다운(네이티브 select 대체). 고스트 트리거(라벨이 셰브론에 붙는 우측 정렬) + 팝오버. `align="responsive"`(기본)로 모바일 잘림 방지 |
| `MonthPicker` | 달력형 월 선택(연도 이동 + 12개월 그리드). `""`=전체 월 |
| `Tag` | 카테고리·메타용 소프트 칩(`bg-foreground/[0.05]`, 테두리 없음) |
| `DropStatusPill` | 드롭 상태 닷 + 라벨(배경 없음). OPEN 만 `--live` 펄스 닷 |
| `Dialog` / `ConfirmDialog` | 중앙 모달(`rounded-2xl`) / 파괴적 액션 확인 모달 |
| `ImagePlaceholder` | 썸네일 자리. `src` 있으면 이미지, 없으면 웜 그라데이션 + 세리프 이니셜 |
| `ImageGallery` · `CatalogLayout` · `Pagination` | 상세 갤러리 · 카탈로그 셸 · 페이지네이션 |

> 폐기됨(재도입 금지): `FilterChip`·`FilterSelect`(→ `SegmentedControl`/`MenuSelect`), `DropStatusBadge`(→ `DropStatusPill`).

### 4.2 레이아웃·표시 패턴

- **헤더**: `sticky top-0` + `bg-background/80 backdrop-blur` + `border-b`. 세리프 워드마크 + 영문 대문자 트래킹 내비(`Drops`·`Shop`·`Orders`·`Admin`, `uppercase tracking-[0.18em]`) + 닉네임 링크 + 로그인/회원가입/로그아웃.
- **목록 툴바**: `sticky` + `border-b` 한 줄. **카테고리(좌, `SegmentedControl variant="underline"`, `lg:flex-1`)** + **상태·정렬(우, `MenuSelect`, `items-center`)**. 모바일은 세로로 쌓이고 컨트롤이 좌측 정렬되므로 `MenuSelect`/`MonthPicker` 는 `align="responsive"`(또는 `left`)로 팝오버 잘림을 막는다.
- **상품/드롭 카드**: 이미지 우선. `aspect-[4/5]`(목록) → 이름·가격·메타. 카테고리는 `Tag`, **판매자명은 `muted-foreground` 보조 텍스트**. hover 시 이미지 `group-hover:scale-[1.03~1.04] duration-700 ease-out`.
- **상태 표시**: 드롭 상태는 `DropStatusPill`. 정산 등 결과 상태 펠릿은 **소프트 틴티드** — 완료=`bg-foreground/[0.06]`, 대기=`bg-muted`, 실패=`bg-destructive/10 text-destructive`. 채도색은 진행중/실패 신호에만.
- **데이터 화면(정산 등)**: 인라인 세그먼트 탭 + 필터 줄(`MenuSelect`/`MonthPicker`) + **KPI 요약 카드**(`rounded-2xl border`, `font-numeric` 헤드라인) + **클린 테이블**(`rounded-2xl` 셸, `divide-y` 헤어라인, `bg-surface/60` 헤더, 금액은 우측정렬 `tabular-nums`).
- **재고바**: 1px 트랙 + 판매율 채움. 남은 비율 낮으면(≤15%) `bg-live`로 "마감 임박".
- **카운트다운**(`Countdown`): `tabular-nums` 큰 숫자 + 작은 대문자 라벨.

### 4.3 액션·입력 규율

- **버튼**: `primary`=블랙 솔리드(주 CTA, 한 영역에 하나), `outline`/`ghost`=보조.
- **아이콘 버튼**: 자명한 액션은 아이콘만 — 편집=`Pencil`, 삭제=`Trash`, 닫기=`X`, 대표 지정=`Star`. 반드시 `aria-label`(+ `title`). 필터·탭에는 장식 아이콘을 넣지 않는다.
- **드롭다운**: 필터/액션 선택은 `MenuSelect`(모던 팝오버). **네이티브 `<select>` 는 폼 입력에만.**
- **모달**: 확인이 필요한 파괴적 액션은 `ConfirmDialog`. 이미지 추가는 `Dialog` + 다중 이미지 + 대표(썸네일) 선택(`ProductImageField`) — BE 는 단일 `thumbnailKey` 저장이라 추가분은 provisional.

### 4.4 정보 구조(IA)

- **마이페이지**: 좌측 그룹 내비(`쇼핑` = 내 정보·주문·지갑·환불 / `판매` = 판매자 정보·상품 관리·드롭 관리·정산). 판매 그룹은 활성 판매자 정보가 있어야 열린다.
- 같은 판매 기능은 `/seller/*` 콘솔 라우트에서도 **동일 컴포넌트를 재사용**한다(마이페이지 탭과 공용).

## 5. 모션

절제가 기본. 허용: 카드 이미지 줌(`duration-700 ease-out`), LIVE 펄스(`animate-ping`), 색·언더라인 `transition-colors`. **튀는 애니메이션·과한 트랜지션 금지.**

## 6. Do / Don't

**Do** — 시맨틱 토큰만, 여백으로 위계, 비율 고정, 숫자 `tabular-nums`, 핵심 정보 우선.
**Don't** — 새 색/그라데이션 남발, 무거운 섀도우·보더 박스, 한글 세리프 강제, 한 화면 다중 검은 CTA, 정보 과밀, 하드코드 색(`bg-blue-500`).

## 7. 바꾸는 법

- 전역 톤 변경: `src/app/styles/globals.css` 의 `:root`/`.dark` + `@theme inline` 만 수정 → 전 컴포넌트 전파.
- 새 컴포넌트: 위 패턴과 시드(`features/drop/ui/*`, `shared/ui/*`)의 결을 따른다.
- 새 컨트롤이 필요하면 §4.1 에 이미 있는지 먼저 확인 → 없으면 `shared/ui` 에 추가하고 이 표를 갱신한다.

## 출처 (2026 트렌드 리서치)

- [Top Web Design Trends 2026 — Figma](https://www.figma.com/resource-library/web-design-trends/)
- [The 11 Biggest Web Design Trends of 2026 — Wix](https://www.wix.com/blog/web-design-trends)
- [Streetwear Power Ranking: The 2026 Edition — Complex](https://www.complex.com/style/a/mike-destefano/streetwear-power-ranking-2026-edition)
- [Top typography trends for 2026 — Creative Bloq](https://www.creativebloq.com/design/fonts-typography/breaking-rules-and-bringing-joy-top-typography-trends-for-2026)
- [Card UI Design Patterns 2026 — Layout Scene](https://www.layoutscene.com/card-ui-design-patterns-guide-2026/)

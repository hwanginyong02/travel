# 🚀 MVCI/CD (Minimum Viable CI/CD) 사용 및 설정 가이드

본 디렉터리는 『관광 데이터 활용 공모전 프로젝트』의 **최소 기능 CI/CD (MVCI/CD)** 파이프라인 설정을 포함하고 있습니다.

---

## 📂 파이프라인 구성

| 파일 | 파이프라인 유형 | 트리거 조건 | 주요 역할 |
|---|---|---|---|
| [`ci.yml`](file:///.github/workflows/ci.yml) | **CI (지속적 통합)** | `dev`, `main`, `ci/cd` 대상 PR 또는 Push | Python Syntax & Import 검증, TypeScript 타입 체크, Next.js 프로덕션 빌드 검증 |
| [`cd.yml`](file:///.github/workflows/cd.yml) | **CD (지속적 배포)** | `dev`, `main`, `ci/cd` Push 또는 수동 실행 (`workflow_dispatch`) | Pre-CI 검증 통과 후 **Back EC2 (`BACK_EC2_HOST`)** 및 **Front EC2 (`FRONT_EC2_HOST`)**에 비밀번호로 접속하여 각각 배포 및 헬스체크 수행 |

---

## 🔑 GitHub Secrets 필수 등록 목록

비밀번호 접속 방식 및 보안 환경변수 관리를 위해 아래 변수들을 GitHub Repository **Settings > Secrets and variables > Actions**에 등록해주세요.

| Secret 이름 | 필수 여부 | 설명 | 예시 / 기본값 |
|---|---|---|---|
| `BACK_EC2_HOST` | **필수** | 백엔드(FastAPI) EC2 고정 IP | 테라폼 `back_public_ip` (예: `43.201.xxx.xxx`) |
| `FRONT_EC2_HOST` | **필수** | 프론트엔드(Next.js) EC2 고정 IP | 테라폼 `front_public_ip` (예: `43.201.yyy.yyy`) |
| `EC2_USERNAME` | **필수** | EC2 접속 계정명 | `ubuntu` |
| `EC2_PASSWORD` | **필수** | EC2 접속 비밀번호 | `Travel2026!EC2Password` |
| `BACKEND_ENV` | **권장** | 백엔드 실서버 민감 `.env` 내용 전체 | 아래 템플릿 참조 |

### 🔒 `BACKEND_ENV` Secret 등록 템플릿 (보안 강화)
실제 API 키 및 비밀 키(JWT Secret, Tour API Key 등)는 Git에 절대 올리지 마시고, 아래 내용을 GitHub Secret `BACKEND_ENV` 항목에 넣어두시면 CD 배포 시 EC2에 안전하게 자동 생성됩니다.

```env
DATABASE_URL=postgresql://postgres:Travel2026!Password@db:5432/travel_db
TOUR_API_KEY=your_actual_tour_api_key

TOUR_API_BASE_URL=https://apis.data.go.kr/B551011/KorService2
JWT_SECRET_KEY=zmAP2h3KxEPy66qwFGBpK01MDi7dm3gaN1sP1/43zNg=
NEXT_PUBLIC_KAKAO_REST_API_KEY=f149d23d7782a35d5ba9ce43d0f0170b
KAKAO_CLIENT_SECRET=RRYa4c70Gg2Wzyt8gKqEona6cPAPXyr2
```

---

## 🛠️ 추후 고도화 확장 가이드

현재 구축된 MVCI/CD 파이프라인 위에 언제든지 다음 특색 기능을 모듈식으로 연결할 수 있습니다:

1. **[PR 프리뷰 환경]**: `ci.yml` 단계 뒤에 Vercel CLI 또는 Dynamic Docker Port 배포 스텝 연결.
2. **[DevSecOps 보안 스캔]**: `ci.yml` 빌드 스텝 사이에 `aquasecurity/trivy-action` 스캔 추가.
3. **[Nginx Blue/Green 무중단 배포]**: `cd.yml` SSH 명령 내 `deploy.sh` 스크립트를 호출하여 Nginx 포트 스위칭 및 자동 롤백 적용.

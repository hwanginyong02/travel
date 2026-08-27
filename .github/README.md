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

### 1. 서버 접속 정보 (필수)
| Secret 이름 | 필수 여부 | 설명 | 예시 / 기본값 |
|---|---|---|---|
| `BACK_EC2_HOST` | **필수** | 백엔드(FastAPI) EC2 고정 IP | `your_backend_ec2_ip` |
| `FRONT_EC2_HOST` | **필수** | 프론트엔드(Next.js) EC2 고정 IP | `your_frontend_ec2_ip` |
| `EC2_USERNAME` | **필수** | EC2 접속 계정명 | `ubuntu` |
| `EC2_PASSWORD` | **필수** | EC2 접속 비밀번호 | `your_ec2_password` |

### 2. 백엔드 환경변수 (개별 등록 권장)
배포 시 `backend/.env` 파일로 안전하게 자동 생성 및 주입됩니다:
| Secret 이름 | 필수 여부 | 설명 | 예시 |
|---|---|---|---|
| `DATABASE_URL` | **필수** | PostgreSQL 연결 URL | `postgresql://postgres:your_password@db:5432/travel_db` |
| `JWT_SECRET_KEY` | **필수** | JWT 토큰 서명 키 | `your_jwt_secret_key` |
| `TOUR_API_KEY` | **필수** | 한국관광공사 Tour API 인증키 | `your_tour_api_key` |
| `TOUR_API_BASE_URL` | 선택 | Tour API 기본 엔드포인트 | `https://apis.data.go.kr/B551011/KorService1` |
| `NEXT_PUBLIC_KAKAO_REST_API_KEY` | **필수** | 카카오 REST API 키 | `your_kakao_rest_api_key` |
| `KAKAO_CLIENT_SECRET` | 선택 | 카카오 로그인 Client Secret | `your_kakao_client_secret` |
| `POSTGRES_USER` | 선택 | DB 사용자명 (기본: `postgres`) | `postgres` |
| `POSTGRES_PASSWORD` | 선택 | DB 비밀번호 (기본: `1234`) | `your_db_password` |
| `POSTGRES_DB` | 선택 | DB 이름 (기본: `travel_db`) | `travel_db` |
| `UPLOAD_DIR` | 선택 | 업로드 저장 디렉터리 (기본: `uploads`) | `uploads` |

*(참고: 기존 `BACKEND_ENV` 단일 Secret으로 한 번에 넣는 방식도 하위 호환성을 위해 자동 감지하여 지원합니다.)*

### 3. 프론트엔드 환경변수
| Secret 이름 | 필수 여부 | 설명 | 예시 |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **필수** | 백엔드 API 엔드포인트 | `http://your_backend_ip:8000` |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | **필수** | 카카오 Javascript 키 (지도 렌더링용) | `your_kakao_app_key` |
| `NEXT_PUBLIC_KAKAO_REST_API_KEY`| **필수** | 카카오 REST API 키 (로그인/검색용) | `your_kakao_rest_api_key` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 선택 | 구글 OAuth 클라이언트 ID | `your_google_client_id` |

---

## 🛠️ 추후 고도화 확장 가이드

현재 구축된 MVCI/CD 파이프라인 위에 언제든지 다음 특색 기능을 모듈식으로 연결할 수 있습니다:

1. **[PR 프리뷰 환경]**: `ci.yml` 단계 뒤에 Vercel CLI 또는 Dynamic Docker Port 배포 스텝 연결.
2. **[DevSecOps 보안 스캔]**: `ci.yml` 빌드 스텝 사이에 `aquasecurity/trivy-action` 스캔 추가.
3. **[Nginx Blue/Green 무중단 배포]**: `cd.yml` SSH 명령 내 `deploy.sh` 스크립트를 호출하여 Nginx 포트 스위칭 및 자동 롤백 적용.

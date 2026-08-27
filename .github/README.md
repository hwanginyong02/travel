# 🚀 MVCI/CD (Minimum Viable CI/CD) 사용 및 설정 가이드

본 디렉터리는 『관광 데이터 활용 공모전 프로젝트』의 **최소 기능 CI/CD (MVCI/CD)** 파이프라인 설정을 포함하고 있습니다.

---

## 📂 파이프라인 구성

| 파일 | 파이프라인 유형 | 트리거 조건 | 주요 역할 |
|---|---|---|---|
| [`ci.yml`](file:///.github/workflows/ci.yml) | **CI (지속적 통합)** | `dev`, `main` 대상 PR 또는 `dev` Push | Python Syntax & Import 검증, TypeScript 타입 체크, Next.js 프로덕션 빌드 검증 |
| [`cd.yml`](file:///.github/workflows/cd.yml) | **CD (지속적 배포)** | `main` 브랜치 Push 또는 수동 실행 (`workflow_dispatch`) | Pre-CI 검증 통과 후 **Back EC2 (`BACK_EC2_HOST`)** 및 **Front EC2 (`FRONT_EC2_HOST`)**에 비밀번호로 접속하여 각각 배포 및 헬스체크 수행 |

---

## 🔑 GitHub Secrets 필수 등록 목록 (총 4개)

`.pem` 키 파일 없이 **비밀번호 접속 방식**으로 설정되어 있습니다. 아래 **4개 변수만** GitHub Repository **Settings > Secrets and variables > Actions**에 등록하시면 됩니다.

| Secret 이름 | 설명 | 테라폼 설정값 / 예시 |
|---|---|---|
| `BACK_EC2_HOST` | 백엔드(FastAPI) EC2 고정 IP | 테라폼 `back_public_ip` (예: `43.201.xxx.xxx`) |
| `FRONT_EC2_HOST` | 프론트엔드(Next.js) EC2 고정 IP | 테라폼 `front_public_ip` (예: `43.201.yyy.yyy`) |
| `EC2_USERNAME` | EC2 접속 계정명 | `ubuntu` |
| `EC2_PASSWORD` | EC2 접속 비밀번호 | `Travel2026!EC2Password` (또는 `terraform.tfvars`에 설정한 비밀번호) |

> [!NOTE]
> `EC2_SSH_KEY` (SSH .pem 키)는 등록하지 않으셔도 되며, `EC2_PASSWORD` 만으로 100% 정상 접속 및 자동 배포가 이루어집니다.

---

## 🛠️ 추후 고도화 확장 가이드

현재 구축된 MVCI/CD 파이프라인 위에 언제든지 다음 특색 기능을 모듈식으로 연결할 수 있습니다:

1. **[PR 프리뷰 환경]**: `ci.yml` 단계 뒤에 Vercel CLI 또는 Dynamic Docker Port 배포 스텝 연결.
2. **[DevSecOps 보안 스캔]**: `ci.yml` 빌드 스텝 사이에 `aquasecurity/trivy-action` 스캔 추가.
3. **[Nginx Blue/Green 무중단 배포]**: `cd.yml` SSH 명령 내 `deploy.sh` 스크립트를 호출하여 Nginx 포트 스위칭 및 자동 롤백 적용.

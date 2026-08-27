# AWS Terraform MVI Infrastructure Guide (`infra/`)

이 디렉토리는 『관광 데이터 공모전 프로젝트』의 AWS MVI (Minimum Viable Infrastructure) 구축을 위한 모듈화된 테라폼(Terraform) 코드 모음입니다.

---

## 🏗️ 폴더 구조 (Modules Architecture)

```text
infra/
├── main.tf                 # 루트 모듈 (VPC, Compute, Database 모듈 호출)
├── provider.tf             # AWS 프로바이더 설정
├── variables.tf            # 전역 변수 정의
├── outputs.tf              # EC2 IP, RDS 엔드포인트 출력
├── terraform.tfvars        # 로컬 환경 전용 민감 변수 (.gitignore 처리됨)
├── terraform.tfvars.example# 설정 예시 템플릿
├── README.md               # 가이드 문서
└── modules/                # 용도별 독립 모듈
    ├── vpc/                # 네트워크 (VPC, Subnet 4개, IGW, Security Group 3개)
    ├── compute/            # 웹/앱 서버 (Front EC2, Back EC2, Docker 설치)
    └── database/           # 관리형 DB (RDS PostgreSQL 15, Private Subnet)
```

---

## 🚀 인프라 상세 스펙

- **VPC (`modules/vpc`)**: `10.0.0.0/16`
  - Public Subnet 2개 (`ap-northeast-2a`, `ap-northeast-2c`)
  - Private Subnet 2개 (`ap-northeast-2a`, `ap-northeast-2c` - RDS Subnet Group 전용)
  - Security Groups: `front_sg`(80, 3000), `back_sg`(80, 8000), `rds_sg`(5432 - 백엔드 전용)
- **Compute (`modules/compute`)**:
  - **Front EC2**: Next.js (`t3.micro`, Ubuntu 22.04 LTS)
  - **Back EC2**: FastAPI (`t3.micro`, Ubuntu 22.04 LTS)
  - **접속 방식**: 비밀번호 로그인 (`ubuntu` / `your_ec2_password`)
- **Database (`modules/database`)**:
  - **RDS PostgreSQL 15**: `db.t3.micro`, 20GB gp3, Private Subnet 격리

---

## 💻 주요 명령 가이드

```bash
cd infra
terraform init      # 모듈 및 프로바이더 초기화
terraform validate  # 문법 검증
terraform plan      # 변동 사항 확인
terraform apply     # 인프라 적용
```

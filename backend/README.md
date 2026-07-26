# 🌲 2026 관광데이터 활용 공모전 - Backend API

FastAPI 기반의 자연 힐링 플랫폼 백엔드 서비스입니다. 공공 API(TourAPI 4.0)의 거시 명소 정보 위에 사용자가 등록한 미시 핀 좌표, 사진 EXIF 검증, 게이미피케이션(인증/뱃지) 서비스를 제공합니다.

---

## 🏗️ 데이터베이스 스키마 설계 (DB Schema)

관계형 데이터베이스(RDB) 구조 설계안입니다.

```mermaid
erDiagram
    users ||--o{ pins : "creates"
    users ||--o{ verifications : "performs"
    users ||--o{ user_badges : "earns"
    badges ||--o{ user_badges : "awarded_to"
    
    tour_spots ||--o{ pins : "contains"
    pins ||--o{ pin_photos : "has"
    pins ||--o{ pin_tags : "categorized_by"
    tags ||--o{ pin_tags : "defines"
    
    pins ||--o{ verifications : "verified_by"
    pins ||--o{ condition_reports : "has_status"
    users ||--o{ condition_reports : "reports"
```

### 1. `users` (사용자 테이블)
- `id` (INT, PK, Auto Increment)
- `email` (VARCHAR, Unique, Nullable)
- `nickname` (VARCHAR, Unique)
- `level` (INT, Default 1)
- `points` (INT, Default 0)
- `created_at` (TIMESTAMP, Default NOW)

### 2. `tour_spots` (관광공사 공공 API 명소 테이블 - 베이스 맵)
- `id` (INT, PK) : TourAPI의 `contentid` 값을 그대로 매핑
- `title` (VARCHAR) : 명소 이름 (예: 남산공원, 북한산 등)
- `mapx` (DOUBLE) : 경도 (Longitude)
- `mapy` (DOUBLE) : 위도 (Latitude)
- `firstimage` (VARCHAR, Nullable) : 기본 대표 이미지 URL
- `overview` (TEXT, Nullable) : 명소 개요
- `created_at` (TIMESTAMP)

### 3. `pins` (미시 좌표 핀 테이블)
- `id` (INT, PK, Auto Increment)
- `tour_spot_id` (INT, FK -> `tour_spots.id`) : 소속된 공공 명소
- `user_id` (INT, FK -> `users.id`) : 등록자
- `title` (VARCHAR) : 핀 이름 (예: '물소리가 잘 들리는 벤치')
- `description` (TEXT) : 핀 상세 정보 및 메모
- `latitude` (DOUBLE) : 정밀 위도
- `longitude` (DOUBLE) : 정밀 경도
- `is_blurred` (BOOLEAN, Default False) : 민감지역 좌표 흐림 처리 여부 (500m 반경 등)
- `reliability_score` (INT, Default 0) : 다른 사용자의 인증수(Verification) 기반 신뢰도 점수
- `last_status_checked_at` (TIMESTAMP) : 최종 유효 확인 일시 ("지금도 그대로인가요?")
- `created_at` (TIMESTAMP, Default NOW)

### 4. `pin_photos` (핀 사진 테이블)
- `id` (INT, PK, Auto Increment)
- `pin_id` (INT, FK -> `pins.id`)
- `photo_url` (VARCHAR) : 저장된 사진 S3/스토리지 주소
- `exif_latitude` (DOUBLE, Nullable) : 사진 EXIF에서 추출한 위도
- `exif_longitude` (DOUBLE, Nullable) : 사진 EXIF에서 추출한 경도
- `exif_taken_at` (TIMESTAMP, Nullable) : 사진 촬영 일시
- `is_validated` (BOOLEAN, Default False) : EXIF 좌표와 핀 등록 좌표 일치 여부 검증 성공 상태
- `created_at` (TIMESTAMP, Default NOW)

### 5. `tags` 및 `pin_tags` (경험 태그 테이블)
- `tags` (태그 마스터)
  - `id` (INT, PK, Auto Increment)
  - `name` (VARCHAR, Unique) : 태그 이름 (예: 물멍벤치)
  - `is_danger` (BOOLEAN, Default False) : 위험 구역 유무 (True 일 경우 사용자에게 주의 표시)
- `pin_tags` (매핑 테이블)
  - `pin_id` (INT, FK -> `pins.id`, PK)
  - `tag_id` (INT, FK -> `tags.id`, PK)

### 6. `verifications` (방문 인증 및 신뢰도 테이블)
- `id` (INT, PK, Auto Increment)
- `pin_id` (INT, FK -> `pins.id`)
- `user_id` (INT, FK -> `users.id`)
- `photo_url` (VARCHAR, Nullable) : 인증용 촬영 이미지 (선택)
- `is_still_there` (BOOLEAN) : "지금도 그대로인가요?" 질문에 대한 답변 (True/False)
- `is_validated` (BOOLEAN, Default False) : 인증 사진의 EXIF 좌표가 핀 좌표와 일치하는지 여부
- `created_at` (TIMESTAMP, Default NOW)

> `pins.reliability_score`는 이 테이블로부터 매번 재계산됩니다.
> 등록 사진 EXIF 검증 +1, '그대로예요' +1 (현장 사진까지 검증되면 +2), '없어졌어요' -2.

### 7. `condition_reports` (실시간 컨디션 리포트 테이블)
- `id` (INT, PK, Auto Increment)
- `pin_id` (INT, FK -> `pins.id`)
- `user_id` (INT, FK -> `users.id`)
- `status_type` (VARCHAR) : 예: `CROWDED`(붐빔), `QUIET`(조용함), `TEMPORARILY_CLOSED`(임시통제)
- `created_at` (TIMESTAMP, Default NOW)

### 8. `badges` 및 `user_badges` (보상/게이미화 테이블)
- `badges` (뱃지 마스터)
  - `id` (INT, PK, Auto Increment)
  - `name` (VARCHAR, Unique) : 뱃지 이름
  - `description` (VARCHAR) : 획득 조건 설명
  - `icon_url` (VARCHAR) : 뱃지 이미지 URL
- `user_badges` (유저별 뱃지 매핑)
  - `user_id` (INT, FK -> `users.id`, PK)
  - `badge_id` (INT, FK -> `badges.id`, PK)
  - `created_at` (TIMESTAMP, Default NOW)

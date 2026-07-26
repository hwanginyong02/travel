const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // FormData(파일 업로드)는 브라우저가 boundary를 포함한 Content-Type을 직접 만들어야 하므로
  // 기본 JSON 헤더를 붙이지 않습니다.
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

/** 백엔드가 내려준 detail 메시지를 우선 사용하고, 없으면 상태 코드로 대체합니다. */
async function buildErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) return body.detail[0].msg;
  } catch {
    // JSON이 아닌 응답은 무시하고 상태 코드로 넘어갑니다.
  }
  return `API error: ${response.status} ${response.statusText}`;
}

/** 로그인 토큰을 읽어 Authorization 헤더를 만듭니다. 토큰이 없으면 빈 객체를 반환합니다. */
export function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

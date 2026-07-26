'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  coords: Coordinates | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

const ERROR_MESSAGES: Record<number, string> = {
  1: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.',
  2: '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.',
  3: '위치 확인 시간이 초과되었습니다.',
};

/**
 * 브라우저 GPS로 현재 좌표를 가져옵니다.
 * 핀 등록처럼 정밀 좌표가 필요한 화면에서 사용하며, UI 컴포넌트에서 위치 로직을 분리합니다.
 */
export function useGeolocation(autoStart: boolean = true): GeolocationState & { refresh: () => void } {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    accuracy: null,
    loading: autoStart,
    error: null,
  });

  const refresh = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({ coords: null, accuracy: null, loading: false, error: '이 브라우저는 위치 기능을 지원하지 않습니다.' });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          coords: null,
          accuracy: null,
          loading: false,
          error: ERROR_MESSAGES[error.code] || '위치를 가져오지 못했습니다.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (autoStart) refresh();
  }, [autoStart, refresh]);

  return { ...state, refresh };
}

export default useGeolocation;

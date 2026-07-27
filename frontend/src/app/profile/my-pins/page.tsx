'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import PinList from '@/components/features/profile/PinList';
import { getMyPins, Pin, resolvePhotoUrl } from '@/api/pins';
import { formatDateTime } from '@/utils/date';

export default function MyPinsPage() {
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    getMyPins()
      .then(setPins)
      .catch((err) => console.error('Failed to get my pins:', err));
  }, [router]);

  const items = pins.map((pin) => ({
    id: pin.id,
    title: pin.title,
    location: pin.tour_spot_title || '등록 명소 정보 없음',
    tag: pin.tags.length > 0 ? `#${pin.tags[0].name}` : '',
    date: formatDateTime(pin.created_at),
    image: pin.photos.length > 0 ? resolvePhotoUrl(pin.photos[0].photo_url) : '',
    verifications: pin.verification_count,
  }));

  return (
    <main>
      <Header title="내가 등록한 핀" />
      <PinList pins={items} />
    </main>
  );
}

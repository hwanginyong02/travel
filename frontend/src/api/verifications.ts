import { apiFetch, authHeader } from './client';
import { PinAuthor } from './pins';

export interface Verification {
  id: number;
  pin_id: number;
  is_still_there: boolean;
  photo_url?: string;
  created_at: string;
  user?: PinAuthor;
}

export interface VerificationCreateResult {
  verification: Verification;
  reliability_score: number;
  photo_validated: boolean;
  message: string;
}

export interface VerificationCreateInput {
  pinId: number;
  isStillThere: boolean;
  photo?: File | null;
}

export async function createVerification(
  input: VerificationCreateInput
): Promise<VerificationCreateResult> {
  const form = new FormData();
  form.append('pin_id', String(input.pinId));
  form.append('is_still_there', String(input.isStillThere));
  if (input.photo) {
    form.append('photo', input.photo);
  }

  return apiFetch<VerificationCreateResult>('/api/verifications', {
    method: 'POST',
    headers: authHeader(),
    body: form,
  });
}

export async function getVerifications(
  pinId: number | string,
  limit: number = 50
): Promise<Verification[]> {
  const params = new URLSearchParams({ pin_id: String(pinId), limit: String(limit) });
  return apiFetch<Verification[]>(`/api/verifications?${params.toString()}`);
}

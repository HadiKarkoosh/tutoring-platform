export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Subject {
  id: number;
  name: string;
}

export interface Tutor {
  id: string;
  name: string;
  bio: string | null;
  hourlyRate: number | null;
  subjects: Subject[];
  avgRating: number | null;
  reviewCount?: number;
  reviews?: Review[];
  availableSlots?: Slot[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  student?: { id: string; name: string };
}

export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
}

export interface Booking {
  id: string;
  status: string;
  createdAt: string;
  slot: Slot;
  student?: { id: string; name: string; email: string };
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'tutor' | 'student';
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `خطأ ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join('، ')
        : body.message ?? message;
    } catch {
      /* keep default */
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export function formatSlot(slot: Slot) {
  const fmt = new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const time = new Intl.DateTimeFormat('ar', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fmt.format(new Date(slot.startTime))} — ${time.format(
    new Date(slot.endTime),
  )}`;
}

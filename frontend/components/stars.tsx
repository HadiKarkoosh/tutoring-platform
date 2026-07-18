'use client';

import { useT } from '../lib/i18n';

const TEXT = {
  noReviews: { ar: 'لا يوجد تقييمات بعد', en: 'No reviews yet' },
};

export default function Stars({ rating, count }: { rating: number | null; count?: number }) {
  const t = useT(TEXT);
  if (rating == null) return <span className="muted">{t.noReviews}</span>;
  const full = Math.round(rating);
  return (
    <span dir="ltr" style={{ color: 'var(--accent)', fontSize: 14 }}>
      {'★'.repeat(full)}
      <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - full)}</span>{' '}
      <span className="muted" style={{ fontSize: 13 }}>
        {rating.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </span>
    </span>
  );
}

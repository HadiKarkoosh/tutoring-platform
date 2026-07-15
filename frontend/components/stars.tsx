export default function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) return <span className="muted">لا يوجد تقييمات بعد</span>;
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

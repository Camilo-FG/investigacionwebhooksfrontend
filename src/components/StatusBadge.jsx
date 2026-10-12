import { statusInfo } from '../format.js';

export default function StatusBadge({ status }) {
  const { label, tone } = statusInfo(status);
  return (
    <span className="badge" data-tone={tone} title={status}>
      {label}
    </span>
  );
}

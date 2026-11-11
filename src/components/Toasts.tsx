import { useToasts } from '../ui/toast';

export function Toasts() {
  const items = useToasts();
  return (
    <div id="toasts" aria-live="polite">
      {items.slice(-3).map((t) => (
        <div className="toast" key={t.id}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

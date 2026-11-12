import { useState } from 'react';
import { exportSave, importSave } from '../state/store';

/** Copy a backup code to move progress to another device, or paste one to restore. */
export function Backup({ onRestored }: { onRestored?: () => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  return (
    <div className="col">
      <button
        className="btn ghost"
        onClick={async () => {
          const c = exportSave();
          setCode(c);
          try {
            await navigator.clipboard.writeText(c);
            setMsg({ ok: true, t: 'Backup code copied. Keep it somewhere safe, like your notes app.' });
          } catch {
            setMsg({ ok: true, t: 'Select the code below and copy it.' });
          }
        }}
      >
        Copy backup code
      </button>
      <textarea className="code" rows={3} value={code} placeholder="Or paste a backup code here to restore it" onChange={(e) => (setCode(e.target.value), setMsg(null))} aria-label="Backup code" />
      <button
        className="btn ghost"
        disabled={!code.trim()}
        onClick={() => {
          const ok = importSave(code);
          setMsg(ok ? { ok, t: 'Progress restored.' } : { ok, t: 'That code is not a valid Money Sim backup. Nothing was changed.' });
          if (ok) onRestored?.();
        }}
      >
        Restore from code
      </button>
      {msg && <p className="small" style={{ color: msg.ok ? 'var(--good-deep)' : 'var(--bad)' }}>{msg.t}</p>}
    </div>
  );
}

import { useSyncExternalStore } from 'react';

interface Toast {
  id: number;
  msg: string;
}

let items: Toast[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(msg: string): void {
  const id = ++seq;
  items = [...items, { id, msg }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export const useToasts = (): Toast[] => useSyncExternalStore(subscribe, () => items, () => items);

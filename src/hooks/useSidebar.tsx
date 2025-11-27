import { useEffect, useState } from 'react';

const STORAGE_KEY = 'app_sidebar_open_v1';

export default function useSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return false; // default collapsed
      return JSON.parse(raw) as boolean;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  const toggle = () => setIsOpen((s) => !s);

  return { isOpen, setIsOpen, toggle } as const;
}

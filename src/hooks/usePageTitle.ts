import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} — Fitnex` : 'Fitnex — Track your gains';
    return () => {
      document.title = 'Fitnex — Track your gains';
    };
  }, [title]);
};

import { useQuery } from '@tanstack/react-query';

declare global {
  interface Window {
    electronAPI: {
      getSnapshot: () => Promise<any>;
    };
  }
}

export function useBotSnapshot() {
  const fetchSnapshot = async () => {
    return await window.electronAPI.getSnapshot();
  };

  return useQuery({
    queryKey: ['botSnapshot'],
    queryFn: fetchSnapshot,
    refetchInterval: 500,
  });
}
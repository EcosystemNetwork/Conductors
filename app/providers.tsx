'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        {children}
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}

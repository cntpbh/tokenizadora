'use client';

import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Polygon } from "@thirdweb-dev/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  metamaskWallet, 
  coinbaseWallet, 
  walletConnect,
  trustWallet,
  rainbowWallet,
  phantomWallet,
} from "@thirdweb-dev/react";

// QueryClient otimizado para reduzir chamadas desnecessárias
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Não recarrega ao focar janela
      refetchOnMount: false, // Não recarrega ao montar
      refetchOnReconnect: false, // Não recarrega ao reconectar
      retry: 1, // Apenas 1 retry
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
      cacheTime: 10 * 60 * 1000, // 10 minutos - tempo no cache
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider
        activeChain={Polygon}
        clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || ""}
        supportedChains={[Polygon]}
        autoConnect={true}
        supportedWallets={[
          metamaskWallet({ recommended: true }),
          walletConnect(),
          coinbaseWallet(),
          trustWallet(),
          rainbowWallet(),
          phantomWallet(),
        ]}
        dAppMeta={{
          name: "IBEDIS Token",
          description: "Plataforma de Ativos Sustentáveis",
          url: "https://token.ibedis.com.br",
          logoUrl: "https://ibedis.org.br/logo.png",
        }}
      >
        {children}
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}

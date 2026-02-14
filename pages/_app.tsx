import type { AppProps } from 'next/app';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { THIRDWEB_CLIENT_ID } from '../lib/thirdweb';
import '../styles/globals.css';
import '../styles/reactflow-custom.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      clientId={THIRDWEB_CLIENT_ID}
      activeChain="ethereum"
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

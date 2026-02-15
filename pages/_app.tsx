import type { AppProps } from 'next/app';
import { ThirdwebProvider } from 'thirdweb/react';
import '../styles/globals.css';
import '../styles/reactflow-custom.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider>
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

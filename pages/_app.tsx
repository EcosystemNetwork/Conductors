import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/reactflow-custom.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

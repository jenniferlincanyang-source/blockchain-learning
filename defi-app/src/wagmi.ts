import { http, createConfig } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// WalletConnect 项目 ID（需要在 https://cloud.walletconnect.com 申请）
const projectId = 'YOUR_PROJECT_ID'

export const config = createConfig({
  chains: [mainnet, bsc, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

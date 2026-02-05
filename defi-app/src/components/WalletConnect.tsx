import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
}

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { chains, switchChain } = useSwitchChain()
  const { data: balance } = useBalance({ address })

  if (isConnected) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-green-400 text-sm">● 已连接</span>
          <button
            onClick={() => disconnect()}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            断开连接
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-gray-400 text-sm">钱包地址</p>
            <p className="text-white font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">当前网络</p>
            <select
              value={chainId}
              onChange={(e) => switchChain({ chainId: Number(e.target.value) as 1 | 56 | 137 | 42161 })}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 w-full mt-1"
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chainNames[chain.id] || chain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-gray-400 text-sm">余额</p>
            <p className="text-white text-xl font-semibold">
              {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : '加载中...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <h2 className="text-white text-lg font-semibold mb-4">连接钱包</h2>
      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-xl py-3 px-4 font-medium transition-colors"
          >
            {isPending ? '连接中...' : connector.name}
          </button>
        ))}
      </div>
    </div>
  )
}

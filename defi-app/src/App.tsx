import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { WalletConnect } from './components/WalletConnect'
import { TokenBalance } from './components/TokenBalance'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            {/* 标题 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">DeFi 学习应用</h1>
              <p className="text-gray-400">学习钱包连接、代币查询与转账</p>
            </div>

            {/* 主要内容 */}
            <div className="grid md:grid-cols-2 gap-6">
              <WalletConnect />
              <TokenBalance />
            </div>

            {/* 学习说明 */}
            <div className="mt-8 bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">学习要点</h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• <strong className="text-white">wagmi</strong> - React Hooks 库，简化 Web3 开发</li>
                <li>• <strong className="text-white">viem</strong> - 底层以太坊交互库，类型安全</li>
                <li>• <strong className="text-white">useAccount</strong> - 获取当前连接的钱包信息</li>
                <li>• <strong className="text-white">useConnect/useDisconnect</strong> - 连接/断开钱包</li>
                <li>• <strong className="text-white">useReadContract</strong> - 读取合约数据（不消耗 Gas）</li>
                <li>• <strong className="text-white">useWriteContract</strong> - 写入合约（需要签名和 Gas）</li>
              </ul>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

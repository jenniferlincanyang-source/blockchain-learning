import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'

// Uniswap V2 Router ABI（简化版）
const routerAbi = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const

// ERC20 ABI
const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// 不同链的配置
const chainConfig: Record<number, {
  router: `0x${string}`
  weth: `0x${string}`
  tokens: { symbol: string; address: `0x${string}`; decimals: number }[]
}> = {
  1: { // Ethereum
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokens: [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830', decimals: 18 },
    ],
  },
  56: { // BNB Chain
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    tokens: [
      { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    ],
  },
}

export function Swap() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const config = chainConfig[chainId]

  const [tokenIn, setTokenIn] = useState<`0x${string}`>(config?.tokens[0]?.address || '0x')
  const [tokenOut, setTokenOut] = useState<`0x${string}`>(config?.tokens[1]?.address || '0x')
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState('0.5')

  // 获取代币信息
  const tokenInInfo = config?.tokens.find(t => t.address === tokenIn)
  const tokenOutInfo = config?.tokens.find(t => t.address === tokenOut)

  // 查询余额
  const { data: balanceIn } = useReadContract({
    address: tokenIn,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // 查询授权额度
  const { data: allowance } = useReadContract({
    address: tokenIn,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && config ? [address, config.router] : undefined,
  })

  // 查询预估输出
  const amountInWei = amountIn && tokenInInfo
    ? parseUnits(amountIn, tokenInInfo.decimals)
    : BigInt(0)

  const { data: amountsOut } = useReadContract({
    address: config?.router,
    abi: routerAbi,
    functionName: 'getAmountsOut',
    args: amountInWei > 0 ? [amountInWei, [tokenIn, tokenOut]] : undefined,
  })

  const estimatedOut = amountsOut?.[1]
  const minAmountOut = estimatedOut
    ? estimatedOut * BigInt(Math.floor((100 - parseFloat(slippage)) * 100)) / BigInt(10000)
    : BigInt(0)

  // 授权
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  // Swap
  const { writeContract: swap, data: swapHash, isPending: isSwapping } = useWriteContract()
  const { isLoading: isSwapConfirming, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash })

  const needsApproval = allowance !== undefined && amountInWei > 0 && allowance < amountInWei

  const handleApprove = () => {
    if (!config) return
    approve({
      address: tokenIn,
      abi: erc20Abi,
      functionName: 'approve',
      args: [config.router, maxUint256],
    })
  }

  const handleSwap = () => {
    if (!config || !address || !minAmountOut) return
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200) // 20分钟
    swap({
      address: config.router,
      abi: routerAbi,
      functionName: 'swapExactTokensForTokens',
      args: [amountInWei, minAmountOut, [tokenIn, tokenOut], address, deadline],
    })
  }

  // 切换代币
  const switchTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
  }

  // 链切换时更新代币
  useEffect(() => {
    if (config) {
      setTokenIn(config.tokens[0].address)
      setTokenOut(config.tokens[1].address)
    }
  }, [chainId])

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">请先连接钱包</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">当前网络不支持，请切换到 Ethereum 或 BNB Chain</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-semibold">Swap 交换</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">滑点</span>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1 w-16 text-sm"
          />
          <span className="text-gray-400 text-sm">%</span>
        </div>
      </div>

      {/* 输入代币 */}
      <div className="bg-gray-700/50 rounded-xl p-4 mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-sm">卖出</span>
          <span className="text-gray-400 text-sm">
            余额: {balanceIn && tokenInInfo ? formatUnits(balanceIn, tokenInInfo.decimals) : '0'}
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="bg-transparent text-white text-2xl w-full outline-none"
          />
          <select
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value as `0x${string}`)}
            className="bg-gray-600 text-white rounded-lg px-3 py-2"
          >
            {config.tokens.map((t) => (
              <option key={t.address} value={t.address}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 切换按钮 */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={switchTokens}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 border-4 border-gray-800"
        >
          ↓↑
        </button>
      </div>

      {/* 输出代币 */}
      <div className="bg-gray-700/50 rounded-xl p-4 mt-2 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-sm">买入</span>
        </div>
        <div className="flex gap-3">
          <div className="text-white text-2xl w-full">
            {estimatedOut && tokenOutInfo
              ? parseFloat(formatUnits(estimatedOut, tokenOutInfo.decimals)).toFixed(6)
              : '0.0'}
          </div>
          <select
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value as `0x${string}`)}
            className="bg-gray-600 text-white rounded-lg px-3 py-2"
          >
            {config.tokens.map((t) => (
              <option key={t.address} value={t.address}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 价格信息 */}
      {estimatedOut && amountInWei > 0 && tokenInInfo && tokenOutInfo && (
        <div className="bg-gray-700/30 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>汇率</span>
            <span>
              1 {tokenInInfo.symbol} = {(parseFloat(formatUnits(estimatedOut, tokenOutInfo.decimals)) / parseFloat(amountIn)).toFixed(6)} {tokenOutInfo.symbol}
            </span>
          </div>
          <div className="flex justify-between text-gray-400 mt-1">
            <span>最小获得</span>
            <span>{formatUnits(minAmountOut, tokenOutInfo.decimals)} {tokenOutInfo.symbol}</span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApproving || isApproveConfirming}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
        >
          {isApproving ? '确认中...' : isApproveConfirming ? '授权中...' : `授权 ${tokenInInfo?.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={isSwapping || isSwapConfirming || !amountIn || amountInWei === BigInt(0)}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
        >
          {isSwapping ? '确认中...' : isSwapConfirming ? '交易中...' : 'Swap'}
        </button>
      )}

      {isApproveSuccess && <p className="text-green-400 text-sm text-center mt-2">授权成功！</p>}
      {isSwapSuccess && <p className="text-green-400 text-sm text-center mt-2">交换成功！</p>}
    </div>
  )
}

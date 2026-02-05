import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'

// ERC20 ABI（只包含需要的函数）
const erc20Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

// 常用代币地址（以太坊主网）
const tokens: Record<string, `0x${string}`> = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
}

export function TokenBalance() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<`0x${string}`>(tokens.USDT)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  const { data: balance } = useReadContract({
    address: selectedToken,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: symbol } = useReadContract({
    address: selectedToken,
    abi: erc20Abi,
    functionName: 'symbol',
  })

  const { data: decimals } = useReadContract({
    address: selectedToken,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleTransfer = () => {
    if (!recipient || !amount || !decimals) return
    writeContract({
      address: selectedToken,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseUnits(amount, decimals)],
    })
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <p className="text-gray-400 text-center">请先连接钱包</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <h2 className="text-white text-lg font-semibold mb-4">代币操作</h2>

      {/* 代币选择 */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">选择代币</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value as `0x${string}`)}
          className="bg-gray-700 text-white rounded-lg px-3 py-2 w-full mt-1"
        >
          {Object.entries(tokens).map(([name, addr]) => (
            <option key={addr} value={addr}>{name}</option>
          ))}
        </select>
      </div>

      {/* 余额显示 */}
      <div className="bg-gray-700/50 rounded-xl p-4 mb-4">
        <p className="text-gray-400 text-sm">当前余额</p>
        <p className="text-white text-2xl font-semibold">
          {balance !== undefined && decimals
            ? `${formatUnits(balance, decimals)} ${symbol || ''}`
            : '加载中...'}
        </p>
      </div>

      {/* 转账表单 */}
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-sm">接收地址</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="bg-gray-700 text-white rounded-lg px-3 py-2 w-full mt-1"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm">转账数量</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="bg-gray-700 text-white rounded-lg px-3 py-2 w-full mt-1"
          />
        </div>
        <button
          onClick={handleTransfer}
          disabled={isPending || isConfirming || !recipient || !amount}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-xl py-3 font-medium transition-colors"
        >
          {isPending ? '确认中...' : isConfirming ? '交易处理中...' : '转账'}
        </button>
        {isSuccess && (
          <p className="text-green-400 text-sm text-center">交易成功！</p>
        )}
      </div>
    </div>
  )
}

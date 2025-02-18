import { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'
import { formatUnits } from '@ethersproject/units'

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]

export function useTokenBalances(tokenAddresses: string[]) {
  const { account, library } = useWeb3React()
  const [balances, setBalances] = useState<{ [address: string]: string }>({})

  useEffect(() => {
    if (!library || !account) return

    const fetchBalances = async () => {
      const newBalances: { [address: string]: string } = {}
      
      for (const address of tokenAddresses) {
        try {
          const contract = new Contract(address, ERC20_ABI, library)
          const balance = await contract.balanceOf(account)
          const decimals = await contract.decimals()
          newBalances[address] = formatUnits(balance, decimals)
        } catch (error) {
          console.error(`Error fetching balance for token ${address}:`, error)
          newBalances[address] = '0.0'
        }
      }

      setBalances(newBalances)
    }

    fetchBalances()
    
    // Poll for balance updates every 15 seconds
    const interval = setInterval(fetchBalances, 15000)
    return () => clearInterval(interval)
  }, [library, account, tokenAddresses])

  return balances
}

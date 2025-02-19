import { useEffect, useState } from 'react'
import { Contract } from '@ethersproject/contracts'
import { useWeb3 } from './useWeb3'
import { TOKEN_METADATA } from '../config/tokenList'
import type { Token } from './types'

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]

/**
 * Hook to fetch token metadata from chain with fallback to configuration.
 * @param address Token contract address
 * @returns Token metadata including decimals, symbol, and name
 */
export function useTokenMetadata(address: string) {
  const { library } = useWeb3()
  const [metadata, setMetadata] = useState<Omit<Token, 'balance' | 'lastUsed'>>(
    TOKEN_METADATA[address] || {
      address,
      symbol: '',
      name: '',
      decimals: 18,
      logoURI: '',
      price: '0',
      priceChange24h: '0'
    }
  )

  useEffect(() => {
    if (!library || !address) return

    const fetchMetadata = async () => {
      try {
        const contract = new Contract(address, ERC20_ABI, library)
        const [decimals, symbol, name] = await Promise.all([
          contract.decimals(),
          contract.symbol(),
          contract.name()
        ])

        setMetadata(prev => ({
          ...prev,
          decimals,
          symbol,
          name
        }))
      } catch (error) {
        console.error(`Error fetching metadata for token ${address}:`, error)
      }
    }

    fetchMetadata()
  }, [library, address])

  return metadata
}

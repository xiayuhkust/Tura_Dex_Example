import { useState, useEffect } from 'react'

interface Token {
  address: string
  symbol: string
  name: string
  balance?: string
  logoURI?: string
  lastUsed?: number
  price?: string
  priceChange24h?: string
}

const RECENT_TOKENS_KEY = 'agentswap:recent_tokens'
const MAX_RECENT_TOKENS = 5

export function useRecentTokens() {
  const [recentTokens, setRecentTokens] = useState<Token[]>([])

  useEffect(() => {
    // Load recent tokens from localStorage on mount
    const stored = localStorage.getItem(RECENT_TOKENS_KEY)
    if (stored) {
      try {
        setRecentTokens(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse recent tokens:', error)
      }
    }
  }, [])

  const addRecentToken = (token: Token) => {
    setRecentTokens(current => {
      // Remove existing entry of the same token if present
      const filtered = current.filter(t => t.address !== token.address)
      
      // Add new token to the beginning
      const updated = [token, ...filtered].slice(0, MAX_RECENT_TOKENS)
      
      // Save to localStorage
      localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(updated))
      
      return updated
    })
  }

  return { recentTokens, addRecentToken }
}

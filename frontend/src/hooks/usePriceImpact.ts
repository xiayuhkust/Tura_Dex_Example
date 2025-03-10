import { useMemo } from 'react'
import type { Token } from '../types/Token'

interface Warning {
  level: 'error' | 'warning' | 'info'
  message: string
}

export function usePriceImpact(
  inputToken: Token | undefined,
  outputToken: Token | undefined,
  inputAmount: string,
  outputAmount: string
): { priceImpact: number; warning: Warning | null } {
  return useMemo(() => {
    if (!inputToken?.price || !outputToken?.price || !inputAmount || !outputAmount) {
      return {
        priceImpact: 0,
        warning: null
      }
    }

    try {
      const inputPrice = parseFloat(inputToken.price)
      const outputPrice = parseFloat(outputToken.price)
      const input = parseFloat(inputAmount)
      const output = parseFloat(outputAmount)

      // Calculate expected output based on market price
      const expectedOutput = (input * inputPrice) / outputPrice
      
      // Calculate price impact
      const priceImpact = ((expectedOutput - output) / expectedOutput) * 100

      // Determine warning level
      let warning = null
      if (priceImpact > 15) {
        warning = {
          level: 'error' as const,
          message: 'Price impact too high'
        }
      } else if (priceImpact > 5) {
        warning = {
          level: 'warning' as const,
          message: 'High price impact'
        }
      } else if (priceImpact > 3) {
        warning = {
          level: 'info' as const,
          message: 'Notable price impact'
        }
      }

      return {
        priceImpact,
        warning
      }
    } catch (error) {
      console.error('Error calculating price impact:', error)
      return {
        priceImpact: 0,
        warning: null
      }
    }
  }, [inputToken, outputToken, inputAmount, outputAmount])
}

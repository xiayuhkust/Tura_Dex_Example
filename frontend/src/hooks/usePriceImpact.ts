import { useMemo } from 'react'
interface Token {
  address: string
  symbol: string
  name: string
  balance?: string
  price?: string
}

export function usePriceImpact(
  inputToken: Token | undefined,
  outputToken: Token | undefined,
  inputAmount: string,
  outputAmount: string
) {
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
          level: 'error',
          message: 'Price impact too high'
        }
      } else if (priceImpact > 5) {
        warning = {
          level: 'warning',
          message: 'High price impact'
        }
      } else if (priceImpact > 3) {
        warning = {
          level: 'info',
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

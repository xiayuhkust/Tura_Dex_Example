import { ethers } from 'ethers'
import type { Token } from '../types/Token'

/**
 * Safely parse a token amount string to BigNumber
 */
export function parseTokenAmount(amount: string): ethers.BigNumber {
  try {
    // Ensure amount is a valid number
    if (!isValidNumber(amount)) {
      throw new Error('Invalid amount')
    }
    // Always use 18 decimals for ERC20 tokens
    const decimals = 18
    return ethers.utils.parseUnits(amount, decimals)
  } catch (error) {
    console.error('Error parsing token amount:', error)
    throw new Error('Failed to parse token amount. Please enter a valid number.')
  }
}

/**
 * Format a BigNumber token amount to string
 */
export function formatTokenAmount(amount: ethers.BigNumber, token: Token): string {
  try {
    return ethers.utils.formatUnits(amount, token.decimals)
  } catch (error) {
    console.error('Error formatting token amount:', error)
    return '0.0'
  }
}

/**
 * Format a fee amount to percentage string
 */
export function formatFeeAmount(fee: number): string {
  switch (fee) {
    case 500: return '0.05%'
    case 3000: return '0.3%'
    case 10000: return '1%'
    default: return `${fee/10000}%`
  }
}

/**
 * Check if a string is a valid number
 */
export function isValidNumber(value: string): boolean {
  if (!value) return false
  const num = Number(value)
  return !isNaN(num) && num >= 0
}

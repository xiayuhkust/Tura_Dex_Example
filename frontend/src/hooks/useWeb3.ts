import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useToast } from '@chakra-ui/react'
import type { UseToastOptions } from '@chakra-ui/react'
import { useCallback, useEffect } from 'react'
import * as React from 'react'
import { MetaMaskToast } from '../components'

declare global {
  interface Window {
    ethereum?: any
  }
}

const CHAIN_ID = Number(import.meta.env.VITE_TURA_CHAIN_ID || "1337")
const NETWORK_NAME = 'Tura Network'

export const injected = new InjectedConnector({
  supportedChainIds: [CHAIN_ID]
})

export function useWeb3() {
  const { active, account, library, connector, activate, deactivate, error: web3Error } = useWeb3React()
  const toast = useToast()

  // Handle connection errors
  useEffect(() => {
    if (web3Error) {
      toast({
        title: 'Connection Error',
        description: web3Error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [web3Error, toast])

  // Auto-connect if previously connected
  useEffect(() => {
    if (!active && localStorage.getItem('shouldConnectWallet') === 'true') {
      connect()
    }
  }, [active])

  const connect = useCallback(async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        const toastOptions: UseToastOptions = {
          title: 'MetaMask Required',
          description: 'Please install MetaMask to connect your wallet. Visit metamask.io to get started.',
          status: 'warning',
          duration: null,
          isClosable: true,
          position: 'top',
          render: function ToastContent({ onClose }) {
            return React.createElement(MetaMaskToast, { onClose })
          }
        }
        toast(toastOptions)
        return
      }

      await activate(injected)
      localStorage.setItem('shouldConnectWallet', 'true')
      
      // Check if connected to the correct network
      const provider = await injected.getProvider()
      const chainId = await provider.request({ method: 'eth_chainId' })
      
      if (Number(chainId) !== CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            toast({
              title: 'Network Not Found',
              description: `Please add ${NETWORK_NAME} to your wallet`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            })
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Connect',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Failed to connect:', error)
    }
  }, [activate, toast])

  const disconnect = useCallback(async () => {
    try {
      deactivate()
      localStorage.removeItem('shouldConnectWallet')
    } catch (error: any) {
      toast({
        title: 'Failed to Disconnect',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Failed to disconnect:', error)
    }
  }, [deactivate, toast])

  return { active, account, library, connector, connect, disconnect }
}

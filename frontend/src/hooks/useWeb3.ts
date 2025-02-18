import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'

const CHAIN_ID = Number(import.meta.env.VITE_TURA_CHAIN_ID || "1337")

export const injected = new InjectedConnector({
  supportedChainIds: [CHAIN_ID]
})

export function useWeb3() {
  const { active, account, library, connector, activate, deactivate } = useWeb3React()

  async function connect() {
    try {
      await activate(injected)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  async function disconnect() {
    try {
      deactivate()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  return { active, account, library, connector, connect, disconnect }
}

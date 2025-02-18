import { ChakraProvider } from '@chakra-ui/react'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { theme } from './theme/index'
import { SwapInterface, ErrorBoundary } from './components'

function getLibrary(provider: any) {
  return new ethers.providers.Web3Provider(provider)
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ErrorBoundary>
          <SwapInterface />
        </ErrorBoundary>
      </Web3ReactProvider>
    </ChakraProvider>
  )
}

export default App

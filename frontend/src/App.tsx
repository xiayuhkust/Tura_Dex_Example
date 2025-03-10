import { ChakraProvider } from '@chakra-ui/react'
import { Web3ReactProvider } from '@web3-react/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ethers } from 'ethers'
import { theme } from './theme'
import { ErrorBoundary, NavigationBar } from './components'
import { SwapPage } from './pages/SwapPage'
import { LiquidityPage } from './pages/LiquidityPage'
import PoolDetailPage from './pages/pool/[address]'
import PoolsPage from './pages/pools'

function getLibrary(provider: any) {
  return new ethers.providers.Web3Provider(provider)
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <BrowserRouter>
          <ErrorBoundary>
            <NavigationBar />
            <Routes>
              <Route path="/" element={<SwapPage />} />
              <Route path="/liquidity" element={<LiquidityPage />} />
              <Route path="/pools" element={<PoolsPage />} />
              <Route path="/pool/:address" element={<PoolDetailPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </Web3ReactProvider>
    </ChakraProvider>
  )
}

export default App

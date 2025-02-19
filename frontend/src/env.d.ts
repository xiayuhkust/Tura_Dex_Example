/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURA_RPC_URL: string
  readonly VITE_TURA_CHAIN_ID: string
  readonly VITE_WETH_ADDRESS: string
  readonly VITE_FACTORY_ADDRESS: string
  readonly VITE_TT1_ADDRESS: string
  readonly VITE_TT2_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

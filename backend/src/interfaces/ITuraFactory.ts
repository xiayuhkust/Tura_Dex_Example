export interface ITuraFactory {
    getPool(tokenA: string, tokenB: string, fee: number): Promise<string>;
    feeAmountEnabled(fee: number): Promise<boolean>;
    getAllPools(): Promise<string[]>;
}

export interface IPool {
    slot0(): Promise<{
        sqrtPriceX96: bigint;
        tick: number;
        observationIndex: number;
        observationCardinality: number;
        observationCardinalityNext: number;
        feeProtocol: number;
        unlocked: boolean;
    }>;
    token0(): Promise<string>;
    token1(): Promise<string>;
    fee(): Promise<number>;
    liquidity(): Promise<bigint>;
}

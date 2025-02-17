import { ethers } from 'ethers';
import { ITuraFactory, IPool } from '../interfaces/ITuraFactory';

export class PriceOracle {
    private readonly provider: ethers.Provider;
    private readonly factoryAddress: string;

    constructor(rpcUrl: string, factoryAddress: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.factoryAddress = factoryAddress;
    }

    async getPrice(tokenA: string, tokenB: string, fee: number): Promise<{
        price: number;
        timestamp: number;
    }> {
        const factory = new ethers.Contract(this.factoryAddress, [
            'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)'
        ], this.provider) as unknown as ITuraFactory;
        
        const poolAddress = await factory.getPool(tokenA, tokenB, fee);

        if (poolAddress === ethers.ZeroAddress) {
            throw new Error('Pool does not exist');
        }

        const pool = new ethers.Contract(poolAddress, [
            'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
        ], this.provider) as unknown as IPool;
        const slot0 = await pool.slot0();

        return {
            price: parseFloat(ethers.formatUnits(slot0.sqrtPriceX96, 96)) ** 2,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }

    async getTWAP(tokenA: string, tokenB: string, fee: number, period: number): Promise<number> {
        // To be implemented when Pool contract is complete
        throw new Error('Not implemented');
    }
}

import { ethers } from 'ethers';
import { ITuraFactory, IPool } from '../interfaces/ITuraFactory';

export class EventListener {
    private readonly provider: ethers.Provider;
    private readonly factoryAddress: string;

    constructor(rpcUrl: string, factoryAddress: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.factoryAddress = factoryAddress;
    }

    async startListening(callback: (event: any) => void) {
        const factory = new ethers.Contract(this.factoryAddress, [
            'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool)'
        ], this.provider);

        // Listen for new pool creation
        factory.on('PoolCreated', (token0: string, token1: string, fee: number, pool: string, event: ethers.EventLog) => {
            callback({
                type: 'PoolCreated',
                token0,
                token1,
                fee,
                pool,
                blockNumber: event.blockNumber,
                timestamp: Math.floor(Date.now() / 1000)
            });
        });

        // Additional event listeners will be added when Pool contract is complete
    }

    async getPastEvents(fromBlock: number, toBlock: number) {
        const factory = new ethers.Contract(this.factoryAddress, [
            'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool)'
        ], this.provider);
        
        const filter = factory.filters.PoolCreated();
        const events = await factory.queryFilter(filter, fromBlock, toBlock);

        return events.map((event) => {
            const log = event as ethers.EventLog;
            return {
                type: 'PoolCreated',
                token0: log.topics[1],
                token1: log.topics[2],
                fee: parseInt(log.topics[3]),
                pool: log.data,
                blockNumber: log.blockNumber,
                timestamp: Math.floor(Date.now() / 1000)
            };
        });
    }
}

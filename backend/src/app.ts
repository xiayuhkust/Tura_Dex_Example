import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { PriceOracle } from './services/PriceOracle';
import { EventListener } from './services/EventListener';

const app = express();
app.use(cors());
app.use(express.json());

const TURA_RPC = 'http://43.135.26.222:8000';
const FACTORY_ADDRESS = '0x7A7bbc265b2CaD0a22ddCE2Db5539394b9843888';

const priceOracle = new PriceOracle(TURA_RPC, FACTORY_ADDRESS);
const eventListener = new EventListener(TURA_RPC, FACTORY_ADDRESS);

// Price endpoints
app.get('/api/price', async (req, res) => {
    try {
        const { tokenA, tokenB, fee } = req.query;
        if (!tokenA || !tokenB || !fee) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const price = await priceOracle.getPrice(
            tokenA as string,
            tokenB as string,
            parseInt(fee as string)
        );
        res.json(price);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Pool events endpoints
app.get('/api/pools', async (req, res) => {
    try {
        const { fromBlock, toBlock } = req.query;
        const events = await eventListener.getPastEvents(
            parseInt(fromBlock as string || '0'),
            parseInt(toBlock as string || 'latest')
        );
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    eventListener.startListening((event) => {
        console.log('New event:', event);
    });
});

export default app;

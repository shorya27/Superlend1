# Aave Stats API

This Express.js application provides an API to fetch and calculate key statistics for users of the Aave DeFi protocol.

## Features

- Fetch total supplied assets in USD
- Fetch total borrowed assets in USD
- Calculate the health factor
- Calculate net APY (Annual Percentage Yield)

## How It Works

This application uses the Aave SDK to fetch data for supplied and borrowed assets, and calculates the health factor and net APY based on the user's Ethereum address.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aave-stats-api.git
   cd aave-stats-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Development

To run the server in development mode:
```bash
npm run dev
```

This will enable hot reloading for easier development.

## API Endpoints

### Get User Stats

**Endpoint:** `GET /user-stats/:address`

**Parameters:**
- `address`: Ethereum address of the user

**Example Response:**
```json
{
  "totalSuppliedUSD": "1000.00",
  "totalBorrowedUSD": "500.00",
  "healthFactor": "2.00",
  "netAPY": "3.50%"
}
```

## Dependencies

- [express](https://www.npmjs.com/package/express)
- [ethers](https://www.npmjs.com/package/ethers)
- [dayjs](https://www.npmjs.com/package/dayjs)
- [@aave/contract-helpers](https://www.npmjs.com/package/@aave/contract-helpers)
- [@aave/math-utils](https://www.npmjs.com/package/@aave/math-utils)
- [@bgd-labs/aave-address-book](https://www.npmjs.com/package/@bgd-labs/aave-address-book)
- [dotenv](https://www.npmjs.com/package/dotenv)

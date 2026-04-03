# Terminal 1: Start the test databases
npm run docker-test-up

# Terminal 2: Start DataBeacon + Facto (stays running)
npm run dev

# Terminal 3: Seed all the data (one-shot, then you're done)
npm run dev-seed

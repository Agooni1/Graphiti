# Graphiti - Transaction Visualizer & NFT minting

Turn any Ethereum address into a 3D visualization of its transaction history, then mint it as an NFT. (Crappy gif below)

![Graphiti demo](./packages/nextjs/public//graph-orbit.gif)

## What it does

Paste in any Ethereum address and watch its transaction history form a network of nodes and links in 3D space. Switch between layouts (shell, force-directed, fibonacci), tweak particle effects, and explore with full camera control.

Click on the nodes and explore those addresses.

If it’s your address, mint the entire graph as an NFT—preserving layout, effects, and camera view on-chain.

## The build process

Started with Scaffold-ETH 2 after completing SRE/buidlguild batch. Used Challenge-0 as a template for the minting contract/ ipfs upload logic. What started as a Solidity project quickly turned into a React/Three.js challenge - learning scene graphs, materials, and why nodes kept floating in random places.

Transaction data comes from Alchemy's API. Had to figure out efficient batching since some wallets have thousands of transactions. The graph algorithms took forever - shell layout uses concentric circles based on volume, force-directed uses physics simulation.

Multi-chain support came later. Started with just localhost (obviously), added Sepolia for testing, then Arbitrum because L2s are cheaper. Base and Mainnet might be added if this gets more than 1 user.

## What I learned (the hard stuff)

**ECDSA signatures** – Built a two-step verification system with message signing, backend validation, and signature-based minting. Learned the inner workings of public key recovery and signature security.

**Chain switching** - Users would select a network but their wallet would be elsewhere. Built syncing with wagmi's `useSwitchChain`, added debounced warnings so it doesn't flash annoyingly during switches.

**3D performance** - WebGL optimization, efficient re-renders, lazy loading components. Learning that React state management gets messy fast when you have real-time 3D, blockchain data, and UI controls all updating together.

**Smart contract design** - Dynamic pricing based on user activity, IPFS metadata storage, nonce-based replay protection. Gas optimization for deployment.

*[Photo suggestion: Minting interface showing wallet signature prompt]*

## Tech stack

- **Frontend**: Next.js, TypeScript, Three.js, React Three Fiber
- **Blockchain**: Scaffold-ETH 2, Wagmi, RainbowKit
- **Data**: Alchemy API, IPFS for metadata
- **Deploy**: Vercel frontend, contracts on Sepolia & Arbitrum

## Networks supported

| Network | Minting | Graph |
|---------|---------|---------------|
| Sepolia | ✅ | ✅ |
| Arbitrum | ✅ | ✅ |
| Ethereum | ❌ | ✅ |
| Base | ❌ | ✅ |

---
Built by me trying to learn. Feedback, issues, and especially contract vulnerabilites welcome


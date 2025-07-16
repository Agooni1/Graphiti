# Graphiti - Transaction Visualizer & NFT minting

Turn any Ethereum address into a 3D visualization of its transaction history, then mint it as an NFT. (Crappy gif below)

![Graphiti demo](./packages/nextjs/public//graph-orbit.gif)

## What it does

Drop in any Ethereum address to see its transactions mapped in 3D. Toggle layouts, add effects, orbit around.

You can click on nodes to explore connected addresses.

If it’s your address, mint the entire graph as an NFT, preserving layout, effects, and camera view on-chain.

## The build process

Started with Scaffold-ETH 2 after doing a buidlguild batch. Used Challenge-0 and NFT contracts like Elemental Beans from opensea as a template for the minting contract/ ipfs upload /ECDSA signing logic. 

This started as a project to develop my solidity skills but kinda spiraled into a React/Three.js challenge - learning scene graphs, materials, and why nodes kept floating in random places.

Transaction data comes from Alchemy's API. Had to figure out efficient batching since some wallets have thousands of transactions. The graph algorithms took way too long.

Also have some multi-chain support. Started with just localhost (obviously), added Sepolia then Arbitrum (mainly because I already had some ETH from the buidlguidl batch 😁). Base and Mainnet might be added if this gets more than 1 user.

## What I learned

**ECDSA signatures** – Built a two-step verification system with message signing, backend validation, and signature-based minting. This allowed the minting function to be public, whith the front-end acting as an authorized signer, ensuring minting only happened through this site. Learned the inner workings of public key recovery and signature security.

**Chain switching** - Users would select a network but their wallet would be elsewhere. Built syncing with wagmi's `useSwitchChain`, added debounced warnings so it doesn't flash annoyingly during switches.

**3D performance** - WebGL optimization, efficient re-renders, lazy loading components. Learning that React state management gets messy fast when you have real-time 3D, blockchain data, and UI controls all updating together.

**Smart contract design** - Dynamic pricing based on user activity, IPFS metadata storage, nonce-based replay protection. Gas optimization for deployment.

## Networks supported

| Network | Minting | Graph |
|---------|---------|---------------|
| Sepolia | ✅ | ✅ |
| Arbitrum | ✅ | ✅ |
| Ethereum | ❌ | ✅ |
| Base | ❌ | ✅ |

---
Built by me trying to learn. Feedback, issues, and especially contract vulnerabilites welcome


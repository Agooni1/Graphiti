import { Network } from "alchemy-sdk";

export const getAlchemy = async () => {
  const { Alchemy } = await import("alchemy-sdk");

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY || "Sj3FWFimpiaaBKnAkUlsnjktExNXYVZR", // or hardcode for now
    network: Network.ETH_SEPOLIA, // or whichever you're using
  };

  const alchemy = new Alchemy(config);
  return alchemy;
};
// let alchemy: any = null;

// export const getAlchemy = async () => {
//   const { Alchemy, Network } = await import("alchemy-sdk");
//   const config = {
//     apiKey: "Sj3FWFimpiaaBKnAkUlsnjktExNXYVZR",
//     network: Network.ETH_SEPOLIA,
//   };

//   if (!alchemy) {
//     alchemy = new Alchemy(config);
//   }
//   return alchemy;
// };

// Configures the Alchemy SDK

// Imports the Alchemy SDK
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "Sj3FWFimpiaaBKnAkUlsnjktExNXYVZR", // Replace with your API key
  network: Network.ETH_SEPOLIA, // Replace with your network
};

// Creates an Alchemy object instance with the config to use for making requests
export const alchemy = new Alchemy(config);


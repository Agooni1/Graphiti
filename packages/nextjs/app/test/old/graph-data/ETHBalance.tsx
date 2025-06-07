import { alchemy } from "~~/app/lib/alchemy";

export const getETHBalance = async (address: string): Promise<string> => {
  try {
    const rawBalance = await alchemy.core.getBalance(address);
    const eth = Number(rawBalance) / 1e18;
    return eth.toFixed(4);
  } catch (err) {
    console.error("Failed to fetch ETH balance:", err);
    return "Error";
  }
};
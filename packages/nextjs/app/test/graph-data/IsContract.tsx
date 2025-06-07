// "use client";
import { alchemy } from "~~/app/lib/alchemy";

export const isContract = async (address: string): Promise<boolean> => {
  try {
    const bytecode = await alchemy.core.getCode(address);
    return bytecode !== "0x";
  } catch (err) {
    console.error("Failed to check contract status:", err);
    return false;
  }
};
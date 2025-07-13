interface AffordabilityParams {
  userAddress: string;
  balance: bigint;
  contractAddress: string;
  mintPrice: string;
}

/**
 * Simple affordability check for development/testnet/L2
 * 
 * @description Separated for future mainnet gas estimation (similar to MetaMask).
 * Prevents unnecessary IPFS uploads when transactions would fail due to insufficient funds.
 * 
 * @param {Object} params - The affordability parameters
 * @param {bigint} params.balance - User's current ETH balance in wei
 * @param {string} params.mintPrice - NFT mint price in wei as string
 * @returns {Promise<boolean>} true if user has sufficient balance
 * @throws {Error} When balance or mint price validation fails
 */
export async function canAffordMinting({
  balance,
  mintPrice
}: AffordabilityParams): Promise<boolean> {
  try {
    const mintPriceBigInt = BigInt(mintPrice);
    
    // Simple check: balance must be greater than mint price
    // For testnets and L2s like Arbitrum, gas costs are very low
    const hasEnoughBalance = balance > mintPriceBigInt;
    
    return hasEnoughBalance;
  } catch (error) {
    console.error("Error checking affordability:", error);
    return false;
  }
}
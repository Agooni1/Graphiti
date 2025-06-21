import { alchemy } from "~~/app/lib/alchemy";

interface AffordabilityParams {
  userAddress: string;
  balance: bigint;
  contractAddress: string;
  mintPrice: string;
}

/**
 * Check if user can afford gas + mint price
 * @param params - Object containing all parameters
 * @param params.userAddress - User's wallet address
 * @param params.balance - User's balance as bigint (from wagmi)
 * @param params.contractAddress - NFT contract address
 * @param params.mintPrice - Price to mint in wei (as string)
 * @returns Promise<boolean> - true if user can afford it
 * @dev Simplified version for localhost development
 */
export async function canAffordMinting({
  userAddress,
  balance,
  contractAddress,
  mintPrice
}: AffordabilityParams): Promise<boolean> {
  return true; // Always return true for localhost mode
  try {
  //   console.log("=== Affordability Check (Localhost Mode) ===");
  //   console.log("User balance (wei):", balance.toString());
  //   console.log("Mint price (wei):", mintPrice);

    // Convert mint price to bigint
    const mintPriceBigInt = BigInt(mintPrice);
    
    // Early check: if balance is less than mint price, no point estimating gas
    if (balance < mintPriceBigInt) {
      // console.log("❌ Balance insufficient for mint price alone");
      return false;
    }

    // LOCALHOST SIMPLIFIED VERSION - Use placeholder values
    const gasEstimateBigInt = 150000n; // Typical NFT mint gas estimate
    const gasPriceBigInt = 20000000000n; // 20 gwei gas price
    
    // console.log("Gas estimate (placeholder):", gasEstimateBigInt.toString());
    // console.log("Gas price (placeholder):", gasPriceBigInt.toString());

    // Calculate gas cost using bigint operations
    const gasCost = gasEstimateBigInt * gasPriceBigInt;
    // console.log("Gas cost (wei):", gasCost.toString());
    
    // Add 20% safety buffer using bigint math
    const gasCostWithBuffer = (gasCost * 120n) / 100n;
    // console.log("Gas cost with buffer (wei):", gasCostWithBuffer.toString());
    
    // Calculate total cost
    const totalCost = gasCostWithBuffer + mintPriceBigInt;
    // console.log("Total cost (wei):", totalCost.toString());
    
    const canAfford = balance >= totalCost;
    // console.log("Can afford:", canAfford);
    // console.log("=== End Check ===");
    
    // return canAfford;

    /* ORIGINAL ALCHEMY VERSION - COMMENTED OUT FOR LOCALHOST
    // Estimate gas (returns BigNumber, convert to bigint)
    const gasEstimate = await alchemy.core.estimateGas({
      from: userAddress,
      to: contractAddress,
      value: mintPrice,
    });
    const gasEstimateBigInt = BigInt(gasEstimate.toString());
    console.log("Gas estimate:", gasEstimateBigInt.toString());
    
    // Get current gas price (returns BigNumber, convert to bigint)
    const gasPrice = await alchemy.core.getGasPrice();
    const gasPriceBigInt = BigInt(gasPrice.toString());
    console.log("Gas price (wei):", gasPriceBigInt.toString());

    // Calculate gas cost using bigint operations
    const gasCost = gasEstimateBigInt * gasPriceBigInt;
    console.log("Gas cost (wei):", gasCost.toString());
    
    // Add 20% safety buffer using bigint math
    const gasCostWithBuffer = (gasCost * 120n) / 100n;
    console.log("Gas cost with buffer (wei):", gasCostWithBuffer.toString());
    
    // Calculate total cost
    const totalCost = gasCostWithBuffer + mintPriceBigInt;
    console.log("Total cost (wei):", totalCost.toString());
    
    const canAfford = balance >= totalCost;
    console.log("Can afford:", canAfford);
    console.log("=== End Check ===");
    
    return canAfford;
    */
  } catch (error) {
    // console.error("Error checking affordability:", error);
    return false; // Err on the side of caution
  }
}
export async function getSignature(
  ipfsHash: string,
  userAddress: string,
  currentNonce: number,
): Promise<`0x${string}`> {
  const response = await fetch("/api/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ipfsHash,
      userAddress: userAddress,
      currentNonce: currentNonce,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get signature");
  }

  const { signature } = await response.json();
  // console.log("Frontend received signature:", signature);
  // console.log("Frontend signature length:", signature.length);

  // Validate and ensure proper hex format
  if (!signature || typeof signature !== "string") {
    throw new Error("Invalid signature received from server");
  }

  // Ensure it starts with 0x and has correct length (132 characters total)
  if (!signature.startsWith("0x") || signature.length !== 132) {
    throw new Error(`Invalid signature format: ${signature}`);
  }

  return signature as `0x${string}`;
}

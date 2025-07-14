// /app/api/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Wallet, getBytes, solidityPackedKeccak256 } from "ethers";

const signer = new Wallet(process.env.SIGNING_PRIVATE_KEY!);

console.log("Signer address:", signer.address);

export async function POST(req: NextRequest) {
  const { ipfsHash, userAddress, currentNonce } = await req.json();

  if (!ipfsHash || typeof ipfsHash !== "string") {
    return NextResponse.json({ error: "Missing or invalid IPFS hash" }, { status: 400 });
  }

  if (!userAddress || typeof userAddress !== "string") {
    return NextResponse.json({ error: "Missing or invalid user address" }, { status: 400 });
  }

  if (currentNonce === undefined || typeof currentNonce !== "number") {
    return NextResponse.json({ error: "Missing or invalid nonce" }, { status: 400 });
  }

  // Fetch and validate IPFS content
  try {
    const ipfsResponse = await fetch(`https://aqua-nearby-barracuda-607.mypinata.cloud/ipfs/${ipfsHash}`);
    if (!ipfsResponse.ok) {
      return NextResponse.json({ error: "Invalid IPFS hash - content not accessible" }, { status: 400 });
    }

    const metadata = await ipfsResponse.json();

    // Validate the metadata belongs to this user
    if (!validateUserMetadata(metadata, userAddress)) {
      return NextResponse.json({ error: "IPFS content does not belong to this address" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to validate IPFS content" }, { status: 400 });
  }

  // Create the same hash as the contract: keccak256(abi.encodePacked(_ipfsHash, msg.sender, _nonce))
  const messageHash = solidityPackedKeccak256(
    ["string", "address", "uint256"],
    [ipfsHash, userAddress, currentNonce + 2],
  );

  console.log("Backend - IPFS Hash:", ipfsHash);
  console.log("Backend - User Address:", userAddress.toLowerCase());
  console.log("Backend - Nonce:", currentNonce);
  console.log("Backend - Message Hash:", messageHash);

  // Convert hash to Uint8Array for signMessage
  const messageHashBytes = getBytes(messageHash);

  // Sign the hash bytes
  const signature = await signer.signMessage(messageHashBytes);

  console.log("Backend - Signature:", signature);
  console.log("Backend - Signature length:", signature.length);

  return NextResponse.json({
    signature: signature,
  });
}

function validateUserMetadata(metadata: any, userAddress: string): boolean {
  // Check if metadata contains the user's address
  if (metadata.targetAddress?.toLowerCase() !== userAddress.toLowerCase()) {
    return false;
  }

  // Additional validations
  if (!metadata.nodes || !Array.isArray(metadata.nodes)) {
    return false;
  }

  // Validate graph data structure
  if (!metadata.graphData || !metadata.graphData.nodes) {
    return false;
  }

  return true;
}

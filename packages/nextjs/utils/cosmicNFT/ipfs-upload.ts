const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

// Upload File (GIF, PNG, etc.) to IPFS
export async function uploadFileToIPFS(file: File): Promise<string> {
  console.log("📤 Uploading file to Pinata...", file.name);
  
  if (!PINATA_JWT) {
    console.warn("🚧 Using mock file upload - No Pinata JWT found");
    const mockHash = "QmFile" + Math.random().toString(36).substring(2, 15);
    console.log("📦 Mock file hash:", mockHash);
    return mockHash;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'cosmic-nft-image',
        fileType: file.type,
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ File uploaded to IPFS:", result.IpfsHash);

    return result.IpfsHash;

  } catch (error) {
    console.error("File upload error:", error);
    
    if (error instanceof Error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    throw new Error("File upload failed: Unknown error");
  }
}

// Upload JSON metadata to IPFS
export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  console.log("📤 Uploading metadata to Pinata...");
  
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    console.warn("🚧 Using mock metadata upload - No Pinata credentials found");
    const mockHash = "QmMeta" + Math.random().toString(36).substring(2, 15);
    console.log("📦 Mock metadata hash:", mockHash);
    return mockHash;
  }

  try {
    // Method 1: Using JWT (Recommended)
    if (PINATA_JWT) {
      return await uploadMetadataWithJWT(metadata);
    }
    
    // Method 2: Using API Key + Secret (Legacy)
    if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      return await uploadMetadataWithAPIKey(metadata);
    }

    throw new Error("No valid Pinata credentials provided");

  } catch (error) {
    console.error("Metadata upload error:", error);
    
    if (error instanceof Error) {
      throw new Error(`Metadata upload failed: ${error.message}`);
    }
    throw new Error("Metadata upload failed: Unknown error");
  }
}

// Helper: Upload metadata using JWT (Pinata's new method)
async function uploadMetadataWithJWT(metadata: any): Promise<string> {
  const metadataFormData = new FormData();
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  metadataFormData.append('file', metadataBlob, 'metadata.json');

  const pinataMetadata = JSON.stringify({
    name: 'cosmic-graph-metadata.json',
    keyvalues: {
      type: 'cosmic-nft-metadata',
      targetAddress: metadata.attributes?.find((attr: any) => attr.trait_type === "Target Address")?.value || 'unknown',
      timestamp: new Date().toISOString()
    }
  });
  metadataFormData.append('pinataMetadata', pinataMetadata);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: metadataFormData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Metadata upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Metadata uploaded to IPFS:", result.IpfsHash);

  return result.IpfsHash;
}

// Helper: Upload metadata using API Key + Secret (Legacy method)
async function uploadMetadataWithAPIKey(metadata: any): Promise<string> {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY!,
      'pinata_secret_api_key': PINATA_SECRET_KEY!,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: 'cosmic-graph-metadata.json',
        keyvalues: {
          type: 'cosmic-nft-metadata',
          targetAddress: metadata.attributes?.find((attr: any) => attr.trait_type === "Target Address")?.value || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Metadata upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Metadata uploaded to IPFS:", result.IpfsHash);

  return result.IpfsHash;
}
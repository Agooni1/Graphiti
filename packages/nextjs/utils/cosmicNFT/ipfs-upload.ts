const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export async function uploadToIPFS(svgContent: string, metadata: any): Promise<string> {
  // Check if we have Pinata credentials
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    console.warn("🚧 Using mock IPFS upload for testing - No Pinata credentials found");
    const mockHash = "QmYx" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("📦 Mock IPFS hash:", mockHash);
    return mockHash;
  }

  try {
    console.log("📤 Uploading SVG to Pinata..."); 

    // Method 1: Using JWT (Recommended)
    if (PINATA_JWT) {
      return await uploadWithJWT(svgContent, metadata);
    }
    
    // Method 2: Using API Key + Secret (Legacy)
    if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      return await uploadWithAPIKey(svgContent, metadata);
    }

    throw new Error("No valid Pinata credentials provided");

  } catch (error) {
    console.error("Pinata upload error:", error);
    
    if (error instanceof Error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
    throw new Error("IPFS upload failed: Unknown error");
  }
}

// Upload using JWT (Pinata's new method)
async function uploadWithJWT(svgContent: string, metadata: any): Promise<string> {
  // Step 1: Upload SVG image
  const imageFormData = new FormData();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  imageFormData.append('file', svgBlob, 'cosmic-graph.svg');
  
  // Optional: Add metadata for the file
  const pinataMetadata = JSON.stringify({
    name: 'cosmic-graph.svg',
    keyvalues: {
      type: 'cosmic-nft-image'
    }
  });
  imageFormData.append('pinataMetadata', pinataMetadata);

  const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: imageFormData,
  });

  if (!imageResponse.ok) {
    const errorText = await imageResponse.text();
    throw new Error(`Image upload failed: ${imageResponse.status} - ${errorText}`);
  }

  const imageResult = await imageResponse.json();
  const imageCID = imageResult.IpfsHash;
  console.log("✅ Image uploaded to IPFS:", imageCID);

  // Step 2: Create and upload metadata
  const fullMetadata = {
    ...metadata,
    image: `ipfs://${imageCID}`,
    animation_url: `ipfs://${imageCID}`,
  };

  const metadataFormData = new FormData();
  const metadataBlob = new Blob([JSON.stringify(fullMetadata, null, 2)], { type: 'application/json' });
  metadataFormData.append('file', metadataBlob, 'metadata.json');

  const metadataPinataMetadata = JSON.stringify({
    name: 'cosmic-graph-metadata.json',
    keyvalues: {
      type: 'cosmic-nft-metadata',
      targetAddress: metadata.cosmic_data?.target_address || 'unknown'
    }
  });
  metadataFormData.append('pinataMetadata', metadataPinataMetadata);

  const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: metadataFormData,
  });

  if (!metadataResponse.ok) {
    const errorText = await metadataResponse.text();
    throw new Error(`Metadata upload failed: ${metadataResponse.status} - ${errorText}`);
  }

  const metadataResult = await metadataResponse.json();
  console.log("✅ Metadata uploaded to IPFS:", metadataResult.IpfsHash);

  return metadataResult.IpfsHash;
}

// Upload using API Key + Secret (Legacy method)
async function uploadWithAPIKey(svgContent: string, metadata: any): Promise<string> {
  // Step 1: Upload SVG image
  const imageFormData = new FormData();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
  imageFormData.append('file', svgBlob, 'cosmic-graph.svg');

  const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY!,
      'pinata_secret_api_key': PINATA_SECRET_KEY!,
    },
    body: imageFormData,
  });

  if (!imageResponse.ok) {
    const errorText = await imageResponse.text();
    throw new Error(`Image upload failed: ${imageResponse.status} - ${errorText}`);
  }

  const imageResult = await imageResponse.json();
  const imageCID = imageResult.IpfsHash;
  console.log("✅ Image uploaded to IPFS:", imageCID);

  // Step 2: Create and upload metadata
  const fullMetadata = {
    ...metadata,
    image: `ipfs://${imageCID}`,
    animation_url: `ipfs://${imageCID}`,
  };

  const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY!,
      'pinata_secret_api_key': PINATA_SECRET_KEY!,
    },
    body: JSON.stringify({
      pinataContent: fullMetadata,
      pinataMetadata: {
        name: 'cosmic-graph-metadata.json',
        keyvalues: {
          type: 'cosmic-nft-metadata',
          targetAddress: metadata.cosmic_data?.target_address || 'unknown'
        }
      }
    }),
  });

  if (!metadataResponse.ok) {
    const errorText = await metadataResponse.text();
    throw new Error(`Metadata upload failed: ${metadataResponse.status} - ${errorText}`);
  }

  const metadataResult = await metadataResponse.json();
  console.log("✅ Metadata uploaded to IPFS:", metadataResult.IpfsHash);

  return metadataResult.IpfsHash;
}
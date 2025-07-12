const fetchFromIPFS = async (ipfsHashOrUrl: string) => {
  // Extract hash if it's a full URL, otherwise use as-is
  let hash = ipfsHashOrUrl;
  if (ipfsHashOrUrl.includes('/ipfs/')) {
    hash = ipfsHashOrUrl.split('/ipfs/').pop() || ipfsHashOrUrl;
  }

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://ipfs.io/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
  ];

  for (const gateway of gateways) {
    try {
      // console.log(`🔍 Trying gateway: ${gateway}`);
      const response = await fetch(gateway);
      if (response.ok) {
        const data = await response.json();
        // console.log(`✅ Success from ${gateway}`);
        return data;
      }
    } catch (error) {
      console.error(`❌ Failed to fetch from ${gateway}:`, error);
      continue;
    }
  }

  throw new Error('Failed to fetch from all IPFS gateways');
};

// Updated to use server-side API route
export const addToIPFS = async (yourJSON: object) => {
  // console.log("📤 Adding JSON to IPFS via server...");
  
  const response = await fetch('/api/ipfs/upload-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metadata: yourJSON }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'JSON upload failed');
  }

  const result = await response.json();
  // console.log("✅ JSON uploaded to IPFS:", result.hash);
  
  // Return in the same format as the original Pinata response
  return { IpfsHash: result.hash };
};

export const getMetadataFromIPFS = async (ipfsHash: string) => {
  try {
    return await fetchFromIPFS(ipfsHash);
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw error;
  }
};

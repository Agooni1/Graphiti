const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const fetchFromIPFS = async (ipfsHash: string) => {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
  ];

  for (const gateway of gateways) {
    try {
      console.log(`🔍 Trying gateway: ${gateway}`);
      const response = await fetch(gateway);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success from ${gateway}`);
        return data;
      }
    } catch (error) {
      console.error(`❌ Failed to fetch from ${gateway}:`, error);
      continue;
    }
  }

  throw new Error('Failed to fetch from all IPFS gateways');
};

export const addToIPFS = async (yourJSON: object) => {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: yourJSON,
      pinataMetadata: {
        name: 'nft-metadata.json'
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  return await response.json();
};

export const getMetadataFromIPFS = async (ipfsHash: string) => {
  try {
    return await fetchFromIPFS(ipfsHash);
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw error;
  }
};

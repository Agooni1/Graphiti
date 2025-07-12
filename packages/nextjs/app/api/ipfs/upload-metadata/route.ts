import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    console.error('PINATA_JWT environment variable not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { metadata } = await request.json();
    
    if (!metadata) {
      return NextResponse.json({ error: 'No metadata provided' }, { status: 400 });
    }

    // console.log(`📤 Server: Uploading metadata to IPFS`);

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
      console.error(`Pinata metadata upload failed: ${response.status} - ${errorText}`);
      throw new Error(`Metadata upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // console.log(`✅ Server: Metadata uploaded to IPFS: ${result.IpfsHash}`);
    
    return NextResponse.json({ 
      cid: result.IpfsHash,     // ← Make sure it returns "cid"
      success: true 
    });
    
  } catch (error) {
    console.error('Metadata upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Metadata upload failed' 
    }, { status: 500 });
  }
}
// app/api/ipfs/upload-file/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    console.error('PINATA_JWT environment variable not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // console.log(`📤 Server: Uploading file to IPFS: ${file.name} (${file.size} bytes)`);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    // Optional: Add metadata for better organization in Pinata
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'cosmic-nft-image',
        fileType: file.type,
        timestamp: new Date().toISOString()
      }
    });
    uploadFormData.append('pinataMetadata', pinataMetadata);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: uploadFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pinata upload failed: ${response.status} - ${errorText}`);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    // console.log(`✅ Server: File uploaded to IPFS: ${result.IpfsHash}`);
    
    return NextResponse.json({ hash: result.IpfsHash });
    
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 });
  }
}
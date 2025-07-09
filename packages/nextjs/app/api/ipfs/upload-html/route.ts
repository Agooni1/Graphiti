import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const PINATA_JWT = process.env.PINATA_JWT;
  
  if (!PINATA_JWT) {
    console.error('PINATA_JWT environment variable not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { htmlContent, filename = "cosmic-graph-interactive.html" } = await request.json();
    
    if (!htmlContent) {
      return NextResponse.json({ error: 'No HTML content provided' }, { status: 400 });
    }

    // console.log(`📤 Server: Uploading HTML to IPFS: ${filename}`);

    const formData = new FormData();
    
    // Create HTML file blob
    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    const htmlFile = new File([htmlBlob], filename, { type: "text/html" });
    
    formData.append('file', htmlFile);

    const pinataMetadata = JSON.stringify({
      name: filename,
      keyvalues: {
        type: 'cosmic-nft-interactive-html',
        fileType: 'text/html',
        contentType: 'interactive-visualization',
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
      console.error(`Pinata HTML upload failed: ${response.status} - ${errorText}`);
      throw new Error(`HTML upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // console.log(`✅ Server: HTML uploaded to IPFS: ${result.IpfsHash}`);
    
    return NextResponse.json({ 
      cid: result.IpfsHash,     // ← Changed from "hash" to "cid"
      success: true 
    });
    
  } catch (error) {
    console.error('HTML upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'HTML upload failed' 
    }, { status: 500 });
  }
}
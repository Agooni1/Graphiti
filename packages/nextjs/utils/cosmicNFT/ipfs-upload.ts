// Client-side function for file upload
export async function uploadFileToIPFS(file: File): Promise<string> {
  console.log("📤 Uploading file to IPFS...", file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/ipfs/upload-file', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  const result = await response.json();
  console.log("✅ File uploaded to IPFS:", result.hash);
  return result.hash;
}

// Client-side function for metadata upload
export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  console.log("📤 Uploading metadata to IPFS...");
  
  const response = await fetch('/api/ipfs/upload-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metadata }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Metadata upload failed');
  }
  
  const result = await response.json();
  console.log("✅ Metadata uploaded to IPFS:", result.hash);
  return result.hash;
}

// Client-side function for HTML upload
export async function uploadHtmlToIPFS(htmlContent: string, filename: string = "cosmic-graph-interactive.html"): Promise<string> {
  console.log("📤 Uploading HTML to IPFS...", filename);
  
  const response = await fetch('/api/ipfs/upload-html', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ htmlContent, filename }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'HTML upload failed');
  }
  
  const result = await response.json();
  console.log("✅ HTML uploaded to IPFS:", result.hash);
  return result.hash;
}

// Legacy functions - keep for backwards compatibility but mark as deprecated
/** @deprecated Use uploadFileToIPFS instead */
export async function uploadFileToIPFSLegacy(file: File): Promise<string> {
  console.warn("⚠️ uploadFileToIPFSLegacy is deprecated. Use uploadFileToIPFS instead.");
  return uploadFileToIPFS(file);
}
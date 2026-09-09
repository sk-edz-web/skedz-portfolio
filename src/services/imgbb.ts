/**
 * ImgBB Image Upload Service
 * API Key provided: d52834a6dd5b38108a1abaf081dec54d
 */

export const IMGBB_API_KEY =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_IMGBB_API_KEY as string) ||
  'd52834a6dd5b38108a1abaf081dec54d';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string | number;
    height: string | number;
    size: number;
    time: string | number;
    expiration: string | number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      url: string;
    };
    medium?: {
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads a file (File, Blob, or base64 string) to ImgBB CDN
 */
export async function uploadToImgBB(
  fileOrBase64: File | Blob | string,
  customName?: string
): Promise<{ url: string; displayUrl: string; deleteUrl?: string }> {
  const formData = new FormData();

  if (typeof fileOrBase64 === 'string') {
    // If it's a base64 data url, strip the data:image/...;base64, prefix
    const base64Data = fileOrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    formData.append('image', base64Data);
  } else {
    formData.append('image', fileOrBase64);
  }

  if (customName) {
    formData.append('name', customName);
  }

  const endpoint = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetails = `HTTP error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorDetails = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(`ImgBB upload failed: ${errorDetails}`);
  }

  const result: ImgBBResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error('ImgBB did not return a successful response');
  }

  return {
    url: result.data.url,
    displayUrl: result.data.display_url || result.data.url,
    deleteUrl: result.data.delete_url,
  };
}

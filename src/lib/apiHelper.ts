/**
 * SKEDZ-S.PORTAL Bulletproof API Fetch & Safe Response Parser
 * Prevents "Unexpected token 'A', 'A server e'... is not valid JSON" errors
 * gracefully handles non-JSON responses, serverless crash messages, HTML error pages,
 * and proxy errors.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Safely parse a Fetch Response into JSON, extracting error messages from HTML or text
 * if the server returned a 500/502/413/401/404 or plain text error page.
 */
export async function parseResponseSafely<T = any>(res: Response): Promise<ApiResponse<T>> {
  let rawText = "";
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    return {
      ok: false,
      status: res.status,
      error: `Network read failure: ${readErr?.message || "Could not read response"}`,
    };
  }

  let json: any = null;
  const trimmed = rawText.trim();
  const isJsonCandidate = (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (isJsonCandidate) {
    try {
      json = JSON.parse(trimmed);
    } catch {
      json = null;
    }
  }

  // If server responded with an error HTTP status
  if (!res.ok) {
    if (json && (json.error || json.message)) {
      return {
        ok: false,
        status: res.status,
        data: json,
        error: json.error || json.message,
      };
    }

    // Clean HTML or plain text error (e.g. "A server error has occurred")
    let cleanErr = trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanErr) {
      cleanErr = `Server returned status ${res.status} (${res.statusText || "Error"})`;
    } else if (cleanErr.length > 200) {
      cleanErr = cleanErr.slice(0, 200) + "...";
    }

    return {
      ok: false,
      status: res.status,
      data: json,
      error: cleanErr,
    };
  }

  // If status is OK (200-299)
  if (json !== null) {
    return {
      ok: true,
      status: res.status,
      data: json as T,
    };
  }

  // Status OK but returned non-JSON text
  return {
    ok: true,
    status: res.status,
    data: (trimmed ? { message: trimmed } : {}) as T,
  };
}

/**
 * Wrapper around window.fetch that safely handles JSON response parsing,
 * network failures, and server crashes.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    return await parseResponseSafely<T>(res);
  } catch (netErr: any) {
    console.warn("Network fetch exception:", netErr);
    return {
      ok: false,
      status: 0,
      error: netErr?.message || "Network request failed. Please verify your connection.",
    };
  }
}

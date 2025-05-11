const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

export async function fetchAPI(
  apiRoute: string,
  {
    body,
    method = "POST",
    cache, // set to "no-store" for no cache
    serverSide = false,
  }: {
    body: any;
    method?: "POST" | "GET";
    cache?: "no-store" | "force-cache";
    serverSide?: boolean;
  },
  accessToken?: string,
) {
  try {
    const response = await fetch(
      serverSide ? `${API_URL}${apiRoute}` : apiRoute,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        cache,
      },
    );

    return await handleResponse(response);
  } catch (error) {
    console.error(`[fetchAPI] Request failed:`, error);
    return { error: (error as Error).message };
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    // If the response isn't ok, attempt to parse an error response body
    let errorMessage = `${res.status} ${res.statusText}`;
    try {
      const errorResContent = await res.json();
      if (errorResContent?.error) {
        errorMessage += ` - ${errorResContent.error}`;
      }
    } catch (errorParsing) {
      console.error(
        `[fetchAPI] Failed to parse error response JSON:`,
        errorParsing,
      );
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

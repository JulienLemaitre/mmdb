const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

export async function fetchAPI(
  apiRoute: string,
  {
    body,
    method = "POST",
    cache, // default to no cache if = "no-store"
    serverSide = false,
  }: {
    body: any;
    method?: "POST" | "GET";
    cache?: "no-store" | "force-cache";
    serverSide?: boolean;
  },
  accessToken?: string,
) {
  return await fetch(serverSide ? `${API_URL}${apiRoute}` : apiRoute, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache,
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .catch((err) => {
      console.log(err);
      return { error: err.message };
    });
}

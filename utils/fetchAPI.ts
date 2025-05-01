const API_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api`
  : "http://localhost:3000/api";

export async function fetchAPI(
  apiRoute: string,
  {
    variables,
    method = "POST",
    cache, // default to no cache if = "no-store"
    serverSide = false,
  }: {
    variables: any;
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
    body: JSON.stringify(variables),
    cache,
  })
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

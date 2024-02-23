export async function fetchAPI(
  apiRoute: string,
  {
    variables,
    method = "POST",
    cache, // default to no cache if = "no-store"
  }: {
    variables: any;
    method?: "POST" | "GET";
    cache?: "no-store" | "force-cache";
  },
  accessToken?: string,
) {
  return await fetch(apiRoute, {
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

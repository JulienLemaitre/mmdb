export async function fetchAPI(
  apiRoute: string,
  {
    variables,
    method = "POST",
  }: {
    variables: any;
    method?: "POST" | "GET";
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
  })
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

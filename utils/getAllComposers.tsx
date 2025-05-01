import { URL_API_GETALL_COMPOSERS } from "@/utils/routes";

export default async function getAllComposers() {
  return fetch(URL_API_GETALL_COMPOSERS, { cache: "no-store" }).then((res) =>
    res.json(),
  );
}

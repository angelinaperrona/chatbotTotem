import { getBackendUrl as getBackendUrlUtil } from "@totem/utils";

const backendUrlBase = getBackendUrlUtil();

export function getBackendUrl(path: string): string {
  return `${backendUrlBase}${path}`;
}

export async function fetchBackend(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(getBackendUrl(path), init);
}

export function getOneTimeToken(search: string): string | null {
  const token = new URLSearchParams(search).get("token")?.trim();
  return token && token.length <= 512 ? token : null;
}

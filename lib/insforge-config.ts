export function getInsforgeBaseUrl(): string | undefined {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.trim();
  return baseUrl ? baseUrl.replace(/\/+$/, "") : undefined;
}

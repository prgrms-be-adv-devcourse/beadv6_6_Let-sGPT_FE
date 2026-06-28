const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * 이미지 키/URL을 렌더 가능한 src로 변환한다(BE 이미지 저장 정합).
 * - 풀 URL(http/https/data/blob)은 그대로(목 picsum 등).
 * - 절대경로(`/api/...`, BE 가 준 url 필드) 또는 BE 객체 키는 API 베이스 뒤 조회 경로로:
 *     key      → {API_BASE}/api/v1/products/images/{key}
 *     /api/... → {API_BASE}/api/...
 */
export function resolveImageSrc(keyOrUrl: string | null | undefined): string | null {
  if (!keyOrUrl) {
    return null;
  }
  if (/^(https?:|data:|blob:)/.test(keyOrUrl)) {
    return keyOrUrl;
  }
  const path = keyOrUrl.startsWith("/") ? keyOrUrl : `/api/v1/products/images/${keyOrUrl}`;
  return new URL(path, API_BASE).toString();
}

/**
 * 상세 화면 갤러리 이미지 목록(키/URL 원형 — 렌더 시 resolveImageSrc 로 변환).
 * - 실 BE: imageKeys(갤러리)가 있으면 [thumbnail, ...imageKeys] 패스스루(중복 제거).
 * - 목(picsum 단일 썸네일): seed 접미사로 변형 컷을 모사(데모용).
 */
export function buildGallery(
  thumbnailKey: string | null | undefined,
  imageKeys?: readonly string[] | null,
): string[] {
  if (imageKeys && imageKeys.length > 0) {
    const all = [thumbnailKey, ...imageKeys].filter((key): key is string => Boolean(key));
    return [...new Set(all)];
  }
  if (!thumbnailKey) {
    return [];
  }
  const suffixes = ["", "-b", "-c", "-d"];
  const urls = suffixes.map((suffix) =>
    thumbnailKey.replace(/\/seed\/([^/]+)\//, `/seed/$1${suffix}/`),
  );
  return [...new Set(urls)];
}

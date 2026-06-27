/**
 * 단일 썸네일에서 상세 갤러리(메인 + 변형 컷)를 모사한다.
 * 목 이미지(picsum seed)는 seed 접미사로 다른 컷을 만들고, 그 외(실 BE 키 등)는 단일 이미지로 dedupe.
 * 실 BE 가 이미지 목록을 주면 이 함수는 패스스루로 대체한다.
 */
export function buildGallery(thumbnailKey: string | null | undefined): string[] {
  if (!thumbnailKey) {
    return [];
  }
  const suffixes = ["", "-b", "-c", "-d"];
  const urls = suffixes.map((suffix) =>
    thumbnailKey.replace(/\/seed\/([^/]+)\//, `/seed/$1${suffix}/`),
  );
  return [...new Set(urls)];
}

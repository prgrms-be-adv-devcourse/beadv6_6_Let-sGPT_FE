import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/drops/")({
  component: DropListPage,
});

// 헤더 내비("드롭")의 목적지 스텁. 실제 목록(스케줄·오픈)은 screens/04-drop-list 에서 구현.
function DropListPage() {
  return (
    <section className="space-y-2">
      <h1 className="font-bold text-2xl">드롭 목록</h1>
      <p className="text-muted-foreground">스케줄·오픈 드롭 목록 화면은 준비 중입니다.</p>
    </section>
  );
}

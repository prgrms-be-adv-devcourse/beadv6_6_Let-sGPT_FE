import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="space-y-2">
      <h1 className="font-bold text-2xl">Let'sGPT</h1>
      <p className="text-muted-foreground">하네스 스캐폴딩 기준으로 만든 시드 홈 화면입니다.</p>
    </section>
  );
}

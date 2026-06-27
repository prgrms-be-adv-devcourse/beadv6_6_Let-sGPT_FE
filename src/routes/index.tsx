import { createFileRoute } from "@tanstack/react-router";

import { OngoingDropList } from "@/features/drop/ui/OngoingDropList";
import { UpcomingDropBanner } from "@/features/drop/ui/UpcomingDropBanner";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-8">
      <UpcomingDropBanner />
      <section className="space-y-4">
        <h2 className="font-bold text-xl">진행중인 드롭</h2>
        <OngoingDropList />
      </section>
    </div>
  );
}

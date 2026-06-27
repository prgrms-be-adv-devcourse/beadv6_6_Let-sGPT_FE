import { createFileRoute } from "@tanstack/react-router";

import { HeroDrop } from "@/features/drop/ui/HeroDrop";
import { OngoingDropList } from "@/features/drop/ui/OngoingDropList";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <HeroDrop />
      <OngoingDropList />
    </div>
  );
}

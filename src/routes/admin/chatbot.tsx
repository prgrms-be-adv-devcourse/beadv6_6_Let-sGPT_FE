import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/app/layout/AdminShell";
import { AdminChatbot } from "@/features/chat/ui/AdminChatbot";

export const Route = createFileRoute("/admin/chatbot")({
  component: AdminChatbotPage,
});

function AdminChatbotPage() {
  return (
    <AdminShell
      title="AI 어시스턴트"
      description="운영과 관리에 필요한 질문을 자연스럽게 답하는 관리자용 AI"
    >
      <AdminChatbot />
    </AdminShell>
  );
}

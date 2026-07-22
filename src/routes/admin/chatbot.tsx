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
      description="안전한 범위에서 질문을 분류하고 답변하는 관리자용 AI"
    >
      <AdminChatbot />
    </AdminShell>
  );
}

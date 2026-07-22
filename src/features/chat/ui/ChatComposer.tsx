import { ArrowUp, Square } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef } from "react";

import { Button } from "@/shared/ui/button";

type ChatComposerProps = {
  value: string;
  maxLength: number;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ChatComposer({
  value,
  maxLength,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: ChatComposerProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const wasBusyRef = useRef(false);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea || textArea.value !== value) {
      return;
    }
    textArea.style.height = "0px";
    textArea.style.height = `${Math.max(48, Math.min(textArea.scrollHeight, 160))}px`;
  }, [value]);

  useEffect(() => {
    if (wasBusyRef.current && !busy && restoreFocusRef.current) {
      textAreaRef.current?.focus({ preventScroll: true });
    }
    if (!busy) {
      restoreFocusRef.current = false;
    }
    wasBusyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!busy) {
      return;
    }
    function cancelWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", cancelWithEscape);
    return () => document.removeEventListener("keydown", cancelWithEscape);
  }, [busy, onCancel]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy && value.trim()) {
      send();
    }
  }

  function cancel() {
    onCancel();
  }

  function send() {
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    restoreFocusRef.current = !coarsePointer;
    if (coarsePointer) {
      textAreaRef.current?.blur();
    }
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!busy && value.trim()) {
        send();
      }
    }
  }

  return (
    <form
      onSubmit={submit}
      data-chat-composer="true"
      className="sticky bottom-4 z-10 mt-auto rounded-2xl border bg-background/95 p-3 shadow-sm backdrop-blur [overflow-anchor:none] sm:p-4"
    >
      <div className="flex items-end gap-3">
        <label htmlFor="admin-chat-message" className="sr-only">
          AI 어시스턴트에게 질문하기
        </label>
        <textarea
          ref={textAreaRef}
          id="admin-chat-message"
          rows={1}
          value={value}
          maxLength={maxLength}
          readOnly={busy}
          aria-busy={busy}
          aria-describedby="admin-chat-message-help"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="일반 개념이나 글쓰기를 물어보세요"
          className="max-h-40 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-3 text-[15px] leading-6 outline-none placeholder:text-muted-foreground read-only:cursor-wait read-only:opacity-60"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            className="mb-1 rounded-full"
            aria-label="답변 생성 중지"
            aria-keyshortcuts="Escape"
            title="답변 생성 중지"
            onClick={cancel}
          >
            <Square className="fill-current" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="mb-1 rounded-full"
            disabled={!value.trim()}
            aria-label="질문 보내기"
            aria-keyshortcuts="Enter"
            title="질문 보내기"
          >
            <ArrowUp aria-hidden="true" />
          </Button>
        )}
      </div>

      <div
        id="admin-chat-message-help"
        className="mt-2 flex flex-col gap-1 border-t pt-3 text-muted-foreground text-xs sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <p className="text-foreground/70">
            <kbd className="font-sans font-medium">Enter</kbd> 전송 ·{" "}
            <kbd className="font-sans font-medium">Shift+Enter</kbd> 줄바꿈
            {busy ? (
              <>
                {" · "}
                <kbd className="font-sans font-medium">Esc</kbd> 중지
              </>
            ) : null}
          </p>
          <p>개인정보·내부 운영정보는 입력하지 마세요.</p>
        </div>
        <p className="shrink-0 tabular-nums">
          {value.length.toLocaleString("ko-KR")} / {maxLength.toLocaleString("ko-KR")}
        </p>
      </div>
    </form>
  );
}

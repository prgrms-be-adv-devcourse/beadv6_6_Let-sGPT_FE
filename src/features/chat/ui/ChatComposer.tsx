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
  const normalizedLength = value.trim().length;
  const isTooLong = normalizedLength > maxLength;
  const canSubmit = normalizedLength > 0 && !isTooLong;
  const showCancel = busy && !canSubmit;

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea || textArea.value !== value) {
      return;
    }
    textArea.style.height = "0px";
    textArea.style.height = `${Math.max(48, Math.min(textArea.scrollHeight, 160))}px`;
  }, [value]);

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
    if (canSubmit) {
      send();
    }
  }

  function cancel() {
    onCancel();
    textAreaRef.current?.focus({ preventScroll: true });
  }

  function send() {
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    onSubmit();
    if (coarsePointer) {
      textAreaRef.current?.blur();
    } else {
      textAreaRef.current?.focus({ preventScroll: true });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSubmit) {
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
          aria-invalid={isTooLong}
          aria-describedby="admin-chat-message-help"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="운영에 필요한 지식을 물어보세요."
          className="max-h-40 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-3 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
        />
        {showCancel ? (
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
            disabled={!canSubmit}
            aria-label={busy ? "현재 답변을 중지하고 질문 보내기" : "질문 보내기"}
            aria-keyshortcuts="Enter"
            title={busy ? "현재 답변을 중지하고 질문 보내기" : "질문 보내기"}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
        )}
      </div>

      <div
        id="admin-chat-message-help"
        className="mt-2 flex items-end justify-between gap-3 border-t pt-3 text-muted-foreground text-xs"
      >
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
        <p
          className={`shrink-0 tabular-nums ${isTooLong ? "text-destructive" : ""}`}
          aria-live="polite"
        >
          {normalizedLength.toLocaleString("ko-KR")} / {maxLength.toLocaleString("ko-KR")}
        </p>
      </div>
    </form>
  );
}

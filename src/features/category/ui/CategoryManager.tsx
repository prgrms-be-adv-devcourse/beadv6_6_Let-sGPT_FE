import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../api/categories.queries";

/** 카테고리 관리 — 목록 + 추가(POST)·이름 수정(PATCH)·삭제(DELETE). */
export function CategoryManager() {
  const categories = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function submitNew() {
    const name = newName.trim();
    if (!name) {
      return;
    }
    create.mutate({ name }, { onSuccess: () => setNewName("") });
  }

  function submitEdit(id: string) {
    const name = editName.trim();
    if (!name) {
      return;
    }
    update.mutate({ id, name }, { onSuccess: () => setEditingId(null) });
  }

  return (
    <div className="space-y-8">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitNew();
        }}
      >
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="새 카테고리명"
          maxLength={50}
        />
        <Button type="submit" disabled={create.isPending || newName.trim() === ""}>
          추가
        </Button>
      </form>

      {categories.isPending ? (
        <p className="py-12 text-center text-muted-foreground text-sm">불러오는 중…</p>
      ) : categories.isError ? (
        <p className="py-12 text-center text-destructive text-sm">
          카테고리를 불러오지 못했습니다.
        </p>
      ) : (
        <ul className="divide-y divide-border border-border border-y">
          {categories.data?.map((category) => (
            <li key={category.id} className="flex items-center gap-3 py-3">
              {editingId === category.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength={50}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    disabled={update.isPending}
                    onClick={() => submitEdit(category.id)}
                  >
                    저장
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{category.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="수정"
                    title="수정"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditName(category.name);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="삭제"
                    title="삭제"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(category.id)}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

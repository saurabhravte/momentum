"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/Toast";
import { TaskBoard } from "@/components/tasks/task-board";

export default function TasksPage() {
  const tasks = useAsync(() => api.tasks());
  const toast = useToast();
  const [title, setTitle] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.createTask({ title });
    setTitle("");
    tasks.reload();
  }

  async function changeStatus(id: string, status: "todo" | "doing" | "done") {
    await api.updateTask(id, status);
    if (status === "done") toast("Nice — that one's in tonight's shutdown ritual ✅", "success");
    tasks.reload();
  }

  async function changeTitle(id: string, newTitle: string) {
    await api.editTask(id, { title: newTitle });
    tasks.reload();
  }

  async function remove(id: string) {
    await api.deleteTask(id);
    toast("Task deleted", "success");
    tasks.reload();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Unified task board</h1>
          <p className="mt-1 text-sm text-muted">
            Drag cards between columns, click the pencil to rename, finish one for a little cheer.
          </p>
        </div>
        <form onSubmit={add} className="flex gap-2">
          <input
            className="input w-64"
            placeholder="Quick add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="btn-primary">Add</button>
        </form>
      </header>

      <div className="mt-6">
        <TaskBoard tasks={tasks.data ?? []} onStatusChange={changeStatus} onTitleChange={changeTitle} onDelete={remove} />
      </div>
    </div>
  );
}

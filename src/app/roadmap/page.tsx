"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const statusGroups = [
  { key: "in_progress", label: "In Progress" },
  { key: "planned", label: "Planned" },
  { key: "completed", label: "Completed" },
];

const statusColor: Record<string, string> = {
  planned: "bg-zinc-200 text-zinc-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const priorityLabel: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

export default function RoadmapPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-black tracking-[0.15em] uppercase text-black/20 mb-3">TRIO</div>
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const tasks: any[] = data.tasks || [];

  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-4">Roadmap</h1>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">What&apos;s Coming</h2>
        <p className="text-sm opacity-50 mb-16 max-w-md">Track progress on new features, improvements, and fixes.</p>

        {tasks.length === 0 && (
          <p className="text-sm opacity-30 italic">No tasks tracked yet. Check back soon.</p>
        )}

        <div className="space-y-16">
          {statusGroups.map((group) => {
            const groupTasks = tasks.filter((t: any) => t.status === group.key);
            if (groupTasks.length === 0) return null;

            return (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-sm tracking-[0.2em] uppercase font-bold">{group.label}</h3>
                  <span className="text-[10px] opacity-30">({groupTasks.length})</span>
                </div>
                <div className="space-y-3">
                  {groupTasks.map((task: any) => (
                    <div key={task.id} className="border border-black/5 bg-zinc-50/50 p-5">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${task.status === "completed" ? "bg-green-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-zinc-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{task.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor[task.status] || ""}`}>
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                          {task.description && <p className="text-xs opacity-50 mb-2">{task.description}</p>}
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider opacity-30">
                            <span>{task.phase || "General"}</span>
                            <span>Priority: {priorityLabel[task.priority] || "Medium"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-black/5">
          <Link href="/" className="text-xs tracking-[0.2em] uppercase hover:opacity-60 transition-opacity">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

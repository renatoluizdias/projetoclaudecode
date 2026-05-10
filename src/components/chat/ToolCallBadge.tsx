"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getFriendlyLabel(tool: ToolInvocation): string {
  const args = tool.args as Record<string, string>;

  if (tool.toolName === "str_replace_editor") {
    const fileName = getFileName(args.path || "");
    switch (args.command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      case "undo_edit":
        return `Undoing edit in ${fileName}`;
      default:
        return `Working on ${fileName}`;
    }
  }

  if (tool.toolName === "file_manager") {
    const fileName = getFileName(args.path || "");
    switch (args.command) {
      case "rename":
        return `Renaming ${fileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }

  return tool.toolName;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const label = getFriendlyLabel(tool);
  const isDone = tool.state === "result" && tool.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}

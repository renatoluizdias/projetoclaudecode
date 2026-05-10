import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getFriendlyLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getFriendlyLabel unit tests ---

test("getFriendlyLabel: str_replace_editor create", () => {
  const tool = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/components/App.jsx" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Creating App.jsx");
});

test("getFriendlyLabel: str_replace_editor str_replace", () => {
  const tool = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/components/Button.tsx" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Editing Button.tsx");
});

test("getFriendlyLabel: str_replace_editor insert", () => {
  const tool = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "src/lib/utils.ts" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Editing utils.ts");
});

test("getFriendlyLabel: str_replace_editor view", () => {
  const tool = {
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "src/index.ts" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Reading index.ts");
});

test("getFriendlyLabel: str_replace_editor undo_edit", () => {
  const tool = {
    toolCallId: "5",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "src/main.tsx" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Undoing edit in main.tsx");
});

test("getFriendlyLabel: file_manager rename", () => {
  const tool = {
    toolCallId: "6",
    toolName: "file_manager",
    args: { command: "rename", path: "src/old.tsx", new_path: "src/new.tsx" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Renaming old.tsx");
});

test("getFriendlyLabel: file_manager delete", () => {
  const tool = {
    toolCallId: "7",
    toolName: "file_manager",
    args: { command: "delete", path: "src/temp.ts" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Deleting temp.ts");
});

test("getFriendlyLabel: unknown tool falls back to toolName", () => {
  const tool = {
    toolCallId: "8",
    toolName: "some_other_tool",
    args: {},
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("some_other_tool");
});

test("getFriendlyLabel: uses only filename from nested path", () => {
  const tool = {
    toolCallId: "9",
    toolName: "str_replace_editor",
    args: { command: "create", path: "a/b/c/deep/Component.tsx" },
    state: "call",
  } as ToolInvocation;

  expect(getFriendlyLabel(tool)).toBe("Creating Component.tsx");
});

// --- ToolCallBadge rendering tests ---

test("ToolCallBadge shows friendly label when done (green dot)", () => {
  const tool = {
    toolCallId: "10",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.jsx" },
    state: "result",
    result: "Success",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge shows spinner when pending", () => {
  const tool = {
    toolCallId: "11",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/Button.tsx" },
    state: "call",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when result is null", () => {
  const tool = {
    toolCallId: "12",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/Card.tsx" },
    state: "result",
    result: null,
  } as unknown as ToolInvocation;

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge renders file_manager delete label", () => {
  const tool = {
    toolCallId: "13",
    toolName: "file_manager",
    args: { command: "delete", path: "src/unused.ts" },
    state: "result",
    result: { success: true },
  } as ToolInvocation;

  render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Deleting unused.ts")).toBeDefined();
});

test("ToolCallBadge falls back to toolName for unknown tools", () => {
  const tool = {
    toolCallId: "14",
    toolName: "mystery_tool",
    args: {},
    state: "call",
  } as ToolInvocation;

  render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("mystery_tool")).toBeDefined();
});

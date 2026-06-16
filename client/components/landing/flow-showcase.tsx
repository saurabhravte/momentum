"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Mail, Calendar, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolKey = "gmail" | "gcal" | "slack" | "github";

// Slack and Github SVG icons (removed from lucide-react v1+)
const SlackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

type ToolMeta = { name: string; icon: React.ComponentType<{ className?: string }>; color: string; soft: string };

const TOOL_META: Record<ToolKey, ToolMeta> = {
  gmail: { name: "Gmail", icon: Mail, color: "#EA4335", soft: "rgba(234,67,53,0.12)" },
  gcal: { name: "Calendar", icon: Calendar, color: "#1A73E8", soft: "rgba(26,115,232,0.12)" },
  slack: { name: "Slack", icon: SlackIcon, color: "#611F69", soft: "rgba(97,31,105,0.12)" },
  github: { name: "GitHub", icon: GithubIcon, color: "#24292F", soft: "rgba(36,41,47,0.12)" },
};

/* ---- custom node: the central "you" hub ---- */
function CenterNode() {
  return (
    <div className="relative grid h-28 w-28 place-items-center rounded-3xl border border-line bg-surface shadow-soft-lg">
      <Handle type="target" position={Position.Left} className="opacity-0!" />
      <Handle type="source" position={Position.Right} className="opacity-0!" />
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-bg">
        <Sparkles className="h-6 w-6" />
      </div>
      <span className="mt-2 text-xs font-semibold">Momentum</span>
      <span className="text-[10px] text-faint">your center</span>
    </div>
  );
}

/* ---- custom node: a connectable tool ---- */
function ToolNode({ data }: NodeProps) {
  const meta = TOOL_META[data.tool as ToolKey];
  const Icon = meta.icon;
  const connected = Boolean(data.connected);

  return (
    <button
      type="button"
      onClick={data.onToggle as () => void}
      className={cn(
        "group flex w-44 items-center gap-3 rounded-2xl border p-3 text-left transition-all",
        connected ? "border-transparent bg-surface shadow-soft" : "border-line bg-surface/60 hover:bg-surface",
      )}
      style={connected ? { boxShadow: `0 0 0 1.5px ${meta.color}55, 0 8px 28px -16px ${meta.color}` } : undefined}
    >
      <Handle type="target" position={Position.Left} className="opacity-0!" />
      <Handle type="source" position={Position.Right} className="opacity-0!" />
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors"
        style={{
          background: connected ? meta.soft : "rgb(var(--surface-2))",
          color: connected ? meta.color : "rgb(var(--faint))",
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{meta.name}</span>
        <span
          className={cn("inline-flex items-center gap-1 text-[11px]", connected ? "text-emerald-500" : "text-faint")}
        >
          {connected ? (
            <>
              <Check className="h-3 w-3" /> Connected
            </>
          ) : (
            "Tap to connect"
          )}
        </span>
      </span>
    </button>
  );
}

const nodeTypes = { center: CenterNode, tool: ToolNode };

export function FlowShowcase() {
  const [connected, setConnected] = useState<Record<ToolKey, boolean>>({
    gmail: false,
    gcal: false,
    slack: false,
    github: false,
  });
  const played = useRef(false);

  // Auto-play the "connect your apps" sequence once on mount: each tool wires
  // into the Momentum hub in turn. Tap-to-toggle still works afterwards.
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    const order: ToolKey[] = ["gmail", "gcal", "github", "slack"];
    const timers = order.map((tool, i) =>
      setTimeout(() => setConnected((c) => ({ ...c, [tool]: true })), 500 + i * 650),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const toggle = useCallback((key: ToolKey) => {
    setConnected((c) => ({ ...c, [key]: !c[key] }));
  }, []);

  const nodes: Node[] = useMemo(() => {
    const order: ToolKey[] = ["gmail", "gcal", "slack", "github"];
    const toolNodes: Node[] = order.map((tool, i) => ({
      id: tool,
      type: "tool",
      position: { x: 40, y: 20 + i * 92 },
      data: { tool, connected: connected[tool], onToggle: () => toggle(tool) },
      draggable: false,
    }));
    return [
      {
        id: "center",
        type: "center",
        position: { x: 420, y: 158 },
        data: {},
        draggable: false,
      },
      ...toolNodes,
    ];
  }, [connected, toggle]);

  const edges: Edge[] = useMemo(
    () =>
      (Object.keys(connected) as ToolKey[])
        .filter((k) => connected[k])
        .map((k) => ({
          id: `${k}-center`,
          source: k,
          target: "center",
          animated: true,
          style: { stroke: TOOL_META[k].color, strokeWidth: 2, opacity: 0.7 },
        })),
    [connected],
  );

  return (
    <div className="relative h-105 w-full overflow-hidden rounded-3xl border border-line bg-bg dot-grid">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0} />
      </ReactFlow>
    </div>
  );
}

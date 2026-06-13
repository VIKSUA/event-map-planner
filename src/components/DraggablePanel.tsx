import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import type { PanelPosition } from "../types/map";
import { loadPanelPosition, savePanelPosition } from "../lib/storage";

interface DraggablePanelProps extends PropsWithChildren {
  title: string;
}

export function DraggablePanel({ children, title }: DraggablePanelProps) {
  const [position, setPosition] = useState<PanelPosition>(() => loadPanelPosition());
  const [collapsed, setCollapsed] = useState(false);
  const [dragStart, setDragStart] = useState<{ pointerX: number; pointerY: number; panelX: number; panelY: number } | null>(null);

  useEffect(() => {
    savePanelPosition(position);
  }, [position]);

  useEffect(() => {
    if (!dragStart) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      setPosition({
        x: Math.max(0, dragStart.panelX + event.clientX - dragStart.pointerX),
        y: Math.max(0, dragStart.panelY + event.clientY - dragStart.pointerY),
      });
    };

    const handleUp = () => setDragStart(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragStart]);

  return (
    <aside className="control-panel no-print" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <div
        className="panel-title"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button")) {
            return;
          }
          setDragStart({ pointerX: event.clientX, pointerY: event.clientY, panelX: position.x, panelY: position.y });
        }}
      >
        <strong>{title}</strong>
        <button type="button" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? "Expand" : "Minimize"}
        </button>
      </div>
      {!collapsed && <div className="panel-body">{children}</div>}
    </aside>
  );
}

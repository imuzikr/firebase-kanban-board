import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardRow } from "@/lib/types";
import { formatDisplayDate } from "@/lib/date";
import { CardDialog } from "./CardDialog";

export function CardItem({
  card,
  canModify,
  showVisibilityControls,
}: {
  card: CardRow;
  canModify: boolean;
  showVisibilityControls: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId: card.listId },
    disabled: !canModify,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...(canModify ? attributes : {})}
        {...(canModify ? listeners : {})}
        onClick={() => setOpen(true)}
        className={`rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-sm shadow-sm hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 ${
          canModify ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
      >
        <p className="whitespace-pre-wrap font-semibold text-zinc-800 dark:text-zinc-100">{card.title}</p>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{formatDisplayDate(card.displayDate)}</p>
        {showVisibilityControls && (
          <span
            className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
              card.visibility === "public"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {card.visibility === "public" ? "공개" : "비공개"}
          </span>
        )}
      </div>
      {open && (
        <CardDialog
          card={card}
          canModify={canModify}
          showVisibilityControls={showVisibilityControls}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

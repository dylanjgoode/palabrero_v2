"use client";

import { useEffect, useRef } from "react";

type DeleteDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  deleting?: boolean;
};

export default function DeleteDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  deleting = false,
}: DeleteDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const deleteBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      requestAnimationFrame(() => cancelBtnRef.current?.focus());
    } else if (triggerElementRef.current instanceof HTMLElement) {
      triggerElementRef.current.focus();
      triggerElementRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => !deleting && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        className="surface-card p-6 max-w-sm mx-4 rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !deleting) {
            onCancel();
            return;
          }
          if (e.key === "Tab") {
            const focusable = [cancelBtnRef.current, deleteBtnRef.current].filter(Boolean) as HTMLElement[];
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        }}
      >
        <h3 id="delete-dialog-title" className="font-semibold text-lg">Delete conversation?</h3>
        <p id="delete-dialog-desc" className="text-[rgb(var(--muted))] mt-2">
          &ldquo;{title}&rdquo; will be permanently deleted.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-black/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={deleteBtnRef}
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

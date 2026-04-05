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
        <h3 id="delete-dialog-title" className="font-[family-name:var(--font-fraunces)] text-3xl text-[rgb(var(--ink))] mb-2">Delete conversation?</h3>
        <p id="delete-dialog-desc" className="text-[rgb(var(--ink-body))] leading-relaxed mb-6">
          &ldquo;{title}&rdquo; will be permanently deleted.
        </p>
        <div className="flex flex-col gap-3">
          <button
            ref={deleteBtnRef}
            onClick={onConfirm}
            disabled={deleting}
            className="w-full px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={deleting}
            className="w-full px-6 py-3 rounded-full border border-black/10 text-[rgb(var(--ink-body))] font-bold hover:bg-black/5 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

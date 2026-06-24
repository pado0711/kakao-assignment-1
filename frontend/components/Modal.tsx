"use client";

import { useEffect } from "react";

interface ModalProps {
  title?: string;
  message: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function Modal({ title = "알림", message, onClose, children }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation">
      <section className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {children ?? (
            <button className="btn-primary" type="button" onClick={onClose}>확인</button>
          )}
        </div>
      </section>
    </div>
  );
}

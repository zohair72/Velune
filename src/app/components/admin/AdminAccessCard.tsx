import React from "react";
import type { ReactNode } from "react";

type AdminAccessCardProps = {
  eyebrow: string;
  title: string;
  message: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
};

export const AdminAccessCard = ({
  eyebrow,
  title,
  message,
  actions,
  footer,
}: AdminAccessCardProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe6] px-6 py-16 text-[#1A1817]">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#d8cab5] bg-white p-10 shadow-sm">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-cinzel text-4xl">{title}</h1>
        <div className="mt-5 text-base leading-7 text-[#5c5046]">{message}</div>
        {actions ? <div className="mt-8 space-y-3">{actions}</div> : null}
        {footer ? <div className="mt-6 text-sm text-[#7a6d62]">{footer}</div> : null}
      </div>
    </div>
  );
};

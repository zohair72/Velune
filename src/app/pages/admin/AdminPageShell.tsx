import React from "react";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export const AdminPageShell = ({
  eyebrow,
  title,
  description,
}: AdminPageShellProps) => {
  return (
    <section className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
      <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">{title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[#5c5046]">
        {description}
      </p>
    </section>
  );
};

import React from "react";

type StatusBadgeTone = "neutral" | "amber" | "green" | "red" | "blue";

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: "border-[#d8cab5] bg-[#f7f1e8] text-[#5c5046]",
  amber: "border-[#e8d2a8] bg-[#fbf2df] text-[#8a6131]",
  green: "border-[#b8d3b6] bg-[#edf7ec] text-[#2f5b2d]",
  red: "border-[#e6c0b7] bg-[#fbefeb] text-[#8c3b2a]",
  blue: "border-[#bfd6e6] bg-[#eef6fb] text-[#2d5874]",
};

const resolveTone = (value: string): StatusBadgeTone => {
  const normalized = value.trim().toLowerCase();

  if (["received", "payment received", "delivered"].includes(normalized)) {
    return "green";
  }

  if (["failed", "cancelled"].includes(normalized)) {
    return "red";
  }

  if (["pending", "awaiting payment", "cod", "new"].includes(normalized)) {
    return "amber";
  }

  if (["processing", "packed", "shipped"].includes(normalized)) {
    return "blue";
  }

  return "neutral";
};

export const StatusBadge = ({ value }: { value: string }) => {
  const tone = resolveTone(value);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 font-cinzel text-[11px] uppercase tracking-[0.16em] ${toneClasses[tone]}`}
    >
      {value}
    </span>
  );
};

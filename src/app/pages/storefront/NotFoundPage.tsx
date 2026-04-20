import React from "react";
import { Link } from "react-router";

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[#1A1817] px-6 text-[#F4EFE6]">
      <div className="text-center">
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
          404
        </p>
        <h1 className="mt-4 font-cinzel text-5xl">Lost in the woods</h1>
        <p className="mt-6 font-lora text-[#A39E98]">
          The page you were seeking has drifted beyond the tree line.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex border border-[#C19A5B] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#C19A5B] transition-colors hover:bg-[#C19A5B] hover:text-[#1A1817]"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

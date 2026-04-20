import React, { useState } from "react";
import { Link } from "react-router";
import {
  FlaskConical,
  MoveLeft,
  Sparkles,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCauldron } from "./CauldronContext";
import { SafeImage } from "./ui/SafeImage";
import { formatRupees } from "../../utils/currency";
import { formatNotesList } from "../../utils/notes";

const getCartStockMessage = (stockQuantity: number | null) => {
  if (stockQuantity === null) {
    return null;
  }

  if (stockQuantity <= 0) {
    return "This fragrance is now out of stock.";
  }

  if (stockQuantity <= 3) {
    return `Only ${stockQuantity} can be brewed right now.`;
  }

  return `${stockQuantity} available for this blend.`;
};

export const CauldronPage = () => {
  const {
    items,
    updateQuantity,
    removeFromCauldron,
    clearCauldron,
    subtotal,
  } = useCauldron();
  const [stockWarning, setStockWarning] = useState<Record<string, string>>({});

  return (
    <div className="min-h-[80vh] bg-[#1A1817] pb-24 pt-12">
      <div className="mx-auto max-w-4xl px-6">
        <Link
          to="/"
          className="mb-12 inline-flex items-center gap-2 font-cinzel text-sm uppercase tracking-widest text-[#A39E98] transition-colors hover:text-[#C19A5B]"
        >
          <MoveLeft size={16} /> Continue Brewing
        </Link>

        <div className="mb-16 flex items-center gap-4 border-b border-[#2A2624] pb-8">
          <FlaskConical size={36} className="text-[#C19A5B]" />
          <h1 className="font-cinzel text-4xl text-[#F4EFE6] md:text-5xl">
            Your Cauldron
          </h1>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-24 text-center"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#2A2624] text-[#A39E98]">
              <Sparkles size={32} />
            </div>
            <h2 className="mb-4 font-cinzel text-2xl text-[#F4EFE6]">
              Your cauldron is empty
            </h2>
            <p className="mb-8 font-lora italic text-[#A39E98]">
              No potions have been brewed yet.
            </p>

            <Link
              to="/"
              className="inline-block bg-[#C19A5B] px-8 py-3 font-cinzel text-sm uppercase tracking-widest text-[#1A1817] transition-colors hover:bg-[#F4EFE6]"
            >
              Continue Brewing
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <AnimatePresence>
                {items.map((item) => {
                  const stockLimitReached =
                    item.stockQuantity !== null && item.quantity >= item.stockQuantity;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-[#2A2624] bg-[#121110] p-4"
                    >
                      <div className="flex gap-6">
                        <div className="h-32 w-24 flex-shrink-0 overflow-hidden bg-[#1A1817]">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            fallbackClassName="h-full w-full"
                            fallbackLabel={item.name}
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="mb-1 font-cinzel text-xl text-[#F4EFE6]">
                                {item.name}
                              </h3>
                              <p className="font-lora text-sm italic text-[#A39E98]">
                                {item.volumeMl ? `${item.volumeMl}ml` : "10ml"} blend
                              </p>
                              {item.notes.length > 0 ? (
                                <p className="mt-2 font-cinzel text-[11px] uppercase tracking-[0.18em] text-[#c19a5bb3]">
                                  {formatNotesList(item.notes)}
                                </p>
                              ) : null}
                              {getCartStockMessage(item.stockQuantity) ? (
                                <p
                                  className={`mt-3 font-lora text-sm ${
                                    (item.stockQuantity ?? 0) <= 0
                                      ? "text-[#d8a07f]"
                                      : "text-[#A39E98]"
                                  }`}
                                >
                                  {getCartStockMessage(item.stockQuantity)}
                                </p>
                              ) : null}
                              {stockWarning[item.id] ? (
                                <p className="mt-2 font-lora text-sm text-[#d8a07f]">
                                  {stockWarning[item.id]}
                                </p>
                              ) : null}
                            </div>
                            <button
                              onClick={() => removeFromCauldron(item.id)}
                              className="p-2 text-[#A39E98] transition-colors hover:text-[#C19A5B]"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <div className="flex items-center gap-4 border border-[#2A2624] bg-[#1A1817] px-3 py-1">
                              <button
                                onClick={() => {
                                  const result = updateQuantity(item.id, item.quantity - 1);
                                  if (result.ok) {
                                    setStockWarning((prev) => ({
                                      ...prev,
                                      [item.id]: "",
                                    }));
                                  }
                                }}
                                className="text-[#A39E98] transition-colors hover:text-[#F4EFE6]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-4 text-center font-cinzel text-sm text-[#F4EFE6]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  const result = updateQuantity(item.id, item.quantity + 1);

                                  if (!result.ok) {
                                    setStockWarning((prev) => ({
                                      ...prev,
                                      [item.id]:
                                        result.message ??
                                        "This blend cannot be increased right now.",
                                    }));
                                    return;
                                  }

                                  setStockWarning((prev) => ({
                                    ...prev,
                                    [item.id]: "",
                                  }));
                                }}
                                disabled={stockLimitReached}
                                className={`transition-colors ${
                                  stockLimitReached
                                    ? "cursor-not-allowed text-[#6f655c]"
                                    : "text-[#A39E98] hover:text-[#F4EFE6]"
                                }`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <div className="font-cinzel text-lg text-[#C19A5B]">
                              {formatRupees(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-32 border border-[#2A2624] bg-[#121110] p-8">
                <h3 className="mb-6 border-b border-[#2A2624] pb-4 font-cinzel text-xl text-[#F4EFE6]">
                  Brew Summary
                </h3>

                <div className="mb-8 space-y-4 font-lora text-[#A39E98]">
                  <div className="flex justify-between">
                    <span>Potions in Cauldron</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupees(subtotal)}</span>
                  </div>
                </div>

                <div className="mb-8 flex items-center justify-between border-t border-[#2A2624] pt-6">
                  <span className="font-cinzel text-lg text-[#F4EFE6]">
                    Brewing Total
                  </span>
                  <span className="font-cinzel text-2xl text-[#C19A5B]">
                    {formatRupees(subtotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="flex w-full items-center justify-center gap-2 bg-[#C19A5B] py-4 font-cinzel text-sm uppercase tracking-widest text-[#1A1817] transition-colors hover:bg-[#F4EFE6]"
                  >
                    <Sparkles size={16} /> Checkout
                  </Link>
                  <Link
                    to="/"
                    className="flex w-full items-center justify-center gap-2 border border-[#2A2624] py-4 font-cinzel text-sm uppercase tracking-widest text-[#A39E98] transition-colors hover:border-[#C19A5B] hover:text-[#C19A5B]"
                  >
                    <Sparkles size={16} /> Continue Brewing
                  </Link>
                  <button
                    type="button"
                    onClick={clearCauldron}
                    className="w-full border border-[#2A2624] py-4 font-cinzel text-sm uppercase tracking-widest text-[#A39E98] transition-colors hover:border-[#C19A5B] hover:text-[#C19A5B]"
                  >
                    Clear Cauldron
                  </button>
                </div>

                <p className="mt-6 text-center font-lora text-xs italic text-[#A39E98]">
                  Your brews will remain in the cauldron even after a refresh.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

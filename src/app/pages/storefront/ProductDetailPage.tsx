import React, { useEffect, useState } from "react";
import { FlaskConical, MoveLeft, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { useCauldron } from "../../components/CauldronContext";
import { SafeImage } from "../../components/ui/SafeImage";
import { formatRupees } from "../../../utils/currency";
import { getLowStockMessage, isOutOfStock } from "../../../utils/stock";
import {
  fetchPublishedProductBySlug,
  type StorefrontShelfProduct,
} from "../../../features/products/api";

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCauldron } = useCauldron();
  const [product, setProduct] = useState<StorefrontShelfProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [stockNotice, setStockNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!slug) {
        if (isMounted) {
          setProduct(null);
          setError(null);
          setIsLoading(false);
        }

        return;
      }

      try {
        const foundProduct = await fetchPublishedProductBySlug(slug);

        if (!isMounted) {
          return;
        }

        setProduct(foundProduct);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune product detail from Supabase.", loadError);
        setProduct(null);
        setError("This potion record could not be reached just now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleAddToCauldron = () => {
    if (!product || (product.stockQuantity ?? 0) <= 0) {
      setStockNotice("This fragrance is currently out of stock.");
      return;
    }

    const result = addToCauldron(product);

    if (!result.ok) {
      setStockNotice(
        result.message ?? "This fragrance cannot be added right now.",
      );
      return;
    }

    setStockNotice(null);
    setIsAdding(true);
    window.setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className="min-h-[80vh] bg-[#1A1817] px-6 py-20 text-[#F4EFE6]">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 font-cinzel text-sm uppercase tracking-[0.2em] text-[#A39E98] transition-colors hover:text-[#C19A5B]"
        >
          <MoveLeft size={16} /> Continue Brewing
        </Link>

        {isLoading ? (
          <div className="rounded-[2rem] border border-[#2A2624] bg-[#121110] px-10 py-16 text-center">
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
              Opening the grimoire
            </p>
            <p className="mt-4 font-lora text-[#A39E98]">
              Gathering this fragrance from the Velune apothecary.
            </p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-[2rem] border border-[#5a3a31] bg-[#241917] px-10 py-16 text-center">
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#d8a07f]">
              Record interrupted
            </p>
            <p className="mt-4 font-lora text-[#d2b7ac]">{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && !product ? (
          <div className="rounded-[2rem] border border-[#2A2624] bg-[#121110] px-10 py-16 text-center">
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
              Potion not found
            </p>
            <p className="mt-4 font-lora text-[#A39E98]">
              This fragrance is no longer on the apothecary shelf or may have
              never been published.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && product ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[2rem] border border-[#2A2624] bg-[#121110]"
            >
              <SafeImage
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                fallbackClassName="min-h-[620px]"
                fallbackLabel={product.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1817] via-transparent to-transparent opacity-70" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
              className="rounded-[2rem] border border-[#2A2624] bg-[#121110] p-10"
            >
              <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                Potion Record
              </p>

              <h1 className="mt-4 font-cinzel text-4xl text-[#F4EFE6] md:text-5xl">
                {product.name}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-[#C19A5B]/30 bg-[#1A1817] px-5 py-2 font-cinzel text-lg text-[#C19A5B]">
                  {formatRupees(product.price)}
                </div>
                {product.volumeMl ? (
                  <div className="rounded-full border border-[#2A2624] bg-[#1A1817] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[#A39E98]">
                    {product.volumeMl} ml
                  </div>
                ) : null}
              </div>

              <p className="mt-6 font-lora text-lg leading-relaxed text-[#A39E98]">
                {product.description ||
                  "A Velune fragrance brewed with quiet intention."}
              </p>

              {(() => {
                const stockMessage = getLowStockMessage(product.stockQuantity, {
                  outOfStockLabel: "Currently out of stock",
                  lowStockLabel: (quantity) =>
                    `Only ${quantity} left in the apothecary`,
                });
                const productIsOutOfStock = isOutOfStock(product.stockQuantity);

                if (!stockMessage) {
                  return null;
                }

                return (
                  <div className="mt-8 rounded-[1.5rem] border border-[#2A2624] bg-[#1A1817] p-5">
                    <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                      Stock
                    </p>
                    <p
                      className={`mt-3 font-lora ${
                        productIsOutOfStock ? "text-[#d8a07f]" : "text-[#A39E98]"
                      }`}
                    >
                      {stockMessage}
                    </p>
                  </div>
                );
              })()}

              <div className="mt-8">
                <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                  Notes
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {product.notes.map((note) => (
                    <span
                      key={`${product.id}-${note}`}
                      className="rounded-full border border-[#2A2624] bg-[#1A1817] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[#c19a5bb3]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              {stockNotice ? (
                <div className="mt-6 rounded-2xl border border-[#5a3a31] bg-[#241917] px-5 py-4 font-lora text-sm text-[#d2b7ac]">
                  {stockNotice}
                </div>
              ) : null}

              <motion.button
                whileHover={(product.stockQuantity ?? 0) > 0 ? { scale: 1.02 } : undefined}
                whileTap={(product.stockQuantity ?? 0) > 0 ? { scale: 0.98 } : undefined}
                type="button"
                disabled={(product.stockQuantity ?? 0) <= 0}
                onClick={handleAddToCauldron}
                className={`mt-8 flex w-full items-center justify-center gap-3 border py-4 font-cinzel text-sm uppercase tracking-widest transition-all duration-300 ${
                  (product.stockQuantity ?? 0) <= 0
                    ? "cursor-not-allowed border-[#4b4037] bg-[#1A1817] text-[#6f655c]"
                    : isAdding
                      ? "border-[#3D4F35] bg-[#3D4F35] text-[#F4EFE6]"
                      : "border-[#C19A5B] text-[#C19A5B] hover:bg-[#C19A5B] hover:text-[#1A1817]"
                }`}
              >
                {(product.stockQuantity ?? 0) <= 0 ? (
                  <>Out of Stock</>
                ) : isAdding ? (
                  <>
                    <Sparkles size={18} className="animate-spin" />
                    Brewing...
                  </>
                ) : (
                  <>
                    <FlaskConical size={18} />
                    Add to Cauldron
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

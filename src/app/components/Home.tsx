import React, { useEffect, useState } from "react";
import { Sparkles, FlaskConical, MoveRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useCauldron, type Product as CauldronProduct } from "./CauldronContext";
import { SafeImage } from "./ui/SafeImage";
import { formatRupees } from "../../utils/currency";
import { formatNotesList } from "../../utils/notes";
import { getLowStockMessage, isOutOfStock } from "../../utils/stock";
import {
  fetchPublishedProducts,
  type StorefrontShelfProduct,
} from "../../features/products/api";

export const Home = () => {
  const { addToCauldron } = useCauldron();
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<StorefrontShelfProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (isMounted) {
        setIsLoadingProducts(true);
      }

      try {
        const publishedProducts = await fetchPublishedProducts();

        if (!isMounted) {
          return;
        }

        setProducts(publishedProducts);
        setProductsError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune products from Supabase.", error);
        setProducts([]);
        setProductsError("The apothecary shelf could not be reached just now.");
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCauldron = (product: CauldronProduct) => {
    const result = addToCauldron(product);

    if (!result.ok) {
      setStockNotice((prev) => ({
        ...prev,
        [product.id]: result.message ?? "This fragrance cannot be added right now.",
      }));
      return;
    }

    setStockNotice((prev) => ({ ...prev, [product.id]: "" }));
    setAddingProduct(product.id);
    window.setTimeout(() => setAddingProduct(null), 800);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1532092367580-3bd5bc78dd9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcG90aGVjYXJ5JTIwaGVyYnN8ZW58MXx8fHwxNzc2NTgyMjI3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Witch's Apothecary"
            className="h-full w-full object-cover object-center opacity-40 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1817] via-transparent to-[#1A1817]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[#1A1817]/20" />
        </div>

        <div className="relative z-10 mx-auto mt-8 flex h-full max-w-7xl flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="mb-4 flex items-center justify-center gap-4 text-[#C19A5B]">
              <Sparkles size={16} />
              <span className="font-cinzel text-xs uppercase tracking-[0.2em]">
                Oil-Based Fragrances
              </span>
              <Sparkles size={16} />
            </div>

            <h1 className="mb-6 font-cinzel text-6xl leading-tight text-[#F4EFE6] drop-shadow-xl md:text-8xl">
              Potions & <br /> Elixirs
            </h1>

            <p className="mx-auto mb-10 max-w-lg font-lora text-lg italic leading-relaxed text-[#F4EFE6]/90 drop-shadow-md md:text-xl">
              Hand-brewed botanical oils inspired by ancient apothecary grimoires.
              Magic in every drop.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 rounded-sm bg-[#C19A5B] px-10 py-4 font-cinzel text-sm uppercase tracking-widest text-[#1A1817] transition-all duration-500 hover:bg-[#F4EFE6]"
              onClick={() => {
                document
                  .getElementById("apothecary-shelf")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore the Brews <MoveRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section id="apothecary-shelf" className="bg-[#1A1817] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 flex items-center justify-center gap-4 font-cinzel text-4xl text-[#F4EFE6]">
              <span className="h-px w-12 bg-[#C19A5B]/50"></span>
              The Apothecary Shelf
              <span className="h-px w-12 bg-[#C19A5B]/50"></span>
            </h2>
            <p className="mx-auto max-w-xl font-lora text-lg italic text-[#A39E98]">
              Our signature collection of mystical, oil-based fragrances.
            </p>
          </div>

          {isLoadingProducts ? (
            <div className="rounded-[2rem] border border-[#2A2624] bg-[#121110] px-8 py-12 text-center">
              <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                Brewing the shelf
              </p>
              <p className="mt-4 font-lora text-[#A39E98]">
                Fetching live fragrances from the Velune apothecary.
              </p>
            </div>
          ) : null}

          {!isLoadingProducts && productsError ? (
            <div className="mb-10 rounded-[2rem] border border-[#5a3a31] bg-[#241917] px-6 py-5 text-center">
              <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#d8a07f]">
                Shelf access interrupted
              </p>
              <p className="mt-3 font-lora text-[#d2b7ac]">{productsError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl border border-[#6a4a3f] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#f0d3c7] transition-colors hover:border-[#d8a07f] hover:text-[#fff0ea]"
              >
                Refresh Shelf
              </button>
            </div>
          ) : null}

          {!isLoadingProducts && products.length === 0 && !productsError ? (
            <div className="rounded-[2rem] border border-[#2A2624] bg-[#121110] px-8 py-12 text-center">
              <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C19A5B]">
                Shelf awaiting brews
              </p>
              <p className="mt-4 font-lora text-[#A39E98]">
                Your storefront is connected. Publish products in Supabase to see
                them appear here.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {products.map((product, index) => {
              const productIsOutOfStock = isOutOfStock(product.stockQuantity);
              const stockMessage = getLowStockMessage(product.stockQuantity);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group flex flex-col items-center"
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="flex w-full flex-col items-center"
                  >
                    <div className="relative mb-8 aspect-[4/5] w-full overflow-hidden rounded-t-full border border-[#2A2624] bg-[#121110]">
                      <SafeImage
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-all duration-1000 ease-out group-hover:scale-110"
                        fallbackClassName="h-full w-full"
                        fallbackLabel={product.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1817] via-transparent to-transparent opacity-80" />

                      {stockMessage ? (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-[#a44747]/55 bg-[#351717]/88 px-4 py-2 font-cinzel text-[11px] uppercase tracking-[0.22em] text-[#ffb3b3] shadow-[0_0_24px_rgba(164,71,71,0.22)] backdrop-blur-sm">
                          {stockMessage}
                        </div>
                      ) : null}

                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[#C19A5B]/30 bg-[#1A1817]/80 px-6 py-2 font-cinzel text-lg text-[#C19A5B] backdrop-blur-sm">
                        {formatRupees(product.price)}
                      </div>
                    </div>

                    <h3 className="mb-3 font-cinzel text-2xl text-[#F4EFE6]">
                      {product.name}
                    </h3>

                    <p className="mb-4 max-w-[280px] text-center text-sm leading-relaxed text-[#A39E98] line-clamp-3">
                      {product.description}
                    </p>
                    <p className="mb-6 text-center font-cinzel text-xs uppercase tracking-widest text-[#c19a5bb3]">
                      {formatNotesList(product.notes)}
                    </p>
                  </Link>

                  {stockNotice[product.id] ? (
                    <p className="mb-4 text-center font-lora text-sm text-[#d8a07f]">
                      {stockNotice[product.id]}
                    </p>
                  ) : null}

                  <motion.button
                    whileHover={!isOutOfStock ? { scale: 1.02 } : undefined}
                    whileTap={!isOutOfStock ? { scale: 0.98 } : undefined}
                    onClick={() => handleAddToCauldron(product)}
                    disabled={productIsOutOfStock}
                    className={`relative flex w-full items-center justify-center gap-3 border py-4 font-cinzel text-sm uppercase tracking-widest transition-all duration-300 ${
                      productIsOutOfStock
                        ? "cursor-not-allowed border-[#4b4037] bg-[#1A1817] text-[#6f655c]"
                        : addingProduct === product.id
                          ? "border-[#3D4F35] bg-[#3D4F35] text-[#F4EFE6]"
                          : "border-[#C19A5B] text-[#C19A5B] hover:bg-[#C19A5B] hover:text-[#1A1817]"
                    }`}
                  >
                    {productIsOutOfStock ? (
                      <>Out of Stock</>
                    ) : addingProduct === product.id ? (
                      <>
                        <Sparkles size={18} className="animate-spin" />
                        Brewing...
                      </>
                    ) : (
                      <>
                        <FlaskConical size={18} />
                        Add to Cauldron{" "}
                        <span className="ml-1 font-sans text-[10px] lowercase tracking-normal opacity-70">
                          (cart)
                        </span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#121110] py-32">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#C19A5B]/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <FlaskConical
            size={48}
            className="mx-auto mb-8 bg-[#0a360000] text-[#C19A5B] opacity-50"
          />
          <h2 className="mb-8 font-cinzel text-3xl leading-tight text-[#F4EFE6] md:text-5xl">
            "Magic isn't something you do, <br /> it's something you wear."
          </h2>
          <p className="mx-auto max-w-2xl font-lora text-lg italic leading-relaxed text-[#A39E98]">
            Every bottle of Velune is hand-poured during the dark of the moon to
            ensure maximum potency. We use only ethically sourced herbs, essential
            oils, and the deepest intent.
          </p>
        </div>
      </section>
    </div>
  );
};

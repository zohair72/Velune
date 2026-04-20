import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { SafeImage } from "../../components/ui/SafeImage";
import { formatRupees } from "../../../utils/currency";
import { fetchAdminProducts } from "../../../features/products/api";
import type { ProductRecord } from "../../../features/products/types";

export const ProductsPage = () => {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminProducts();

        if (!isMounted) {
          return;
        }

        setProducts(data);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load Velune admin products.", loadError);
        setProducts([]);
        setError("Products could not be loaded right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-[#d8cab5] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#0A3600]">
              Products
            </p>
            <h1 className="mt-4 font-cinzel text-4xl text-[#1A1817]">
              Manage storefront products
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5c5046]">
              Create new fragrances, update existing blends, manage stock levels,
              and control which products are active on the storefront.
            </p>
          </div>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A3600] px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#F4EFE6] transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#d8cab5] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#efe4d2] px-6 py-5">
          <div>
            <h2 className="font-cinzel text-xl text-[#1A1817]">Product Catalog</h2>
            <p className="mt-1 text-sm text-[#7a6d62]">
              {isLoading ? "Loading products..." : `${products.length} products in the catalog`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            Loading the Velune product catalog...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="px-6 py-12 text-center text-[#9f3c24]">{error}</div>
        ) : null}

        {!isLoading && !error && products.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#7a6d62]">
            No products have been created yet.
          </div>
        ) : null}

        {!isLoading && !error && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#efe4d2]">
              <thead className="bg-[#faf6ef]">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#7a6d62]">
                  <th className="px-6 py-4 font-cinzel">Product</th>
                  <th className="px-6 py-4 font-cinzel">Price</th>
                  <th className="px-6 py-4 font-cinzel">Stock</th>
                  <th className="px-6 py-4 font-cinzel">Volume</th>
                  <th className="px-6 py-4 font-cinzel">Status</th>
                  <th className="px-6 py-4 font-cinzel">Updated</th>
                  <th className="px-6 py-4 font-cinzel">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e7da]">
                {products.map((product) => (
                  <tr key={product.id} className="align-top text-sm text-[#3f372f]">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        <div className="h-20 w-16 overflow-hidden rounded-xl border border-[#efe4d2] bg-[#faf6ef]">
                          <SafeImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            fallbackClassName="h-full w-full text-[10px]"
                            fallbackLabel={product.name}
                          />
                        </div>
                        <div>
                          <div className="font-cinzel text-sm uppercase tracking-[0.14em] text-[#1A1817]">
                            {product.name}
                          </div>
                          <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7a6d62]">
                            /product/{product.slug}
                          </div>
                          <p className="mt-2 max-w-md text-[#5c5046]">
                            {product.shortDescription || "No description added yet."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-[#1A1817]">
                      {formatRupees(product.price)}
                    </td>
                    <td className="px-6 py-5">{product.stockQuantity}</td>
                    <td className="px-6 py-5">
                      {product.volumeMl ? `${product.volumeMl}ml` : "-"}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge value={product.isActive ? "Active" : "Draft"} />
                    </td>
                    <td className="px-6 py-5 text-[#7a6d62]">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="inline-flex rounded-xl border border-[#d8cab5] px-4 py-2 font-cinzel text-xs uppercase tracking-[0.18em] text-[#1A1817] transition-colors hover:border-[#0A3600] hover:text-[#0A3600]"
                      >
                        Edit Product
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
};

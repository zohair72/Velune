import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const FINAL_ORDER_STATUSES = ["Delivered", "Cancelled"];
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

type CleanupCandidate = {
  id: string;
  order_number: string;
  payment_proof_path: string | null;
  finalized_at: string | null;
  order_status: string;
};

type OrderCleanupResult = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  proofPath: string | null;
  proofDeleted: boolean;
  orderDeleted: boolean;
  skipped?: string;
  error?: string;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const isMissingStorageObjectError = (message: string) =>
  /not found|no such key|object.*not.*found/i.test(message);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required Supabase environment variables for cleanup-finalized-orders.",
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, {
      error:
        "The cleanup function is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const cutoffIso = new Date(Date.now() - THIRTY_DAYS_IN_MS).toISOString();

  const { data: eligibleOrders, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, payment_proof_path, finalized_at, order_status")
    .in("order_status", FINAL_ORDER_STATUSES)
    .not("finalized_at", "is", null)
    .lte("finalized_at", cutoffIso)
    .order("finalized_at", { ascending: true });

  if (fetchError) {
    console.error("Failed to load finalized orders for cleanup.", fetchError);
    return json(500, {
      error: "Failed to load finalized orders for cleanup.",
      details: fetchError.message,
    });
  }

  const orders = (eligibleOrders ?? []) as CleanupCandidate[];

  if (orders.length === 0) {
    return json(200, {
      ok: true,
      deletedCount: 0,
      skippedCount: 0,
      message: "No finalized orders are eligible for cleanup.",
      results: [],
    });
  }

  const results: OrderCleanupResult[] = [];

  for (const order of orders) {
    const proofPath = order.payment_proof_path?.trim() || null;
    let proofDeleted = false;

    if (proofPath) {
      const { error: storageError } = await supabase.storage
        .from(PAYMENT_PROOFS_BUCKET)
        .remove([proofPath]);

      if (storageError) {
        const message = storageError.message || "Unknown storage deletion error.";

        if (!isMissingStorageObjectError(message)) {
          console.error("Failed to delete payment proof during cleanup.", {
            orderId: order.id,
            orderNumber: order.order_number,
            proofPath,
            error: storageError,
          });

          results.push({
            id: order.id,
            orderNumber: order.order_number,
            orderStatus: order.order_status,
            proofPath,
            proofDeleted: false,
            orderDeleted: false,
            skipped:
              "The payment proof could not be deleted, so the order was left in place for a later retry.",
            error: message,
          });
          continue;
        }
      }

      proofDeleted = true;
    }

    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) {
      console.error("Failed to delete finalized order during cleanup.", {
        orderId: order.id,
        orderNumber: order.order_number,
        error: deleteError,
      });

      results.push({
        id: order.id,
        orderNumber: order.order_number,
        orderStatus: order.order_status,
        proofPath,
        proofDeleted,
        orderDeleted: false,
        skipped:
          "The order could not be deleted. It will be retried on the next scheduled run.",
        error: deleteError.message,
      });
      continue;
    }

    results.push({
      id: order.id,
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      proofPath,
      proofDeleted,
      orderDeleted: true,
    });
  }

  const deletedCount = results.filter((result) => result.orderDeleted).length;
  const skippedCount = results.length - deletedCount;

  return json(200, {
    ok: true,
    deletedCount,
    skippedCount,
    cutoffIso,
    results,
  });
});

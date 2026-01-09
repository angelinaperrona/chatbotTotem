import { Hono } from "hono";
import * as ordersModule from "../domains/orders/orders.ts";
import { logAction } from "../platform/audit/logger";

const app = new Hono();

// Role validation helper for order status transitions
function canUpdateOrderStatus(
  userRole: string,
  newStatus: string,
): { allowed: boolean; reason?: string } {
  // Supervisor-level approvals: admin or supervisor
  if (
    newStatus === "supervisor_approved" ||
    newStatus === "supervisor_rejected"
  ) {
    if (userRole === "admin" || userRole === "supervisor") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Solo supervisores pueden aprobar/rechazar a nivel supervisor",
    };
  }

  // Calidda-level approvals: admin only
  if (newStatus === "calidda_approved" || newStatus === "calidda_rejected") {
    if (userRole === "admin") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Solo administradores pueden aprobar/rechazar a nivel Calidda",
    };
  }

  // Mark as delivered: admin or supervisor
  if (newStatus === "delivered") {
    if (userRole === "admin" || userRole === "supervisor") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Solo supervisores pueden marcar como entregado",
    };
  }

  return { allowed: false, reason: "Transición de estado no permitida" };
}

// Get order metrics
app.get("/metrics", async (c) => {
  const metrics = ordersModule.getOrderMetrics();
  return c.json(metrics);
});

// Create order
app.post("/", async (c) => {
  const body = await c.req.json();
  const user = c.get("user");

  const order = ordersModule.createOrder({
    conversationPhone: body.conversationPhone,
    clientName: body.clientName,
    clientDni: body.clientDni,
    products: body.products,
    totalAmount: body.totalAmount,
    deliveryAddress: body.deliveryAddress,
    deliveryReference: body.deliveryReference,
    assignedAgent: user?.id,
  });

  return c.json(order, 201);
});

// Get all orders with filters
app.get("/", async (c) => {
  const status = c.req.query("status");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const assignedAgent = c.req.query("assignedAgent");
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset")
    ? Number(c.req.query("offset"))
    : undefined;

  const ordersData = ordersModule.getOrders({
    status,
    startDate,
    endDate,
    assignedAgent,
    limit,
    offset,
  });

  return c.json(ordersData);
});

// Get order by ID
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  const order = ordersModule.getOrderById(id);

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  return c.json(order);
});

// Get order by conversation phone
app.get("/by-conversation/:phone", async (c) => {
  const { phone } = c.req.param();
  const order = ordersModule.getOrderByConversation(phone);

  if (!order) {
    return c.json({ order: null });
  }

  return c.json({ order });
});

// Update order status
app.patch("/:id/status", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const user = c.get("user");

  // Check role permissions for this status transition
  const permission = canUpdateOrderStatus(user.role, body.status);
  if (!permission.allowed) {
    return c.json({ error: permission.reason }, 403);
  }

  const order = ordersModule.updateOrderStatus(
    id,
    body.status,
    body.notes,
    body.noteType,
  );

  logAction(user.id, "update_order_status", "order", id, {
    newStatus: body.status,
    notes: body.notes,
  });

  return c.json(order);
});

export default app;

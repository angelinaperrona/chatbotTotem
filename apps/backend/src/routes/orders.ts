import { Hono } from "hono";
import { ordersService } from "../services/orders";

const orders = new Hono();

// Get order metrics
orders.get("/metrics", async (c) => {
  const metrics = ordersService.getOrderMetrics();
  return c.json(metrics);
});

// Create order
orders.post("/", async (c) => {
  const body = await c.req.json();
  const user = c.get("user");

  const order = ordersService.createOrder({
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
orders.get("/", async (c) => {
  const status = c.req.query("status");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const assignedAgent = c.req.query("assignedAgent");
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset")
    ? Number(c.req.query("offset"))
    : undefined;

  const ordersData = ordersService.getOrders({
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
orders.get("/:id", async (c) => {
  const { id } = c.req.param();
  const order = ordersService.getOrderById(id);

  if (!order) {
    return c.json({ error: "Order not found" }, 404);
  }

  return c.json(order);
});

// Get order by conversation phone
orders.get("/by-conversation/:phone", async (c) => {
  const { phone } = c.req.param();
  const order = ordersService.getOrderByConversation(phone);

  if (!order) {
    return c.json({ order: null });
  }

  return c.json({ order });
});

// Update order status
orders.patch("/:id/status", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  const order = ordersService.updateOrderStatus(
    id,
    body.status,
    body.notes,
    body.noteType,
  );

  return c.json(order);
});

export default orders;

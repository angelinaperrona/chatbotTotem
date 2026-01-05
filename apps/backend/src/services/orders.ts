import { db } from "../db/connection";
import type { Order } from "@totem/types";
import { notifyTeam } from "./notifier";

interface CreateOrderInput {
  conversationPhone: string;
  clientName: string;
  clientDni: string;
  products: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryReference?: string;
  assignedAgent?: string;
}

interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedAgent?: string;
  limit?: number;
  offset?: number;
}

export class OrdersService {
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `ORD-${year}${month}${day}-${random}`;
  }

  createOrder(input: CreateOrderInput): Order {
    const id = crypto.randomUUID();
    const orderNumber = this.generateOrderNumber();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO orders (
        id, order_number, conversation_phone, client_name, client_dni,
        products, total_amount, delivery_address, delivery_reference,
        status, assigned_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `);

    stmt.run(
      id,
      orderNumber,
      input.conversationPhone,
      input.clientName,
      input.clientDni,
      input.products,
      input.totalAmount,
      input.deliveryAddress,
      input.deliveryReference || null,
      input.assignedAgent || null,
      now,
      now,
    );

    const order = this.getOrderById(id)!;

    notifyTeam(
      "sales",
      `🔔 Nueva orden para aprobación\n\n` +
        `📋 Orden: ${orderNumber}\n` +
        `👤 Cliente: ${input.clientName}\n` +
        `💰 Monto: S/ ${input.totalAmount.toFixed(2)}\n` +
        `📱 Teléfono: ${input.conversationPhone}\n\n` +
        `Revisar en: [Dashboard]/orders/${id}`,
    ).catch((err) => console.error("Failed to notify team:", err));

    return order;
  }

  getOrders(filters: OrderFilters = {}): Order[] {
    let query = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.startDate) {
      const startTs = new Date(filters.startDate).getTime();
      query += " AND created_at >= ?";
      params.push(startTs);
    }

    if (filters.endDate) {
      const endTs = new Date(filters.endDate).getTime() + 86400000; // +1 day
      query += " AND created_at < ?";
      params.push(endTs);
    }

    if (filters.assignedAgent) {
      query += " AND assigned_agent = ?";
      params.push(filters.assignedAgent);
    }

    query += " ORDER BY created_at DESC";

    // Add pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    }));
  }

  getOrderById(id: string): Order | null {
    const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      ...row,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  getOrderByConversation(phone: string): Order | null {
    const stmt = db.prepare(
      "SELECT * FROM orders WHERE conversation_phone = ? ORDER BY created_at DESC LIMIT 1",
    );
    const row = stmt.get(phone) as any;

    if (!row) return null;

    return {
      ...row,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  updateOrderStatus(
    id: string,
    status: string,
    notes?: string,
    noteType?: "supervisor" | "calidda",
  ): Order {
    const now = Date.now();
    let query = "UPDATE orders SET status = ?, updated_at = ?";
    const params: any[] = [status, now];

    if (notes && noteType) {
      const column =
        noteType === "supervisor" ? "supervisor_notes" : "calidda_notes";
      query += `, ${column} = ?`;
      params.push(notes);
    }

    query += " WHERE id = ?";
    params.push(id);

    const stmt = db.prepare(query);
    stmt.run(...params);

    return this.getOrderById(id)!;
  }

  getOrderMetrics() {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalOrders = (
      db.prepare("SELECT COUNT(*) as count FROM orders").get() as any
    ).count;

    const pendingCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
        )
        .get() as any
    ).count;

    const supervisorApprovedCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'supervisor_approved'",
        )
        .get() as any
    ).count;

    const calidaApprovedCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'calidda_approved'",
        )
        .get() as any
    ).count;

    const deliveredCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'",
        )
        .get() as any
    ).count;

    const rejectedCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM orders WHERE status LIKE '%rejected%'",
        )
        .get() as any
    ).count;

    const totalRevenue = (
      db
        .prepare(
          "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'delivered'",
        )
        .get() as any
    ).revenue;

    const revenueThisMonth = (
      db
        .prepare(
          "SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = 'delivered' AND created_at >= ?",
        )
        .get(thirtyDaysAgo) as any
    ).revenue;

    const avgOrderValue =
      deliveredCount > 0 ? totalRevenue / deliveredCount : 0;

    const approvalRate =
      totalOrders > 0
        ? ((deliveredCount + calidaApprovedCount) / totalOrders) * 100
        : 0;

    const rejectionRate =
      totalOrders > 0 ? (rejectedCount / totalOrders) * 100 : 0;

    return {
      totalOrders,
      pendingCount,
      supervisorApprovedCount,
      calidaApprovedCount,
      deliveredCount,
      rejectedCount,
      totalRevenue,
      revenueThisMonth,
      avgOrderValue,
      approvalRate,
      rejectionRate,
    };
  }
}

export const ordersService = new OrdersService();

import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getData();
  const orders = data.orders || [];

  const totalOrders = orders.length;

  const confirmedStatuses = ["Confirmed", "Preparing", "Shipped", "Delivered", "Cash on Delivery", "Pending Verification", "Pending Fawry Payment"];
  const revenueOrders = orders.filter((o: any) => confirmedStatuses.includes(o.status));
  const totalRevenue = revenueOrders.reduce((sum: number, o: any) => sum + (o.total || o.totalPrice || 0), 0);

  const paymentBreakdown: Record<string, number> = {};
  orders.forEach((o: any) => {
    const method = o.paymentMethod || "unknown";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + 1;
  });

  const productSales: Record<string, { name: string; quantity: number }> = {};
  orders.forEach((o: any) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        const key = item.productId || item.name || "unknown";
        if (!productSales[key]) {
          productSales[key] = { name: item.name || key, quantity: 0 };
        }
        productSales[key].quantity += item.quantity || 1;
      });
    } else if (o.productName) {
      const key = o.productName;
      if (!productSales[key]) {
        productSales[key] = { name: key, quantity: 0 };
      }
      productSales[key].quantity += o.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1;
    }
  });
  const bestSellers = Object.values(productSales)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 10);

  const governorateBreakdown: Record<string, number> = {};
  orders.forEach((o: any) => {
    const gov = o.governorate || "Unknown";
    governorateBreakdown[gov] = (governorateBreakdown[gov] || 0) + 1;
  });

  const dailyOrders: { date: string; count: number }[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const dayStart = new Date(dateStr).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = orders.filter((o: any) => o.createdAt >= dayStart && o.createdAt < dayEnd).length;
    dailyOrders.push({ date: dateStr, count });
  }

  const customers = data.customers || [];
  const totalCustomers = customers.length;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newCustomersThisMonth = customers.filter((c: any) => c.createdAt >= thirtyDaysAgo).length;

  const topSpenders = [...customers]
    .sort((a: any, b: any) => (b.lifetimeSpend || 0) - (a.lifetimeSpend || 0))
    .slice(0, 5)
    .map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, lifetimeSpend: c.lifetimeSpend || 0, orderCount: c.orderCount || 0 }));

  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const customersWithCart = new Set<string>();
  orders.forEach((o: any) => {
    const status = o.status || "";
    if (["Pending Verification", "Pending Fawry Payment", "Unconfirmed", "Cash on Delivery"].includes(status) && o.createdAt < twoDaysAgo) {
      if (o.customerId) customersWithCart.add(o.customerId);
    }
  });
  const abandonedCart = customersWithCart.size;

  const revenuePerCustomerAvg = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    paymentBreakdown,
    bestSellers,
    governorateBreakdown,
    dailyOrders,
    totalCustomers,
    newCustomersThisMonth,
    topSpenders,
    abandonedCart,
    revenuePerCustomerAvg,
  });
}

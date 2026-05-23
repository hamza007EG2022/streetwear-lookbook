import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({ addresses: customer.addresses || [] });
}

export async function POST(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { label, address, governorate, isDefault } = await req.json();
  if (!address || !governorate) return NextResponse.json({ error: "Address and governorate required" }, { status: 400 });

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if (!customer.addresses) customer.addresses = [];
  if (isDefault) {
    customer.addresses.forEach((a: any) => a.isDefault = false);
  }
  customer.addresses.push({ id: uuidv4(), label: label || "Home", address, governorate, isDefault: !!isDefault });
  await saveData(data);

  return NextResponse.json({ addresses: customer.addresses });
}

export async function DELETE(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { addressId } = await req.json();
  if (!addressId) return NextResponse.json({ error: "Address ID required" }, { status: 400 });

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  customer.addresses = (customer.addresses || []).filter((a: any) => a.id !== addressId);
  await saveData(data);

  return NextResponse.json({ addresses: customer.addresses });
}

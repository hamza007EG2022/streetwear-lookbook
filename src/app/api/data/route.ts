import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

export async function GET() {
  const data = await getData();
  const { adminPassword, adminToken, chats, encryptionKey, ...publicData } = data;
  return NextResponse.json(publicData);
}

export async function PUT(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();
    const data = await getData();

    if (updates.brand) data.brand = { ...data.brand, ...updates.brand };
    if (updates.colors) data.colors = { ...data.colors, ...updates.colors };
    if (updates.hero) data.hero = { ...data.hero, ...updates.hero };
    if (updates.about) data.about = { ...data.about, ...updates.about };
    if (updates.contact) data.contact = { ...data.contact, ...updates.contact };
    if (updates.password) {
      const bcrypt = await import("bcryptjs");
      data.adminPassword = await bcrypt.hash(updates.password, 10);
    }

    await saveData(data);

    const { adminPassword, adminToken, chats, encryptionKey, ...publicData } = data;
    return NextResponse.json(publicData);
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const action = await req.json();
    const data = await getData();

    switch (action.type) {
      case "add-product": {
        const { v4: uuid } = await import("uuid");
        data.products.push({ id: uuid(), ...action.product });
        break;
      }
      case "edit-product": {
        const idx = data.products.findIndex((p) => p.id === action.product.id);
        if (idx !== -1) data.products[idx] = action.product;
        break;
      }
      case "delete-product": {
        data.products = data.products.filter((p) => p.id !== action.id);
        break;
      }
      case "add-lookbook": {
        const { v4: uuid } = await import("uuid");
        data.lookbook.push({
          id: uuid(),
          photo: action.photo,
          caption: action.caption || "",
          order: data.lookbook.length,
        });
        break;
      }
      case "remove-lookbook": {
        data.lookbook = data.lookbook.filter((l) => l.id !== action.id);
        break;
      }
      case "reorder-lookbook": {
        data.lookbook = action.items;
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveData(data);
    const { adminPassword, adminToken, chats, encryptionKey, ...publicData } = data;
    return NextResponse.json(publicData);
  } catch {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

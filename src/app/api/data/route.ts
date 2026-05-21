import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

export async function GET() {
  const data = await getData();
  const { adminPassword, adminToken, chats, orders, encryptionKey, ...publicData } = data;
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
    if (updates.marquee) data.marquee = { ...data.marquee, ...updates.marquee };
    if (updates.pages) data.pages = { ...data.pages, ...updates.pages };
    if (updates.tasks) data.tasks = updates.tasks;
    if (updates.banners) data.banners = updates.banners;

    await saveData(data);

    const { adminPassword, adminToken, chats, orders, encryptionKey, ...publicData } = data;
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
      case "add-collection": {
        const { v4: uuid } = await import("uuid");
        data.collections.push({ id: uuid(), title: action.title, category: action.category, photo: action.photo || "" });
        break;
      }
      case "update-collection": {
        const ci = data.collections.findIndex((c) => c.id === action.id);
        if (ci !== -1) data.collections[ci] = { ...data.collections[ci], ...action };
        break;
      }
      case "remove-collection": {
        data.collections = data.collections.filter((c) => c.id !== action.id);
        break;
      }
      case "add-review": {
        const { v4: uuid } = await import("uuid");
        data.reviews.push({ id: uuid(), photo: action.photo || "", name: action.name || "", quote: action.quote || "", rating: action.rating || 5, type: action.mediaType || "photo" });
        break;
      }
      case "update-review": {
        const ri = data.reviews.findIndex((r: any) => r.id === action.id);
        if (ri !== -1) data.reviews[ri] = { ...data.reviews[ri], ...action };
        break;
      }
      case "remove-review": {
        data.reviews = data.reviews.filter((r: any) => r.id !== action.id);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await saveData(data);
    const { adminPassword, adminToken, chats, orders, encryptionKey, ...publicData } = data;
    return NextResponse.json(publicData);
  } catch {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

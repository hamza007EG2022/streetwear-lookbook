"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[420px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
        open ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
          <h2 className="text-sm font-bold tracking-widest uppercase">Cart ({totalItems})</h2>
          <button onClick={onClose} className="text-sm opacity-30 hover:opacity-100 transition-opacity">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-16">Your cart is empty</p>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.productId}_${item.size}_${item.color || ""}_${idx}`} className="flex gap-4 border-b border-black/5 pb-4">
                <div className="w-16 h-20 bg-zinc-100 flex-shrink-0 overflow-hidden">
                  <img src={item.photo} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex gap-2 mt-0.5 text-[10px] tracking-wider uppercase opacity-40">
                    {item.colorLabel && <span>{item.colorLabel}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}
                        className="w-6 h-6 border border-black/10 text-xs flex items-center justify-center hover:bg-zinc-100 transition-colors">−</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}
                        className="w-6 h-6 border border-black/10 text-xs flex items-center justify-center hover:bg-zinc-100 transition-colors">+</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.discountPrice || item.price}</span>
                      <button onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-[10px] opacity-30 hover:opacity-100 transition-opacity uppercase tracking-wider">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-black/10 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-50">Subtotal</span>
              <span className="text-base font-bold">{totalPrice}</span>
            </div>
            <button onClick={() => { onClose(); router.push("/checkout"); }}
              className="w-full bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:opacity-80 transition-opacity">
              CHECKOUT
            </button>
            <Link href="/" onClick={onClose} className="block text-center text-[10px] tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity">
              CONTINUE SHOPPING
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

import { getData } from "./store";

type WhatsAppProvider = "callmebot" | "whatsapp_cloud" | "wa_me";

function toInternational(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  return clean.startsWith("20") ? clean : "2" + clean.replace(/^0\+?/, "");
}

export async function sendWhatsApp(to: string, message: string, silent?: boolean): Promise<void> {
  try {
    const data = await getData();
    const provider: WhatsAppProvider = (data.contact?.whatsappProvider as WhatsAppProvider) || "wa_me";
    const apiKey = data.contact?.whatsappApiKey || "";
    const phoneNumberId = data.contact?.whatsappPhoneNumberId || "";

    if (!silent) {
      console.log(`[WhatsApp] To: ${to} | Provider: ${provider} | Message: ${message.slice(0, 60)}...`);
    }

    const intlPhone = toInternational(to);

    if (provider === "callmebot" && apiKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${intlPhone}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.error(`[WhatsApp] CallMeBot error (${res.status}):`, text.slice(0, 200));
      }
      return;
    }

    if (provider === "whatsapp_cloud" && apiKey && phoneNumberId) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: intlPhone,
          type: "text",
          text: { body: message },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[WhatsApp] Cloud API error (${res.status}):`, text.slice(0, 300));
      }
      return;
    }
  } catch (e) {
    console.error("[WhatsApp] Send error:", (e as Error).message);
  }
}

export async function testWhatsAppConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await getData();
    const provider: WhatsAppProvider = (data.contact?.whatsappProvider as WhatsAppProvider) || "wa_me";
    const apiKey = data.contact?.whatsappApiKey || "";
    const phoneNumberId = data.contact?.whatsappPhoneNumberId || "";
    const adminPhone = data.contact?.whatsapp || "";

    if (!adminPhone) {
      return { ok: false, error: "Admin WhatsApp number not set (Contact → WhatsApp Number)" };
    }

    if (provider === "wa_me") {
      return { ok: true };
    }

    if (provider === "callmebot") {
      if (!apiKey) return { ok: false, error: "API key is required for CallMeBot" };
      const intlPhone = toInternational(adminPhone);
      const res = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${intlPhone}&text=${encodeURIComponent("🧪 TRIO FASHION — Test message from admin dashboard. If you receive this, WhatsApp is working!")}&apikey=${encodeURIComponent(apiKey)}`);
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `CallMeBot error (${res.status}): ${text.slice(0, 100)}` };
      }
      return { ok: true };
    }

    if (provider === "whatsapp_cloud") {
      if (!apiKey) return { ok: false, error: "Access token is required for WhatsApp Cloud API" };
      if (!phoneNumberId) return { ok: false, error: "Phone Number ID is required for WhatsApp Cloud API" };
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toInternational(adminPhone),
          type: "text",
          text: { body: "🧪 TRIO FASHION — Test message from admin dashboard. If you receive this, WhatsApp is working!" },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Cloud API error (${res.status}): ${text.slice(0, 200)}` };
      }
      return { ok: true };
    }

    return { ok: false, error: `Unknown provider: ${provider}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

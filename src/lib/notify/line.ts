/**
 * LINE Notify integration.
 *
 * Note: LINE Notify (notify-bot.line.me) was officially shut down 2025-03-31.
 * This module uses LINE Messaging API (Push API) instead.
 *
 * Required env vars:
 *   LINE_CHANNEL_ACCESS_TOKEN — Long-lived access token from LINE Developers Console
 *   LINE_DEFAULT_TARGET_USER_ID — Default user/group ID to push messages to
 */

interface LineMessage {
  type: "text" | "flex";
  text?: string;
  altText?: string;
  contents?: unknown;
}

export async function sendLinePush(opts: {
  to?: string;
  messages: LineMessage[];
}): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const target = opts.to ?? process.env.LINE_DEFAULT_TARGET_USER_ID;
  if (!token) return { ok: false, error: "LINE_CHANNEL_ACCESS_TOKEN not configured" };
  if (!target) return { ok: false, error: "No LINE target user/group ID" };

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: target, messages: opts.messages }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `LINE API ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function notifyOrderCreated(orderInfo: {
  orderId: string;
  customerName: string;
  totalAmount: number;
}): Promise<void> {
  await sendLinePush({
    messages: [
      {
        type: "text",
        text: `📦 ออเดอร์ใหม่\nลูกค้า: ${orderInfo.customerName}\nยอด: ${orderInfo.totalAmount.toLocaleString("th-TH")} บาท\nเลขที่: ${orderInfo.orderId}`,
      },
    ],
  });
}

export async function notifyInvoicePaid(info: {
  invoiceNumber: string;
  customerName: string;
  amount: number;
}): Promise<void> {
  await sendLinePush({
    messages: [
      {
        type: "text",
        text: `✅ รับชำระแล้ว\n${info.invoiceNumber}\nจาก: ${info.customerName}\nยอด: ${info.amount.toLocaleString("th-TH")} บาท`,
      },
    ],
  });
}

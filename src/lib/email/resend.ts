import { Resend } from "resend";

let _resend: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  replyTo?: string;
}

export async function sendEmail(
  opts: SendEmailOptions,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY not configured" };
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";
  const fromName = process.env.RESEND_FROM_NAME ?? "UniformFlow";

  try {
    const res = await client.emails.send({
      from: `${fromName} <${from}>`,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
      })),
    });
    if (res.error) return { ok: false, error: String(res.error) };
    return { ok: true, id: res.data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function buildInvoiceEmailHTML(opts: {
  invoiceNumber: string;
  customerName: string;
  grandTotal: number;
  amountDue: number;
  dueDate: Date;
  companyName: string;
  hasPromptPay?: boolean;
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><title>${opts.invoiceNumber}</title></head>
<body style="font-family:-apple-system,'Segoe UI',Tahoma,sans-serif;background:#f7fafc;padding:24px;color:#1a202c;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="color:#1d4ed8;margin:0 0 8px;">เรียน คุณ ${opts.customerName}</h2>
    <p>${opts.companyName} ขอนำส่งใบกำกับภาษีเลขที่ <strong>${opts.invoiceNumber}</strong></p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#718096;">ยอดรวมทั้งสิ้น</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;">${fmt(opts.grandTotal)} บาท</td></tr>
      <tr><td style="padding:6px 0;color:#718096;">ค้างชำระ</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#dc2626;">${fmt(opts.amountDue)} บาท</td></tr>
      <tr><td style="padding:6px 0;color:#718096;">ครบกำหนดชำระ</td>
          <td style="padding:6px 0;text-align:right;">${opts.dueDate.toLocaleDateString("th-TH")}</td></tr>
    </table>

    ${opts.hasPromptPay ? `<p style="background:#eff6ff;padding:12px;border-radius:6px;font-size:14px;">
      💡 ใบกำกับภาษีในไฟล์แนบมี QR PromptPay สำหรับชำระเงิน
    </p>` : ""}

    <p style="font-size:13px;color:#718096;margin-top:24px;">
      หากมีข้อสงสัย กรุณาตอบกลับอีเมลฉบับนี้
    </p>
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="font-size:12px;color:#a0aec0;text-align:center;">${opts.companyName}</p>
  </div>
</body>
</html>`;
}

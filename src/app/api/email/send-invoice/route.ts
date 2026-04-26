import { NextRequest, NextResponse } from "next/server";
import { sendEmail, buildInvoiceEmailHTML } from "@/lib/email/resend";

export const runtime = "nodejs";

interface SendInvoiceRequest {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  grandTotal: number;
  amountDue: number;
  dueDate: string; // ISO
  companyName: string;
  hasPromptPay?: boolean;
  pdfBase64?: string;
  ccEmail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendInvoiceRequest;
    if (!body.customerEmail) {
      return NextResponse.json({ ok: false, error: "Missing customerEmail" }, { status: 400 });
    }
    const html = buildInvoiceEmailHTML({
      invoiceNumber: body.invoiceNumber,
      customerName: body.customerName,
      grandTotal: body.grandTotal,
      amountDue: body.amountDue,
      dueDate: new Date(body.dueDate),
      companyName: body.companyName,
      hasPromptPay: body.hasPromptPay,
    });
    const to = body.ccEmail ? [body.customerEmail, body.ccEmail] : body.customerEmail;
    const result = await sendEmail({
      to,
      subject: `ใบกำกับภาษี ${body.invoiceNumber} จาก ${body.companyName}`,
      html,
      attachments: body.pdfBase64
        ? [
            {
              filename: `${body.invoiceNumber}.pdf`,
              content: body.pdfBase64,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

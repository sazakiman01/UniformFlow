"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered, colors } from "./theme";
import { formatTHB, bahtText } from "@/lib/money";
import { formatAddressLine } from "@/lib/company";
import type { BillingNote } from "@/lib/billing-notes";
import type { CompanyProfile } from "@/types";

export default function BillingNotePDF({ note, company }: { note: BillingNote; company: CompanyProfile }) {
  ensureFontsRegistered();

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        <View style={docStyles.header}>
          <View style={docStyles.companyBlock}>
            {company.logoUrl ? <Image src={company.logoUrl} style={docStyles.logo} /> : null}
            <View>
              <Text style={docStyles.companyName}>{company.name}</Text>
              <Text style={docStyles.smallMuted}>เลขประจำตัวผู้เสียภาษี: {company.taxId}</Text>
              <Text style={docStyles.smallMuted}>{formatAddressLine(company.address)}</Text>
              <Text style={docStyles.smallMuted}>โทร: {company.phone}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>ใบวางบิล</Text>
            <Text style={{ fontSize: 9, color: colors.muted }}>BILLING NOTE</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: `1pt solid ${colors.border}`,
            borderBottom: `1pt solid ${colors.border}`,
            paddingVertical: 6,
            fontSize: 9,
          }}
        >
          <Text>
            <Text style={docStyles.metaLabel}>เลขที่:</Text>
            {note.number}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>วันที่วางบิล:</Text>
            {note.issueDate.toLocaleDateString("th-TH")}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>กำหนดชำระ:</Text>
            {note.dueDate.toLocaleDateString("th-TH")}
          </Text>
        </View>

        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>ลูกค้า</Text>
            <Text style={docStyles.customerName}>{note.customerSnapshot?.name ?? "-"}</Text>
            {note.customerSnapshot?.taxId && (
              <Text style={docStyles.smallMuted}>TIN: {note.customerSnapshot.taxId}</Text>
            )}
            <Text style={docStyles.smallMuted}>{formatAddressLine(note.customerSnapshot?.address)}</Text>
          </View>
          {note.collectorName && (
            <View style={docStyles.col}>
              <Text style={docStyles.sectionLabel}>ผู้เก็บเงิน</Text>
              <Text>{note.collectorName}</Text>
              {note.collectDate && (
                <Text style={docStyles.smallMuted}>
                  นัด: {note.collectDate.toLocaleDateString("th-TH")}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ marginTop: 10, marginBottom: 4, fontSize: 10 }}>
          <Text>โปรดชำระเงินตามใบแจ้งหนี้ดังต่อไปนี้:</Text>
        </View>

        <View style={docStyles.table}>
          <View style={docStyles.tableHead}>
            <Text style={{ flex: 1, textAlign: "center" }}>#</Text>
            <Text style={{ flex: 3 }}>เลขที่ใบแจ้งหนี้</Text>
            <Text style={{ flex: 2 }}>วันที่</Text>
            <Text style={{ flex: 4 }}>รายการ</Text>
            <Text style={{ flex: 2, textAlign: "right" }}>ยอดรวม</Text>
            <Text style={{ flex: 2, textAlign: "right" }}>ค้างชำระ</Text>
          </View>
          {note.items.map((it, i) => (
            <View key={i} style={docStyles.tableRow}>
              <Text style={{ flex: 1, textAlign: "center" }}>{i + 1}</Text>
              <Text style={{ flex: 3, fontFamily: "Sarabun" }}>{it.invoiceNumber}</Text>
              <Text style={{ flex: 2 }}>{it.issueDate.toLocaleDateString("th-TH")}</Text>
              <Text style={{ flex: 4, fontSize: 9 }}>{it.description}</Text>
              <Text style={{ flex: 2, textAlign: "right" }}>{formatTHB(it.amount)}</Text>
              <Text style={{ flex: 2, textAlign: "right", fontWeight: 700 }}>
                {formatTHB(it.amountDue)}
              </Text>
            </View>
          ))}
        </View>

        <View style={docStyles.totals}>
          <View style={docStyles.grandRow}>
            <Text style={docStyles.grandLabel}>ยอดที่ต้องชำระ</Text>
            <Text style={docStyles.grandValue}>{formatTHB(note.totalAmount)}</Text>
          </View>
        </View>

        <View style={docStyles.bahtTextBox}>
          <Text>(ตัวอักษร: {bahtText(note.totalAmount)})</Text>
        </View>

        {note.notes && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>หมายเหตุ</Text>
            <Text>{note.notes}</Text>
          </View>
        )}

        <View style={docStyles.signature}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้วางบิล</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>
              วันที่ {note.issueDate.toLocaleDateString("th-TH")}
            </Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับวางบิล</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{note.customerSnapshot?.name ?? "________________"}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>วันที่ ___________</Text>
          </View>
        </View>

        <Text
          style={docStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${company.name} · ${note.number} · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

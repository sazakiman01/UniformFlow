"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered } from "./theme";
import { formatTHB, bahtText } from "@/lib/money";
import { formatAddressLine } from "@/lib/company";
import type { Quotation, CompanyProfile } from "@/types";

interface Props {
  quotation: Quotation;
  company: CompanyProfile;
}

export default function QuotationPDF({ quotation, company }: Props) {
  ensureFontsRegistered();

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        {/* Header */}
        <View style={docStyles.header}>
          <View style={docStyles.companyBlock}>
            {company.logoUrl ? <Image src={company.logoUrl} style={docStyles.logo} /> : null}
            <View>
              <Text style={docStyles.companyName}>{company.name}</Text>
              <Text style={docStyles.smallMuted}>เลขประจำตัวผู้เสียภาษี: {company.taxId}</Text>
              <Text style={docStyles.smallMuted}>{formatAddressLine(company.address)}</Text>
              <Text style={docStyles.smallMuted}>
                โทร: {company.phone}
                {company.email ? ` · ${company.email}` : ""}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>ใบเสนอราคา</Text>
            <Text style={{ fontSize: 9, color: "#6B7280" }}>QUOTATION</Text>
          </View>
        </View>

        {/* Doc meta */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: "1pt solid #E5E7EB",
            borderBottom: "1pt solid #E5E7EB",
            paddingVertical: 6,
            fontSize: 9,
          }}
        >
          <Text>
            <Text style={docStyles.metaLabel}>เลขที่:</Text>
            {quotation.number}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>วันที่ออก:</Text>
            {quotation.createdAt.toLocaleDateString("th-TH")}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>ยืนราคาถึง:</Text>
            {quotation.validUntil.toLocaleDateString("th-TH")}
          </Text>
        </View>

        {/* Customer */}
        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>เสนอให้</Text>
            <Text style={docStyles.customerName}>{quotation.customerSnapshot?.name ?? "-"}</Text>
            {quotation.customerSnapshot?.taxId && (
              <Text style={docStyles.smallMuted}>
                TIN: {quotation.customerSnapshot.taxId}
                {quotation.customerSnapshot.branchCode ? ` (สาขา ${quotation.customerSnapshot.branchCode})` : ""}
              </Text>
            )}
            <Text style={docStyles.smallMuted}>
              {formatAddressLine(quotation.customerSnapshot?.address)}
            </Text>
            {quotation.customerSnapshot?.phone && (
              <Text style={docStyles.smallMuted}>โทร: {quotation.customerSnapshot.phone}</Text>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={docStyles.table}>
          <View style={docStyles.tableHead}>
            <Text style={docStyles.cellName}>รายการ</Text>
            <Text style={docStyles.cellQty}>จำนวน</Text>
            <Text style={docStyles.cellUnit}>หน่วย</Text>
            <Text style={docStyles.cellPrice}>ราคา/หน่วย</Text>
            <Text style={docStyles.cellAmount}>รวม</Text>
          </View>
          {quotation.items.map((it, i) => (
            <View key={i} style={docStyles.tableRow}>
              <View style={docStyles.cellName}>
                <Text>{it.productName}</Text>
                {it.description ? <Text style={docStyles.smallMuted}>{it.description}</Text> : null}
              </View>
              <Text style={docStyles.cellQty}>{it.quantity}</Text>
              <Text style={docStyles.cellUnit}>{it.unit ?? ""}</Text>
              <Text style={docStyles.cellPrice}>{formatTHB(it.unitPrice)}</Text>
              <Text style={docStyles.cellAmount}>{formatTHB(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={docStyles.totals}>
          <View style={docStyles.totalRow}>
            <Text style={docStyles.totalLabel}>มูลค่าก่อน VAT</Text>
            <Text style={docStyles.totalValue}>{formatTHB(quotation.subtotal)}</Text>
          </View>
          {quotation.discountAmount > 0 && (
            <View style={docStyles.totalRow}>
              <Text style={docStyles.totalLabel}>ส่วนลด</Text>
              <Text style={docStyles.totalValue}>−{formatTHB(quotation.discountAmount)}</Text>
            </View>
          )}
          <View style={docStyles.totalRow}>
            <Text style={docStyles.totalLabel}>ภาษีมูลค่าเพิ่ม {quotation.vatRate}%</Text>
            <Text style={docStyles.totalValue}>{formatTHB(quotation.vatAmount)}</Text>
          </View>
          <View style={docStyles.grandRow}>
            <Text style={docStyles.grandLabel}>รวมทั้งสิ้น</Text>
            <Text style={docStyles.grandValue}>{formatTHB(quotation.grandTotal)}</Text>
          </View>
        </View>

        <View style={docStyles.bahtTextBox}>
          <Text>(ตัวอักษร: {bahtText(quotation.grandTotal)})</Text>
        </View>

        {quotation.notes && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>หมายเหตุ</Text>
            <Text>{quotation.notes}</Text>
          </View>
        )}

        {quotation.termsAndConditions && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>เงื่อนไข</Text>
            <Text>{quotation.termsAndConditions}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={docStyles.signature}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: "#6B7280" }}>ผู้เสนอราคา</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: "#6B7280" }}>ผู้อนุมัติ</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>วันที่ ___________</Text>
          </View>
        </View>

        <Text style={docStyles.footer} render={({ pageNumber, totalPages }) =>
          `${company.name} · ${quotation.number} · หน้า ${pageNumber}/${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
}

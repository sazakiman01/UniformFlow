"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered, colors } from "./theme";
import { formatAddressLine } from "@/lib/company";
import type { DeliveryNote, CompanyProfile } from "@/types";

interface Props {
  note: DeliveryNote;
  company: CompanyProfile;
}

export default function DeliveryNotePDF({ note, company }: Props) {
  ensureFontsRegistered();

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        <View style={docStyles.header}>
          <View style={docStyles.companyBlock}>
            {company.logoUrl ? <Image src={company.logoUrl} style={docStyles.logo} /> : null}
            <View>
              <Text style={docStyles.companyName}>{company.name}</Text>
              <Text style={docStyles.smallMuted}>{formatAddressLine(company.address)}</Text>
              <Text style={docStyles.smallMuted}>โทร: {company.phone}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>ใบส่งของ</Text>
            <Text style={{ fontSize: 9, color: colors.muted }}>DELIVERY NOTE</Text>
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
            <Text style={docStyles.metaLabel}>วันที่ส่ง:</Text>
            {note.deliveryDate.toLocaleDateString("th-TH")}
          </Text>
          {note.invoiceId && (
            <Text>
              <Text style={docStyles.metaLabel}>อ้างอิง:</Text>
              {note.invoiceId}
            </Text>
          )}
        </View>

        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>ผู้รับ</Text>
            <Text style={docStyles.customerName}>{note.customerSnapshot?.name ?? "-"}</Text>
            <Text style={docStyles.smallMuted}>{formatAddressLine(note.deliveryAddress ?? note.customerSnapshot?.address)}</Text>
            {note.customerSnapshot?.phone && (
              <Text style={docStyles.smallMuted}>โทร: {note.customerSnapshot.phone}</Text>
            )}
            {note.receivedBy && (
              <Text style={docStyles.smallMuted}>ผู้รับ: {note.receivedBy}</Text>
            )}
          </View>
          {(note.carrier || note.trackingNo) && (
            <View style={docStyles.col}>
              <Text style={docStyles.sectionLabel}>การจัดส่ง</Text>
              {note.carrier && <Text>{note.carrier}</Text>}
              {note.trackingNo && (
                <Text style={{ fontSize: 9, fontFamily: "Sarabun" }}>Tracking: {note.trackingNo}</Text>
              )}
            </View>
          )}
        </View>

        <View style={docStyles.table}>
          <View style={docStyles.tableHead}>
            <Text style={{ flex: 1, textAlign: "center" }}>#</Text>
            <Text style={{ flex: 6 }}>รายการ</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>จำนวน</Text>
            <Text style={{ flex: 1 }}>หน่วย</Text>
            <Text style={{ flex: 2 }}>หมายเหตุ</Text>
          </View>
          {note.items.map((it, i) => (
            <View key={i} style={docStyles.tableRow}>
              <Text style={{ flex: 1, textAlign: "center" }}>{i + 1}</Text>
              <View style={{ flex: 6 }}>
                <Text>{it.productName}</Text>
                {it.description ? <Text style={docStyles.smallMuted}>{it.description}</Text> : null}
              </View>
              <Text style={{ flex: 1, textAlign: "right" }}>{it.quantity}</Text>
              <Text style={{ flex: 1 }}>{it.unit ?? ""}</Text>
              <Text style={{ flex: 2, fontSize: 9, color: colors.muted }}></Text>
            </View>
          ))}
        </View>

        {note.notes && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>หมายเหตุ</Text>
            <Text>{note.notes}</Text>
          </View>
        )}

        <View style={docStyles.signature}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้ส่งของ</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>
              วันที่ {note.deliveryDate.toLocaleDateString("th-TH")}
            </Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับสินค้า</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{note.receivedBy ?? "________________"}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>วันที่ ___________</Text>
          </View>
        </View>

        <Text
          style={docStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${company.name} · ${note.number} · หน้า ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

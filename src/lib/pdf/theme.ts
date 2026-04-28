import { Font, StyleSheet } from "@react-pdf/renderer";

// Noto Sans Thai is the Thai default font (open license, hosted on Google Fonts).
// React-PDF requires absolute URLs for font files.
// Using GitHub raw URLs from official Google Noto Fonts repo for stability.
let _registered = false;
export function ensureFontsRegistered() {
  if (_registered) return;
  Font.register({
    family: "Noto Sans Thai",
    fonts: [
      { src: "https://raw.githubusercontent.com/notofonts/thai/main/hinted/ttf/NotoSansThai-Regular.ttf", fontWeight: 400 },
      { src: "https://raw.githubusercontent.com/notofonts/thai/main/hinted/ttf/NotoSansThai-SemiBold.ttf", fontWeight: 600 },
      { src: "https://raw.githubusercontent.com/notofonts/thai/main/hinted/ttf/NotoSansThai-Bold.ttf", fontWeight: 700 },
    ],
  });
  _registered = true;
}

export const colors = {
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  primary: "#1D4ED8",
  bgRow: "#F9FAFB",
};

export const docStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Noto Sans Thai",
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.4,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  companyBlock: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  logo: { width: 56, height: 56, objectFit: "contain" },
  companyName: { fontSize: 14, fontWeight: 700 },
  smallMuted: { fontSize: 9, color: colors.muted },
  docTitle: { fontSize: 16, fontWeight: 700, color: colors.primary },
  docMetaRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 9 },
  metaLabel: { color: colors.muted, marginRight: 6 },
  twoCol: { flexDirection: "row", gap: 16, marginTop: 12, marginBottom: 12 },
  col: { flex: 1 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 1,
  },
  customerName: { fontSize: 11, fontWeight: 600 },
  table: { borderTop: `1pt solid ${colors.border}`, marginTop: 8 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.bgRow,
    borderBottom: `1pt solid ${colors.border}`,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 700,
    color: colors.muted,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1pt solid ${colors.border}`,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cellName: { flex: 5 },
  cellQty: { flex: 1, textAlign: "right" },
  cellUnit: { flex: 1 },
  cellPrice: { flex: 2, textAlign: "right" },
  cellAmount: { flex: 2, textAlign: "right" },
  totals: { marginTop: 10, alignSelf: "flex-end", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { color: colors.muted },
  totalValue: { fontWeight: 600 },
  grandRow: {
    borderTop: `1pt solid ${colors.border}`,
    marginTop: 4,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  grandLabel: { fontWeight: 700 },
  grandValue: { fontWeight: 700, color: colors.primary, fontSize: 13 },
  bahtTextBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: colors.bgRow,
    border: `1pt solid ${colors.border}`,
    borderRadius: 3,
  },
  notes: { marginTop: 14, fontSize: 9, color: colors.muted },
  signature: {
    marginTop: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
  },
  sigBox: { flex: 1, marginRight: 16, alignItems: "center" },
  sigLine: { borderTop: `1pt solid ${colors.text}`, width: "80%", marginTop: 36 },
  qrBox: { width: 90, height: 90, marginLeft: 16 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: colors.muted,
    textAlign: "center",
  },
});

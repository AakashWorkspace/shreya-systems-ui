import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import stampImage from '../images/signature.jpeg'
import logoImage  from '../images/logo.png'

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  ink:      '#0f0f1a',
  inkLight: '#1e1e2e',
  gold:     '#c9960e',
  goldLight:'#e8b83c',
  white:    '#ffffff',
  offWhite: '#f4f4f6',
  border:   '#d4a017',
  muted:    '#888899',
  row1:     '#f9f8f4',
  row2:     '#ffffff',
}

// ─── Currency formatter (avoid ₹ glyph — Helvetica can't render it) ────────
// Use "Rs." prefix so no broken character appears in PDF.
const fmt = (n) => {
  const num = Number(n) || 0
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// A4 page is 595 pt wide × 842 pt tall.
// Layout target:
//   top section (header + parties)  : ~25%  ≈ 210 pt
//   items section                   : ~50%  ≈ 421 pt
//   bottom section (totals → footer): ~25%  ≈ 211 pt  ← absolute, pinned to bottom
const PAGE_H = 842
const PAGE_W = 595
const BOTTOM_H = 230   // height reserved at bottom (absolute block)
const TOP_H    = Math.floor(PAGE_H * 0.25)  // 210

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    fontSize: 9,
    color: '#000000',
    // No padding on page itself — we control it per-section
  },

  // ── TOP 25%: header + parties ────────────────────────────────────────────
  topBlock: {
    height: TOP_H,
    overflow: 'hidden',
  },

  headerBand: {
    backgroundColor: '#A4C2F4',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName:   { fontSize: 19.5, fontWeight: 700, color: '#000a52', letterSpacing: 1.5, marginBottom: 2 },
  companyTagline:{ fontSize: 8.5, color: '#000000', letterSpacing: 0.8 },
  companyMeta:   { fontSize: 8.5, color: '#000000', lineHeight: 1.5, marginTop: 4 },
  quoteTitle:    { fontSize: 21.5, fontWeight: 700, color: '#000000', letterSpacing: 2.5, textAlign: 'right' },
  quoteMeta:     { fontSize: 9, color: '#000000', textAlign: 'right', marginTop: 3, lineHeight: 1.6 },
  quoteNumber:   { fontSize: 10, color: '#000000', textAlign: 'right', fontWeight: 700 },

  goldDivider:   { height: 3, backgroundColor: C.gold },
  thinDivider:   { height: 1, backgroundColor: '#e8e0c8', marginHorizontal: 28 },

  partiesRow:    { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 10, gap: 20 },
  partyBox:      { flex: 1 },
  partyLabel:    { fontSize: 8, fontWeight: 700, color: '#000000', letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' },
  partyName:     { fontSize: 10.5, fontWeight: 700, color: '#000000', marginBottom: 2 },
  partyMeta:     { fontSize: 8.5, color: '#000000', lineHeight: 1.55 },

  // ── MIDDLE 50%: items table ───────────────────────────────────────────────
  middleBlock: {
    // Takes remaining space (flex-grow doesn't work well in react-pdf absolute layout)
    // Instead we use fixed height = PAGE_H - TOP_H - BOTTOM_H
    height: PAGE_H - TOP_H - BOTTOM_H,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 4,
  },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#6d9eeb',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  thSn:   { width: 22,  fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4 },
  thDesc: { flex: 1,    fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4 },
  thHsn:  { width: 52,  fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4, textAlign: 'center' },
  thQty:  { width: 26,  fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4, textAlign: 'center' },
  thRate: { width: 60,  fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4, textAlign: 'right' },
  thAmt:  { width: 68,  fontSize: 8.5, fontWeight: 700, color: '#000000', letterSpacing: 0.4, textAlign: 'right' },

  rowEven: { flexDirection: 'row', paddingVertical: 5.5, paddingHorizontal: 8, backgroundColor: C.row1, borderBottomWidth: 1, borderBottomColor: '#ece8d8' },
  rowOdd:  { flexDirection: 'row', paddingVertical: 5.5, paddingHorizontal: 8, backgroundColor: C.row2, borderBottomWidth: 1, borderBottomColor: '#ece8d8' },
  tdSn:       { width: 22,  fontSize: 9, color: '#000000' },
  tdDesc:     { flex: 1 },
  tdDescName: { fontSize: 9.5, fontWeight: 700, color: '#000000', marginBottom: 1 },
  tdDescSub:  { fontSize: 8, color: '#000000', lineHeight: 1.4 },
  tdHsn:  { width: 52,  fontSize: 8.5, color: '#000000', textAlign: 'center' },
  tdQty:  { width: 26,  fontSize: 9.5, textAlign: 'center', fontWeight: 700 },
  tdRate: { width: 60,  fontSize: 9.5, textAlign: 'right',  color: '#000000' },
  tdAmt:  { width: 68,  fontSize: 9.5, textAlign: 'right',  fontWeight: 700, color: '#000000' },

  // ── BOTTOM 25%: totals + terms + signature + footer ──────────────────────
  bottomBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_H,
    backgroundColor: C.white,
  },

  // Totals + Terms side by side
  totalsTermsRow: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingTop: 8,
    gap: 12,
  },

  // Totals (right-aligned box)
  totalsBox: { width: 200 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalLabel: { fontSize: 9.5, color: '#000000' },
  totalValue: { fontSize: 9.5, color: '#000000', fontWeight: 700 },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#6d9eeb',
    borderRadius: 3,
    marginTop: 3,
  },
  grandLabel: { fontSize: 10.5, fontWeight: 700, color: '#000000', letterSpacing: 0.8 },
  grandValue: { fontSize: 11.5, fontWeight: 700, color: '#000000' },

  // Terms (fills remaining width)
  termsBox: { flex: 1 },
  termsTitle: { fontSize: 8, fontWeight: 700, color: '#000000', letterSpacing: 1.2, marginBottom: 5 },
  termsGrid2col: { flexDirection: 'row', gap: 5 },
  termsCol: { flex: 1, gap: 4 },
  termChip: {
    backgroundColor: '#a4c2f4',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#4a86e8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  termLabel: { fontSize: 7.5, fontWeight: 700, color: '#000000', width: 48 },
  termValue: { fontSize: 8,   color: '#000000', flex: 1 },

  // Notes / Remarks
  notesRow: {
    paddingHorizontal: 28,
    marginTop: 7,
    alignItems: 'center',
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: '#000000',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8.5,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },

  // Signature row
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    marginTop: 6,
  },
  thankBlock: { alignItems: 'flex-start' },
  thankText:  { fontSize: 9, color: '#000000', fontStyle: 'italic' },

  sigBlock:  { alignItems: 'flex-end' },
  stampImg:  { width: 58, height: 58, marginBottom: 4 },
  sigLine:   { width: 110, borderBottomWidth: 1.5, borderBottomColor: C.ink, marginBottom: 3 },
  sigLabel:  { fontSize: 8.5, color: '#000000' },
  sigName:   { fontSize: 9.5, fontWeight: 700, color: '#000000', marginTop: 1 },

  // Footer band
  footerBand: {
    backgroundColor: C.ink,
    paddingHorizontal: 28,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  footerLeft:  { fontSize: 8, color: '#000000' },
  footerRight: { fontSize: 8, color: '#000000' },
})

export default function QuotePDF({ quote }) {
  const {
    quote_number, date, client_name, client_address, client_gstin,
    client_phone, client_email, items = [], tax_inclusive,
    total_amount, cgst_amount, sgst_amount, grand_total,
    terms = {},   // editable terms passed from parent
    notes,        // optional notes / remarks
  } = quote

  // Default terms (can be overridden by quote.terms)
  const safeTerms = terms || {}
  const T = {
    Taxes:     safeTerms.Taxes     ?? (tax_inclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'),
    Payment:   safeTerms.Payment   ?? '100% Advance',
    Delivery:  safeTerms.Delivery  ?? '3-4 Business Days',
    Scope:     safeTerms.Scope     ?? 'Supply Only',
    Documents: safeTerms.Documents ?? 'Tax Invoice',
    Validity:  safeTerms.Validity  ?? '30 Days',
  }
  const termPairs = Object.entries(T)  // 6 entries → split into 2 cols of 3
  const col1 = termPairs.slice(0, 3)
  const col2 = termPairs.slice(3)

  const displayDate = date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Document
      title={`Quotation ${quote_number}`}
      author="Shreya Systems"
      creator="Shreya Systems Quotation Studio"
    >
      <Page size="A4" style={s.page}>

        {/* ══ TOP 25%: header + parties ══════════════════════════════════ */}
        <View style={s.topBlock}>
          {/* Header band */}
          <View style={s.headerBand}>
            <View style={s.headerRow}>
              {/* Company logo — replaces name + tagline */}
              <View style={{ justifyContent: 'center' }}>
                <Image
                  src={logoImage}
                  style={{ width: 130, height: 52, objectFit: 'contain' }}
                />
                <Text style={s.companyMeta}>
                  Shop No. 04, Janaki Corner, 1007/1009 Sadashiv Peth, Pune{'\n'}
                  Cell: 9422015713 / 7798470513{'\n'}
                  Email: shreyasystemspune@gmail.com{'\n'}
                  GSTIN: 27AFFPG6521C1ZW
                </Text>
              </View>
              <View>
                <Text style={s.quoteTitle}>QUOTATION</Text>
                <Text style={s.quoteNumber}>{quote_number || 'SS/26-27/----'}</Text>
                <Text style={s.quoteMeta}>Date: {displayDate}</Text>
              </View>
            </View>
          </View>

          {/* Gold divider */}
          <View style={s.goldDivider} />

          {/* Bill To — full width, no Bill From */}
          <View style={[s.partiesRow, { paddingVertical: 8 }]}>
            <View style={s.partyBox}>
              <Text style={s.partyLabel}>Bill To</Text>
              <Text style={s.partyName}>{client_name || '—'}</Text>
              <Text style={s.partyMeta}>
                {[
                  client_address,
                  client_gstin  ? `GSTIN: ${client_gstin}`  : '',
                  client_phone  ? `Phone: ${client_phone}`  : '',
                  client_email  ? `Email: ${client_email}`  : '',
                ].filter(Boolean).join('\n')}
              </Text>
            </View>
          </View>

          <View style={s.thinDivider} />
        </View>

        {/* ══ MIDDLE 50%: items table ════════════════════════════════════ */}
        <View style={s.middleBlock}>
          {/* Table header */}
          <View style={s.tableHead}>
            <Text style={s.thSn}>S.N</Text>
            <Text style={s.thDesc}>DESCRIPTION</Text>
            <Text style={s.thHsn}>HSN/SAC</Text>
            <Text style={s.thQty}>QTY</Text>
            <Text style={s.thRate}>RATE</Text>
            <Text style={s.thAmt}>AMOUNT</Text>
          </View>

          {/* Rows */}
          {items.length === 0 && (
            <View style={s.rowEven}>
              <Text style={[s.tdDesc, { color: '#000000', fontStyle: 'italic' }]}>
                No items added yet
              </Text>
            </View>
          )}
          {items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
              <Text style={s.tdSn}>{i + 1}</Text>
              <View style={s.tdDesc}>
                <Text style={s.tdDescName}>{item.item_name || item.name}</Text>
                {item.description ? (
                  <Text style={s.tdDescSub}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={s.tdHsn}>{item.hsn_code || '—'}</Text>
              <Text style={s.tdQty}>{item.qty || item.quantity || 1}</Text>
              <Text style={s.tdRate}>{fmt(item.rate)}</Text>
              <Text style={s.tdAmt}>{fmt(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ══ BOTTOM 25%: totals + terms + sig + footer ═════════════════ */}
        <View style={s.bottomBlock}>

          {/* Totals & Terms side by side */}
          <View style={s.totalsTermsRow}>

            {/* Terms — left side, 2 columns */}
            <View style={s.termsBox}>
              <Text style={s.termsTitle}>TERMS &amp; CONDITIONS</Text>
              <View style={s.termsGrid2col}>
                <View style={s.termsCol}>
                  {col1.map(([label, value]) => (
                    <View key={label} style={s.termChip}>
                      <Text style={s.termLabel}>{label} - </Text>
                      <Text style={s.termValue}>{value}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.termsCol}>
                  {col2.map(([label, value]) => (
                    <View key={label} style={s.termChip}>
                      <Text style={s.termLabel}>{label} - </Text>
                      <Text style={s.termValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Totals — right side */}
            <View style={s.totalsBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmt(total_amount)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>CGST @ 9%</Text>
                <Text style={s.totalValue}>{fmt(cgst_amount)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>SGST @ 9%</Text>
                <Text style={s.totalValue}>{fmt(sgst_amount)}</Text>
              </View>
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>GRAND TOTAL</Text>
                <Text style={s.grandValue}>{fmt(grand_total || total_amount)}</Text>
              </View>
            </View>
          </View>

          {/* Notes / Remarks — shown only when present, centred between T&C and thank-you */}
          {notes && notes.trim() ? (
            <View style={s.notesRow}>
              <Text style={s.notesLabel}>NOTES / REMARKS</Text>
              <Text style={s.notesText}>{notes.trim()}</Text>
            </View>
          ) : null}

          {/* Signature row */}
          <View style={s.sigRow}>
            <View style={s.thankBlock}>
              <Text style={s.thankText}>Thank you for choosing Shreya Systems.</Text>
              <Text style={[s.thankText, { marginTop: 2 }]}>
                We look forward to a long and fruitful partnership.
              </Text>
            </View>
            <View style={s.sigBlock}>
              <Image src={stampImage} style={s.stampImg} />
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Authorised Signatory</Text>
              <Text style={s.sigName}>SHREYA SYSTEMS, PUNE</Text>
            </View>
          </View>

          {/* Footer band */}
          <View style={s.footerBand}>
            <Text style={s.footerLeft}>
              This is a computer-generated quotation. Prices subject to change without prior notice.
            </Text>
            <Text style={s.footerRight}>shreyasystemspune@gmail.com</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}

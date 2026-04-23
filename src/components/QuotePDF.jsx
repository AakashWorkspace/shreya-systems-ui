import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import stampImage from '../images/signature.jpeg'

// react-pdf only supports TTF/OTF — use built-in Helvetica (no network needed)

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

const s = StyleSheet.create({
  page:          { fontFamily: 'Helvetica', backgroundColor: C.white, fontSize: 9, color: '#1a1a2e' },

  // Header band
  headerBand:    { backgroundColor: '#00a5d6', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 20 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName:   { fontSize: 20, fontWeight: 700, color: '#000a52', letterSpacing: 2, marginBottom: 4 },
  companyTagline:{ fontSize: 7.5, color: '#000000', letterSpacing: 1 },
  companyMeta:   { fontSize: 7.5, color: '#000000', lineHeight: 1.6, marginTop: 6 },
  quoteTitle:    { fontSize: 24, fontWeight: 700, color: '#000000', letterSpacing: 3, textAlign: 'right' },
  quoteMeta:     { fontSize: 8, color: '#000000', textAlign: 'right', marginTop: 4, lineHeight: 1.7 },
  quoteNumber:   { fontSize: 9, color: '#000a52', textAlign: 'right', fontWeight: 700 },

  // Gold divider
  goldDivider:   { height: 3, backgroundColor: C.gold },
  thinDivider:   { height: 1, backgroundColor: '#e8e0c8', marginHorizontal: 32 },

  // Parties section
  partiesRow:    { flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 18, gap: 24 },
  partyBox:      { flex: 1 },
  partyLabel:    { fontSize: 7, fontWeight: 700, color: C.gold, letterSpacing: 1.5, marginBottom: 6,
                   textTransform: 'uppercase' },
  partyName:     { fontSize: 10, fontWeight: 700, color: '#111122', marginBottom: 3 },
  partyMeta:     { fontSize: 8, color: '#555566', lineHeight: 1.65 },

  // Items table
  tableWrapper:  { paddingHorizontal: 32, marginTop: 4 },
  tableHead:     { flexDirection: 'row', backgroundColor: C.ink, paddingVertical: 8,
                   paddingHorizontal: 8, borderRadius: 4 },
  thSn:          { width: 26, fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5 },
  thDesc:        { flex: 1,   fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5 },
  thHsn:         { width: 56, fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textAlign: 'center' },
  thQty:         { width: 28, fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textAlign: 'center' },
  thRate:        { width: 58, fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textAlign: 'right' },
  thAmt:         { width: 64, fontSize: 7.5, fontWeight: 700, color: C.goldLight, letterSpacing: 0.5, textAlign: 'right' },

  rowEven:       { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: C.row1, borderBottomWidth: 1, borderBottomColor: '#ece8d8' },
  rowOdd:        { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: C.row2, borderBottomWidth: 1, borderBottomColor: '#ece8d8' },
  tdSn:          { width: 26, fontSize: 8, color: '#888' },
  tdDesc:        { flex: 1 },
  tdDescName:    { fontSize: 8.5, fontWeight: 700, color: '#111122', marginBottom: 2 },
  tdDescSub:     { fontSize: 7.5, color: '#666677', lineHeight: 1.5 },
  tdHsn:         { width: 56, fontSize: 7.5, color: '#666677', textAlign: 'center' },
  tdQty:         { width: 28, fontSize: 8.5, textAlign: 'center', fontWeight: 700 },
  tdRate:        { width: 58, fontSize: 8.5, textAlign: 'right', color: '#333' },
  tdAmt:         { width: 64, fontSize: 8.5, textAlign: 'right', fontWeight: 700, color: '#111122' },

  // Totals
  totalsArea:    { paddingHorizontal: 32, marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsBox:     { width: 220 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4,
                   borderBottomWidth: 1, borderBottomColor: '#eee' },
  totalLabel:    { fontSize: 8.5, color: '#555' },
  totalValue:    { fontSize: 8.5, color: '#333', fontWeight: 700 },
  grandRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7,
                   paddingHorizontal: 8, backgroundColor: C.ink, borderRadius: 4, marginTop: 4 },
  grandLabel:    { fontSize: 9.5, fontWeight: 700, color: C.goldLight, letterSpacing: 1 },
  grandValue:    { fontSize: 11, fontWeight: 700, color: C.white },

  // Terms
  termsSection:  { paddingHorizontal: 32, marginTop: 20 },
  termsTitle:    { fontSize: 7, fontWeight: 700, color: C.gold, letterSpacing: 1.5, marginBottom: 6 },
  termsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  termChip:      { backgroundColor: '#f4f0e8', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4,
                   borderLeftWidth: 2, borderLeftColor: C.gold },
  termLabel:     { fontSize: 7, fontWeight: 700, color: '#555', marginBottom: 1 },
  termValue:     { fontSize: 7.5, color: '#222' },

  // Notes
  notesBox:      { paddingHorizontal: 32, marginTop: 14 },
  notesTitle:    { fontSize: 7, fontWeight: 700, color: C.gold, letterSpacing: 1.5, marginBottom: 4 },
  notesText:     { fontSize: 8, color: '#555', lineHeight: 1.6 },

  // Signature + footer
  signatureRow:  { paddingHorizontal: 32, marginTop: 24, flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'flex-end' },
  sigBlock:      { alignItems: 'flex-end' },
  stampImg:      { width: 75, height: 75, marginBottom: 6 },
  sigLine:       { width: 120, borderBottomWidth: 1.5, borderBottomColor: C.ink, marginBottom: 4 },
  sigLabel:      { fontSize: 7.5, color: '#888' },
  sigName:       { fontSize: 8.5, fontWeight: 700, color: '#222', marginTop: 1 },

  thankBlock:    { alignItems: 'center' },
  thankText:     { fontSize: 8, color: '#888', fontStyle: 'italic' },

  footerBand:    { backgroundColor: C.ink, paddingHorizontal: 32, paddingVertical: 10,
                   flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   marginTop: 20 },
  footerLeft:    { fontSize: 7, color: '#8888aa' },
  footerRight:   { fontSize: 7, color: C.gold },

  // Page number
  pageNum:       { position: 'absolute', bottom: 8, right: 32, fontSize: 7, color: '#aaa' },
})

const fmt = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function QuotePDF({ quote }) {
  const {
    quote_number, date, client_name, client_address, client_gstin,
    client_phone, client_email, items = [], tax_inclusive,
    total_amount, cgst_amount, sgst_amount, grand_total, notes,
  } = quote

  const displayDate = date ? new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Document
      title={`Quotation ${quote_number}`}
      author="Shreya Systems"
      creator="Shreya Systems Quotation Studio"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header Band ── */}
        <View style={s.headerBand}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.companyName}>SHREYA SYSTEMS</Text>
              <Text style={s.companyTagline}>TECHNOLOGY SOLUTIONS & SUPPLY</Text>
              <Text style={s.companyMeta}>
                Shop No. 04, Janaki Corner, 1007/1009 Sadashiv Peth, Pune{'\n'}
                Cell: 9422015713 / 7798470513{'\n'}
                Email: shreyasystemspune@gmail.com{'\n'}
                GSTIN: 27AFFPG6521C1ZW
              </Text>
            </View>
            <View>
              <Text style={s.quoteTitle}>QUOTATION</Text>
              <Text style={s.quoteNumber}>
                {quote_number || 'SS/26-27/----'}
              </Text>
              <Text style={s.quoteMeta}>
                Date: {displayDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Gold divider */}
        <View style={s.goldDivider} />

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Bill From</Text>
            <Text style={s.partyName}>Shreya Systems</Text>
            <Text style={s.partyMeta}>
              Shop No. 04, Janaki Corner{'\n'}
              1007/1009 Sadashiv Peth, Pune – 411 030{'\n'}
              Maharashtra, India{'\n'}
              GSTIN: 27AFFPG6521C1ZW
            </Text>
          </View>

          <View style={{ width: 1, backgroundColor: '#ddd' }} />

          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Bill To</Text>
            <Text style={s.partyName}>{client_name || '—'}</Text>
            <Text style={s.partyMeta}>
              {[client_address, client_gstin ? `GSTIN: ${client_gstin}` : '', client_phone ? `Phone: ${client_phone}` : '', client_email ? `Email: ${client_email}` : ''].filter(Boolean).join('\n')}
            </Text>
          </View>
        </View>

        <View style={s.thinDivider} />

        {/* ── Items Table ── */}
        <View style={s.tableWrapper}>
          {/* Head */}
          <View style={s.tableHead}>
            <Text style={s.thSn}>S.N</Text>
            <Text style={s.thDesc}>DESCRIPTION</Text>
            <Text style={s.thHsn}>HSN/SAC</Text>
            <Text style={s.thQty}>QTY</Text>
            <Text style={s.thRate}>RATE (₹)</Text>
            <Text style={s.thAmt}>AMOUNT (₹)</Text>
          </View>

          {/* Rows */}
          {items.length === 0 && (
            <View style={s.rowEven}>
              <Text style={[s.tdDesc, { color: '#aaa', fontStyle: 'italic' }]}>
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

        {/* ── Totals ── */}
        <View style={s.totalsArea}>
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

        {/* ── Terms ── */}
        <View style={s.termsSection}>
          <Text style={s.termsTitle}>TERMS & CONDITIONS</Text>
          <View style={s.termsGrid}>
            {[
              ['Taxes', tax_inclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'],
              ['Payment', '100% Advance'],
              ['Delivery', '3–4 Business Days'],
              ['Scope', 'Supply Only'],
              ['Documents', 'Tax Invoice'],
              ['Validity', '30 Days'],
            ].map(([label, value]) => (
              <View key={label} style={s.termChip}>
                <Text style={s.termLabel}>{label.toUpperCase()}</Text>
                <Text style={s.termValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notes ── */}
        {notes && (
          <View style={s.notesBox}>
            <Text style={s.notesTitle}>NOTES / REMARKS</Text>
            <Text style={s.notesText}>{notes}</Text>
          </View>
        )}

        {/* ── Signature ── */}
        <View style={s.signatureRow}>
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

        {/* ── Footer band ── */}
        <View style={s.footerBand}>
          <Text style={s.footerLeft}>
            This is a computer-generated quotation. Prices subject to change without prior notice.
          </Text>
          <Text style={s.footerRight}>shreyasystemspune@gmail.com</Text>
        </View>

        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

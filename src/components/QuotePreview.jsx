import React from 'react'
import logoImage     from '../images/logo.png'
import stampImage    from '../images/signature.jpeg'

// ── Currency formatter (matches QuotePDF) ────────────────────────────────────
const fmt = (n) => {
  const num = Number(n) || 0
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const DEFAULT_TERMS = {
  Taxes:     'GST Exclusive',
  Payment:   '100% Advance',
  Delivery:  '3-4 Business Days',
  Scope:     'Supply Only',
  Documents: 'Tax Invoice',
  Validity:  '30 Days',
}

export default function QuotePreview({ quote }) {
  const {
    quote_number, date, client_name, client_address, client_gstin,
    client_phone, client_email, items = [], tax_inclusive,
    total_amount, cgst_amount, sgst_amount, grand_total,
    terms = {}, notes,
  } = quote

  const safeTerms = terms || {}
  const T = {
    Taxes:     safeTerms.Taxes     ?? (tax_inclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'),
    Payment:   safeTerms.Payment   ?? DEFAULT_TERMS.Payment,
    Delivery:  safeTerms.Delivery  ?? DEFAULT_TERMS.Delivery,
    Scope:     safeTerms.Scope     ?? DEFAULT_TERMS.Scope,
    Documents: safeTerms.Documents ?? DEFAULT_TERMS.Documents,
    Validity:  safeTerms.Validity  ?? DEFAULT_TERMS.Validity,
  }
  const termPairs = Object.entries(T)
  const col1 = termPairs.slice(0, 3)
  const col2 = termPairs.slice(3)

  const displayDate = date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    /*
     * Outer shell: scales the A4 sheet to fit the container.
     * The inner sheet is fixed at 595px wide (A4 pt width) and uses
     * transform: scale() so it fills the available space without scrollbars.
     */
    <div className="w-full h-full flex items-start justify-center overflow-auto bg-gray-200 py-4 px-2">
      <div
        style={{
          width: 595,
          minHeight: 842,
          backgroundColor: '#ffffff',
          fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
          fontSize: 9,
          color: '#000000',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transformOrigin: 'top center',
        }}
      >

        {/* ══ TOP: header band ══════════════════════════════════════════════ */}
        <div style={{ backgroundColor: '#A4C2F4', padding: '14px 28px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Left: logo + contact */}
            <div>
              <img src={logoImage} alt="Shreya Systems" style={{ width: 130, height: 52, objectFit: 'contain', display: 'block' }} />
              <div style={{ fontSize: 8.5, color: '#000000', lineHeight: 1.55, marginTop: 4 }}>
                Shop No. 04, Janaki Corner, 1007/1009 Sadashiv Peth, Pune<br />
                Cell: 9422015713 / 7798470513<br />
                Email: shreyasystemspune@gmail.com<br />
                GSTIN: 27AFFPG6521C1ZW
              </div>
            </div>
            {/* Right: title + number + date */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 21.5, fontWeight: 700, color: '#000000', letterSpacing: 2.5 }}>QUOTATION</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#000000', marginTop: 2 }}>
                {quote_number || 'SS/26-27/----'}
              </div>
              <div style={{ fontSize: 9, color: '#000000', marginTop: 3, lineHeight: 1.6 }}>
                Date: {displayDate}
              </div>
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: 3, backgroundColor: '#c9960e' }} />

        {/* Bill To */}
        <div style={{ padding: '8px 28px', borderBottom: '1px solid #e8e0c8' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2 }}>{client_name || '—'}</div>
          <div style={{ fontSize: 8.5, lineHeight: 1.55, color: '#000000' }}>
            {[
              client_address,
              client_gstin  ? `GSTIN: ${client_gstin}`  : '',
              client_phone  ? `Phone: ${client_phone}`  : '',
              client_email  ? `Email: ${client_email}`  : '',
            ].filter(Boolean).map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ height: 1, backgroundColor: '#e8e0c8', margin: '0 28px' }} />

        {/* ══ MIDDLE: items table ═══════════════════════════════════════════ */}
        <div style={{ flex: 1, padding: '4px 28px 0', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'flex', backgroundColor: '#6d9eeb',
            padding: '7px 8px', borderRadius: 3, marginBottom: 0,
          }}>
            {[
              { label: 'S.N',      w: 22,  align: 'left'   },
              { label: 'DESCRIPTION', flex: 1, align: 'left' },
              { label: 'HSN/SAC', w: 52,  align: 'center' },
              { label: 'QTY',     w: 26,  align: 'center' },
              { label: 'RATE',    w: 60,  align: 'right'  },
              { label: 'AMOUNT',  w: 68,  align: 'right'  },
            ].map(col => (
              <div key={col.label} style={{
                width: col.w, flex: col.flex,
                fontSize: 8.5, fontWeight: 700, color: '#000000',
                letterSpacing: 0.4, textAlign: col.align,
              }}>{col.label}</div>
            ))}
          </div>

          {/* Rows */}
          {items.length === 0 ? (
            <div style={{
              display: 'flex', padding: '5.5px 8px',
              backgroundColor: '#f9f8f4', borderBottom: '1px solid #ece8d8',
            }}>
              <div style={{ flex: 1, fontSize: 9, color: '#888', fontStyle: 'italic' }}>
                No items added yet
              </div>
            </div>
          ) : items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', padding: '5.5px 8px',
              backgroundColor: i % 2 === 0 ? '#f9f8f4' : '#ffffff',
              borderBottom: '1px solid #ece8d8',
            }}>
              <div style={{ width: 22, fontSize: 9 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 1 }}>{item.item_name || item.name}</div>
                {item.description && (
                  <div style={{ fontSize: 8, lineHeight: 1.4 }}>{item.description}</div>
                )}
              </div>
              <div style={{ width: 52, fontSize: 8.5, textAlign: 'center' }}>{item.hsn_code || '—'}</div>
              <div style={{ width: 26, fontSize: 9.5, textAlign: 'center', fontWeight: 700 }}>{item.qty || item.quantity || 1}</div>
              <div style={{ width: 60, fontSize: 9.5, textAlign: 'right' }}>{fmt(item.rate)}</div>
              <div style={{ width: 68, fontSize: 9.5, textAlign: 'right', fontWeight: 700 }}>{fmt(item.amount)}</div>
            </div>
          ))}
        </div>

        {/* ══ BOTTOM: totals + terms + sig + footer ════════════════════════ */}
        <div style={{ backgroundColor: '#ffffff', marginTop: 'auto' }}>

          {/* Totals & Terms side by side */}
          <div style={{ display: 'flex', padding: '8px 28px 0', gap: 12 }}>

            {/* Terms — left */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5 }}>
                TERMS &amp; CONDITIONS
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[col1, col2].map((col, ci) => (
                  <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {col.map(([label, value]) => (
                      <div key={label} style={{
                        backgroundColor: '#a4c2f4',
                        borderRadius: 3,
                        padding: '4px 6px',
                        borderLeft: '2px solid #4a86e8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <span style={{ fontSize: 7.5, fontWeight: 700, width: 48 }}>{label} - </span>
                        <span style={{ fontSize: 8, flex: 1 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals — right */}
            <div style={{ width: 200 }}>
              {[
                ['Subtotal',   total_amount],
                ['CGST @ 9%', cgst_amount],
                ['SGST @ 9%', sgst_amount],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '3px 0', borderBottom: '1px solid #eee',
                }}>
                  <span style={{ fontSize: 9.5 }}>{label}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700 }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 8px', backgroundColor: '#6d9eeb',
                borderRadius: 3, marginTop: 3,
              }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8 }}>GRAND TOTAL</span>
                <span style={{ fontSize: 11.5, fontWeight: 700 }}>{fmt(grand_total || total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && notes.trim() ? (
            <div style={{ padding: '7px 28px 0' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.2, marginBottom: 3 }}>
                NOTES / REMARKS
              </div>
              <div style={{ fontSize: 8.5, fontStyle: 'italic', lineHeight: 1.5 }}>
                {notes.trim()}
              </div>
            </div>
          ) : null}

          {/* Signature row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            padding: '6px 28px 0',
          }}>
            <div>
              <div style={{ fontSize: 9, fontStyle: 'italic' }}>Thank you for choosing Shreya Systems.</div>
              <div style={{ fontSize: 9, fontStyle: 'italic', marginTop: 2 }}>
                We look forward to a long and fruitful partnership.
              </div>
            </div>
            <div style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <img src={stampImage} alt="Stamp" style={{ width: 58, height: 58, display: 'block', marginLeft: 'auto', marginBottom: 4 }} />
              <div style={{ width: 110, borderBottom: '1.5px solid #0f0f1a', marginBottom: 3, marginLeft: 'auto' }} />
              <div style={{ fontSize: 8.5 }}>Authorised Signatory</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 1 }}>SHREYA SYSTEMS, PUNE</div>
            </div>
          </div>

          {/* Footer band */}
          <div style={{
            backgroundColor: '#0f0f1a',
            padding: '7px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
          }}>
            <span style={{ fontSize: 8, color: '#cccccc' }}>
              This is a computer-generated quotation. Prices subject to change without prior notice.
            </span>
            <span style={{ fontSize: 8, color: '#cccccc' }}>shreyasystemspune@gmail.com</span>
          </div>
        </div>

      </div>
    </div>
  )
}

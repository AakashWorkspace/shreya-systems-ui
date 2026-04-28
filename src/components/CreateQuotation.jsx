import React, { useState, useEffect, useCallback, useRef } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Search, Plus, Trash2, Download, Save, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import QuotePDF from './QuotePDF'

const CGST_RATE = 0.09
const SGST_RATE = 0.09

// Default terms values
const DEFAULT_TERMS = {
  Taxes:     'GST Exclusive',
  Payment:   '100% Advance',
  Delivery:  '3-4 Business Days',
  Scope:     'Supply Only',
  Documents: 'Tax Invoice',
  Validity:  '30 Days',
}

export default function CreateQuotation({ onSaved }) {
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteNumLoading, setQuoteNumLoading] = useState(true)

  // Fetch next sequential quote number from backend on mount
  useEffect(() => {
    api.get('/api/quotations/next-number')
      .then(({ data }) => setQuoteNumber(data.quote_number))
      .catch(() => {
        const now = new Date()
        const fy = now.getMonth() >= 3
          ? `${String(now.getFullYear()).slice(-2)}-${String(now.getFullYear() + 1).slice(-2)}`
          : `${String(now.getFullYear() - 1).slice(-2)}-${String(now.getFullYear()).slice(-2)}`
        const month = String(now.getMonth() + 1).padStart(2, '0')
        setQuoteNumber(`SS/${fy}/${month}001`)
      })
      .finally(() => setQuoteNumLoading(false))
  }, [])

  const [client, setClient] = useState({
    client_name: '', client_address: '', client_gstin: '',
    client_phone: '', client_email: '',
  })

  // ── Bill To autocomplete — sourced from existing quotations in the DB ───
  // Same pattern as items: DB-backed, persists across devices and logins.
  const [allClients, setAllClients] = useState([])   // deduplicated client list
  const [clientSuggestions, setClientSuggestions] = useState([])
  const [showClientSug, setShowClientSug] = useState(false)
  const clientSugRef = useRef(null)

  // Fetch once on mount — pull unique clients from saved quotations
  useEffect(() => {
    api.get('/api/quotations').then(({ data }) => {
      // Deduplicate by client_name (case-insensitive), keep latest occurrence
      const seen = new Map()
      data.forEach(q => {
        if (!q.client_name?.trim()) return
        const key = q.client_name.trim().toLowerCase()
        if (!seen.has(key)) {
          seen.set(key, {
            client_name:    q.client_name,
            client_address: q.client_address || '',
            client_gstin:   q.client_gstin   || '',
            client_phone:   q.client_phone   || '',
            client_email:   q.client_email   || '',
          })
        }
      })
      setAllClients([...seen.values()])
    }).catch(() => { /* silent — autocomplete is a nice-to-have */ })
  }, [])

  useEffect(() => {
    const fn = (e) => {
      if (clientSugRef.current && !clientSugRef.current.contains(e.target))
        setShowClientSug(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleClientNameChange = (val) => {
    setClient(c => ({ ...c, client_name: val }))
    if (val.trim()) {
      const matches = allClients.filter(c =>
        c.client_name?.toLowerCase().includes(val.toLowerCase())
      )
      setClientSuggestions(matches)
      setShowClientSug(matches.length > 0)
    } else {
      setClientSuggestions(allClients)
      setShowClientSug(allClients.length > 0)
    }
  }

  const selectClientSuggestion = (c) => {
    setClient(c)
    setShowClientSug(false)
  }

  const [notes, setNotes] = useState('')
  const [taxInclusive, setTaxInclusive] = useState('exclusive')

  // ── Editable Terms ──────────────────────────────────────────────────────
  const [terms, setTerms] = useState({ ...DEFAULT_TERMS })
  const updateTerm = (key, val) => setTerms(t => ({ ...t, [key]: val }))

  // Line item form
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)
  const [lineItem, setLineItem] = useState({
    item_name: '', description: '', hsn_code: '', qty: 1, rate: 0,
  })

  // Quote lines
  const [lines, setLines] = useState([])
  const [saving, setSaving] = useState(false)

  const sugRef = useRef(null)

  // Close item dropdown on outside click
  useEffect(() => {
    const fn = (e) => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Fetch item suggestions
  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/items?search=${encodeURIComponent(search)}&limit=8`)
        setSuggestions(data)
        setShowSug(true)
      } catch { /* silent */ }
    }, 280)
    return () => clearTimeout(t)
  }, [search])

  const selectSuggestion = (item) => {
    setLineItem({ item_name: item.name, description: item.description || '', hsn_code: item.hsn_code || '', qty: 1, rate: item.rate })
    setSearch(item.name)
    setShowSug(false)
  }

  const addLine = () => {
    if (!lineItem.item_name) return toast.error('Select or enter an item name')
    if (!lineItem.rate || lineItem.rate <= 0) return toast.error('Rate must be greater than 0')
    const amount = lineItem.qty * lineItem.rate
    setLines(l => [...l, { ...lineItem, amount, id: Date.now() }])
    setLineItem({ item_name: '', description: '', hsn_code: '', qty: 1, rate: 0 })
    setSearch('')
    toast.success('Item added')
  }

  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id))

  // Totals — logic depends on inclusive/exclusive mode
  const subtotal = lines.reduce((s, l) => s + l.amount, 0)
  let cgst, sgst, grandTotal, displaySubtotal
  if (taxInclusive === 'inclusive') {
    // Tax is already included in the prices — back-calculate
    grandTotal = subtotal
    cgst = grandTotal * CGST_RATE / (1 + CGST_RATE + SGST_RATE)
    sgst = grandTotal * SGST_RATE / (1 + CGST_RATE + SGST_RATE)
    displaySubtotal = grandTotal - cgst - sgst
  } else {
    // Tax is added on top
    displaySubtotal = subtotal
    cgst = subtotal * CGST_RATE
    sgst = subtotal * SGST_RATE
    grandTotal = subtotal + cgst + sgst
  }

  // PDF data (includes editable terms)
  const quoteData = {
    quote_number: quoteNumber,
    date: new Date().toISOString(),
    ...client,
    notes,
    tax_inclusive: taxInclusive,
    items: lines,
    total_amount: displaySubtotal,
    cgst_amount: cgst,
    sgst_amount: sgst,
    grand_total: grandTotal,
    terms: {
      ...terms,
      Taxes: taxInclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive',
    },
  }

  const saveQuotation = async () => {
    if (lines.length === 0) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const payload = {
        ...quoteData,
        items: lines.map(({ id, ...rest }) => rest),
        status: 'draft',
      }
      await api.post('/api/quotations', payload)
      toast.success('Quotation saved!')
      onSaved?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const termKeys = Object.keys(DEFAULT_TERMS)

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="w-[52%] flex flex-col overflow-y-auto border-r border-ink-700 bg-ink-900/60">
        <div className="p-6 space-y-5 flex-1">

          {/* Quote header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">New Quotation</p>
              <p className="font-mono text-gold-400 text-sm font-medium tracking-widest">
                {quoteNumLoading ? 'Generating…' : quoteNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-ink-800 px-3 py-1.5 rounded-full border border-ink-600">
              <span>GST</span>
              <button
                onClick={() => setTaxInclusive(t => t === 'inclusive' ? 'exclusive' : 'inclusive')}
                className={`relative w-8 h-4 rounded-full transition-colors ${taxInclusive === 'inclusive' ? 'bg-gold-400' : 'bg-ink-600'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow
                  ${taxInclusive === 'inclusive' ? 'left-4' : 'left-0.5'}`} />
              </button>
              <span>{taxInclusive === 'inclusive' ? 'Incl.' : 'Excl.'}</span>
            </div>
          </div>

          {/* ── Client info with Bill To autocomplete ── */}
          <div className="space-y-3">
            <p className="section-label">Client Details (Bill To)</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Client name with saved-client dropdown */}
              <div className="col-span-2 relative" ref={clientSugRef}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  className="input-field pl-8"
                  placeholder="Client / Company Name *"
                  value={client.client_name}
                  onChange={e => handleClientNameChange(e.target.value)}
                  onFocus={() => {
                    const matches = client.client_name?.trim()
                      ? allClients.filter(c => c.client_name?.toLowerCase().includes(client.client_name.toLowerCase()))
                      : allClients
                    if (matches.length > 0) { setClientSuggestions(matches); setShowClientSug(true) }
                  }}
                />
                {showClientSug && clientSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-ink-800 border
                                  border-ink-600 rounded-lg shadow-card overflow-hidden max-h-48 overflow-y-auto">
                    {clientSuggestions.map((c, i) => (
                      <button
                        key={i}
                        className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-ink-700 transition-colors text-left"
                        onClick={() => selectClientSuggestion(c)}
                      >
                        <User className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate font-medium">{c.client_name}</p>
                          {c.client_address && (
                            <p className="text-xs text-gray-500 truncate">{c.client_address}</p>
                          )}
                        </div>
                        {c.client_gstin && (
                          <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">GST: {c.client_gstin}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input className="input-field" placeholder="Address"
                value={client.client_address}
                onChange={e => setClient(c => ({ ...c, client_address: e.target.value }))} />
              <input className="input-field" placeholder="GSTIN"
                value={client.client_gstin}
                onChange={e => setClient(c => ({ ...c, client_gstin: e.target.value }))} />
              <input className="input-field" placeholder="Phone"
                value={client.client_phone}
                onChange={e => setClient(c => ({ ...c, client_phone: e.target.value }))} />
              <input className="input-field" placeholder="Email"
                value={client.client_email}
                onChange={e => setClient(c => ({ ...c, client_email: e.target.value }))} />
            </div>
          </div>

          {/* Item selector */}
          <div className="space-y-3">
            <p className="section-label">Add Line Item</p>
            <div className="card p-4 space-y-3">
              {/* Typeahead search */}
              <div className="relative" ref={sugRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  className="input-field pl-8"
                  placeholder="Search item catalogue…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setLineItem(l => ({ ...l, item_name: e.target.value })) }}
                  onFocus={() => search && setSuggestions(s => s)}
                />
                {showSug && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-ink-800 border
                                  border-ink-600 rounded-lg shadow-card overflow-hidden">
                    {suggestions.map(item => (
                      <button
                        key={item.id}
                        className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-ink-700 transition-colors text-left"
                        onClick={() => selectSuggestion(item)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                          )}
                        </div>
                        <span className="text-gold-400 text-xs font-mono whitespace-nowrap mt-0.5">
                          Rs.{item.rate?.toLocaleString('en-IN')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <input className="input-field text-xs" placeholder="Description (optional)"
                value={lineItem.description}
                onChange={e => setLineItem(l => ({ ...l, description: e.target.value }))} />

              {/* HSN / Qty / Rate row */}
              <div className="grid grid-cols-3 gap-2">
                <input className="input-field text-xs" placeholder="HSN Code"
                  value={lineItem.hsn_code}
                  onChange={e => setLineItem(l => ({ ...l, hsn_code: e.target.value }))} />
                <input className="input-field text-xs" type="number" min="1" placeholder="Qty"
                  value={lineItem.qty}
                  onChange={e => setLineItem(l => ({ ...l, qty: parseInt(e.target.value) || 1 }))} />
                <input className="input-field text-xs" type="number" min="0" placeholder="Rate"
                  value={lineItem.rate || ''}
                  onChange={e => setLineItem(l => ({ ...l, rate: parseFloat(e.target.value) || 0 }))} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Amount: <span className="text-gold-300 font-semibold">
                    Rs.{((lineItem.qty || 1) * (lineItem.rate || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </span>
                <button onClick={addLine} className="btn-primary flex items-center gap-1.5 !py-2 !px-4">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Lines table */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <p className="section-label">Quote Lines ({lines.length})</p>
              <div className="card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink-800 text-gray-400">
                      <th className="text-left px-3 py-2 font-medium">Item</th>
                      <th className="text-center px-2 py-2 font-medium w-10">Qty</th>
                      <th className="text-right px-3 py-2 font-medium w-20">Rate</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Amount</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={line.id} className={`border-t border-ink-700 ${i % 2 === 0 ? '' : 'bg-ink-800/30'}`}>
                        <td className="px-3 py-2">
                          <p className="text-gray-700 font-medium truncate max-w-[160px]">{line.item_name}</p>
                          {line.description && <p className="text-gray-600 truncate max-w-[160px]">{line.description}</p>}
                        </td>
                        <td className="text-center px-2 py-2 text-gray-600">{line.qty}</td>
                        <td className="text-right px-3 py-2 text-gray-600 font-mono">
                          Rs.{line.rate.toLocaleString('en-IN')}
                        </td>
                        <td className="text-right px-3 py-2 text-gold-500 font-mono font-semibold">
                          Rs.{line.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeLine(line.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals strip */}
                <div className="bg-ink-800 border-t border-ink-600 px-4 py-3 space-y-1">
                  {[
                    ['Subtotal', displaySubtotal],
                    ['CGST 9%', cgst],
                    ['SGST 9%', sgst],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-xs text-gray-400">
                      <span>{label}</span>
                      <span className="font-mono">Rs.{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold text-gold-300 pt-1.5 border-t border-ink-600">
                    <span>Grand Total</span>
                    <span className="font-mono">Rs.{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Editable Terms & Conditions (2 cols × 3) ── */}
          <div className="space-y-3">
            <p className="section-label">Terms &amp; Conditions</p>
            <div className="grid grid-cols-2 gap-2">
              {termKeys.map(key => (
                <div key={key} className="card p-2.5 flex items-center gap-2">
                  <span className="text-xs text-gold-400 font-semibold w-20 shrink-0">{key}</span>
                  <input
                    className="flex-1 bg-transparent border-b border-ink-600 focus:border-gold-400 outline-none text-xs text-gray-700 py-0.5 transition-colors"
                    value={terms[key]}
                    onChange={e => updateTerm(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="section-label">Notes / Remarks</p>
            <textarea
              className="input-field resize-none text-xs"
              rows={3}
              placeholder="Any additional remarks for this quotation…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <button onClick={saveQuotation} disabled={saving || lines.length === 0}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Quotation'}
            </button>

            {lines.length > 0 && (
              <PDFDownloadLink
                document={<QuotePDF quote={quoteData} />}
                fileName={`${quoteNumber.replace(/\//g, '-')}.pdf`}
              >
                {({ loading }) => (
                  <button className="btn-ghost flex items-center gap-2 flex-1 justify-center">
                    <Download className="w-4 h-4" />
                    {loading ? 'Preparing…' : 'Download PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: LIVE PREVIEW ── */}
      <div className="flex-1 flex flex-col bg-ink-950">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
          <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">Live PDF Preview</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Updates in real-time</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={false} className="border-0">
            <QuotePDF quote={quoteData} />
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}

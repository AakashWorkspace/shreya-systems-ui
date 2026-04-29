import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, RefreshCw, Download, Eye, Calendar, User, Search, Pencil, X, Plus, Save } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import toast from 'react-hot-toast'
import api from '../api'
import QuotePDF from './QuotePDF'

const STATUS_STYLES = {
  draft:    'bg-gray-700/50 text-gray-400',
  sent:     'bg-blue-900/40 text-blue-400',
  accepted: 'bg-emerald-900/40 text-emerald-400',
  rejected: 'bg-red-900/40 text-red-400',
}

const CGST_RATE = 0.09
const SGST_RATE = 0.09

const DEFAULT_TERMS = {
  Taxes:     'GST Exclusive',
  Payment:   '100% Advance',
  Delivery:  '3-4 Business Days',
  Scope:     'Supply Only',
  Documents: 'Tax Invoice',
  Validity:  '30 Days',
}

// ── Inline Edit Modal ──────────────────────────────────────────────────────────
function EditModal({ quote, onClose, onSaved }) {
  const [quoteName, setQuoteName] = useState(quote.quote_name || '')
  const [client, setClient] = useState({
    client_name:    quote.client_name    || '',
    client_address: quote.client_address || '',
    client_gstin:   quote.client_gstin   || '',
    client_phone:   quote.client_phone   || '',
    client_email:   quote.client_email   || '',
  })
  const [notes, setNotes] = useState(quote.notes || '')
  const [taxInclusive, setTaxInclusive] = useState(quote.tax_inclusive || 'exclusive')
  const [terms, setTerms] = useState(quote.terms ? { ...DEFAULT_TERMS, ...quote.terms } : { ...DEFAULT_TERMS })
  const [lines, setLines] = useState(
    (quote.items || []).map((item, i) => ({ ...item, id: item.id || Date.now() + i }))
  )
  const [newItem, setNewItem] = useState({ item_name: '', description: '', hsn_code: '', qty: 1, rate: 0 })
  const [saving, setSaving] = useState(false)

  const updateTerm = (key, val) => setTerms(t => ({ ...t, [key]: val }))

  const subtotal = lines.reduce((s, l) => s + (l.amount || l.qty * l.rate), 0)
  let cgst, sgst, grandTotal, displaySubtotal
  if (taxInclusive === 'inclusive') {
    grandTotal = subtotal
    cgst = grandTotal * CGST_RATE / (1 + CGST_RATE + SGST_RATE)
    sgst = grandTotal * SGST_RATE / (1 + CGST_RATE + SGST_RATE)
    displaySubtotal = grandTotal - cgst - sgst
  } else {
    displaySubtotal = subtotal
    cgst = subtotal * CGST_RATE
    sgst = subtotal * SGST_RATE
    grandTotal = subtotal + cgst + sgst
  }

  const addLine = () => {
    if (!newItem.item_name) return toast.error('Enter an item name')
    if (!newItem.rate || newItem.rate <= 0) return toast.error('Rate must be > 0')
    setLines(l => [...l, { ...newItem, amount: newItem.qty * newItem.rate, id: Date.now() }])
    setNewItem({ item_name: '', description: '', hsn_code: '', qty: 1, rate: 0 })
  }

  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id))

  const updateLine = (id, field, value) => setLines(l => l.map(x => {
    if (x.id !== id) return x
    const updated = { ...x, [field]: value }
    updated.amount = (Number(updated.qty) || 1) * (Number(updated.rate) || 0)
    return updated
  }))

  const saveEdit = async () => {
    if (lines.length === 0) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const payload = {
        quote_number:   quote.quote_number,
        quote_name:     quoteName.trim() || undefined,
        date:           quote.date,
        ...client,
        notes,
        tax_inclusive:  taxInclusive,
        items: lines.map(({ id, ...rest }) => ({
          item_name:   rest.item_name,
          description: rest.description || '',
          hsn_code:    rest.hsn_code    || '',
          qty:         rest.qty,
          rate:        rest.rate,
          amount:      rest.amount ?? rest.qty * rest.rate,
        })),
        total_amount: displaySubtotal,
        cgst_amount:  cgst,
        sgst_amount:  sgst,
        grand_total:  grandTotal,
        status:       quote.status || 'draft',
        terms: { ...terms, Taxes: taxInclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive' },
      }
      await api.put(`/api/quotations/${quote.id}`, payload)
      toast.success('Quotation updated!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const quoteDataForPdf = {
    quote_number: quote.quote_number,
    quote_name:   quoteName.trim() || undefined,
    date:         quote.date,
    ...client,
    notes,
    tax_inclusive: taxInclusive,
    items: lines,
    total_amount:  displaySubtotal,
    cgst_amount:   cgst,
    sgst_amount:   sgst,
    grand_total:   grandTotal,
    terms: { ...terms, Taxes: taxInclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive' },
  }

  const termKeys = Object.keys(DEFAULT_TERMS)
  const fmt = (n) => 'Rs.' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const pdfFileName = `${(quoteName.trim() || quote.quote_number).replace(/[\/\\:*?"<>|]/g, '-')}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Editing Quotation</p>
            <p className="font-mono text-gold-600 font-bold text-sm mt-0.5">{quote.quote_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quotation Name */}
          <div>
            <p className="section-label">Quotation Name</p>
            <input
              className="input-field"
              placeholder="e.g. Office Supply – ABC Corp (used as PDF filename)"
              value={quoteName}
              onChange={e => setQuoteName(e.target.value)}
            />
          </div>

          {/* GST Toggle */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">GST Mode:</span>
            <button
              onClick={() => setTaxInclusive(t => t === 'inclusive' ? 'exclusive' : 'inclusive')}
              className={`relative w-8 h-4 rounded-full transition-colors ${taxInclusive === 'inclusive' ? 'bg-gold-400' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow ${taxInclusive === 'inclusive' ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span>{taxInclusive === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'}</span>
          </div>

          {/* Client Details */}
          <div className="space-y-3">
            <p className="section-label">Client Details</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field col-span-2" placeholder="Client / Company Name" value={client.client_name} onChange={e => setClient(c => ({ ...c, client_name: e.target.value }))} />
              <input className="input-field col-span-2" placeholder="Address" value={client.client_address} onChange={e => setClient(c => ({ ...c, client_address: e.target.value }))} />
              <input className="input-field" placeholder="GSTIN" value={client.client_gstin} onChange={e => setClient(c => ({ ...c, client_gstin: e.target.value }))} />
              <input className="input-field" placeholder="Phone" value={client.client_phone} onChange={e => setClient(c => ({ ...c, client_phone: e.target.value }))} />
              <input className="input-field col-span-2" placeholder="Email" value={client.client_email} onChange={e => setClient(c => ({ ...c, client_email: e.target.value }))} />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <p className="section-label">Line Items</p>
            {lines.length > 0 && (
              <div className="card overflow-hidden mb-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ink-800 text-gray-400">
                      <th className="text-left px-3 py-2 font-medium">Item</th>
                      <th className="text-center px-2 py-2 font-medium w-14">Qty</th>
                      <th className="text-right px-2 py-2 font-medium w-28">Rate</th>
                      <th className="text-right px-3 py-2 font-medium w-28">Amount</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={line.id} className={`border-t border-ink-700 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                        <td className="px-2 py-1.5">
                          <input
                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-1.5 py-1 text-gray-800 font-medium outline-none transition-colors"
                            value={line.item_name}
                            onChange={e => updateLine(line.id, 'item_name', e.target.value)}
                            placeholder="Item name"
                          />
                          <input
                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-1.5 py-0.5 text-gray-500 text-[10px] outline-none transition-colors mt-0.5"
                            value={line.description || ''}
                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                            placeholder="Description (optional)"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min="1"
                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-1.5 py-1 text-center text-gray-700 outline-none transition-colors"
                            value={line.qty}
                            onChange={e => updateLine(line.id, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min="0" step="0.01"
                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 rounded px-1.5 py-1 text-right font-mono text-gray-700 outline-none transition-colors"
                            value={line.rate}
                            onChange={e => updateLine(line.id, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="text-right px-3 py-1.5 font-mono font-semibold text-gold-500 whitespace-nowrap">
                          {fmt(line.amount ?? line.qty * line.rate)}
                        </td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeLine(line.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-ink-800 border-t border-ink-600 px-4 py-2 flex justify-between text-sm font-semibold text-gold-300">
                  <span>Grand Total</span>
                  <span className="font-mono">{fmt(grandTotal)}</span>
                </div>
              </div>
            )}

            {/* Add new item row */}
            <div className="card p-3 space-y-2">
              <p className="text-xs text-gray-500 font-semibold">Add Item</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field text-xs col-span-2" placeholder="Item name *" value={newItem.item_name} onChange={e => setNewItem(i => ({ ...i, item_name: e.target.value }))} />
                <input className="input-field text-xs col-span-2" placeholder="Description" value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} />
                <input className="input-field text-xs" placeholder="HSN Code" value={newItem.hsn_code} onChange={e => setNewItem(i => ({ ...i, hsn_code: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-field text-xs" type="number" min="1" placeholder="Qty" value={newItem.qty} onChange={e => setNewItem(i => ({ ...i, qty: parseInt(e.target.value) || 1 }))} />
                  <input className="input-field text-xs" type="number" min="0" placeholder="Rate" value={newItem.rate || ''} onChange={e => setNewItem(i => ({ ...i, rate: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Amount: <span className="text-gold-400 font-mono">{fmt((newItem.qty || 1) * (newItem.rate || 0))}</span></span>
                <button onClick={addLine} className="btn-primary !py-1.5 !px-3 flex items-center gap-1.5 text-xs">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-2">
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
            <textarea className="input-field resize-none text-xs" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional remarks…" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={saveEdit} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <PDFDownloadLink document={<QuotePDF quote={quoteDataForPdf} />} fileName={pdfFileName}>
              {({ loading: pdfLoading }) => (
                <button className="btn-ghost flex items-center gap-2 flex-1 justify-center">
                  <Download className="w-4 h-4" />
                  {pdfLoading ? 'Preparing…' : 'Download PDF'}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Archive Component ─────────────────────────────────────────────────────
export default function QuoteHistory() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingQuote, setEditingQuote] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/quotations')
      setQuotes(data)
    } catch {
      toast.error('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const deleteQuote = async (id, num) => {
    if (!confirm(`Delete quotation ${num}?`)) return
    try {
      await api.delete(`/api/quotations/${id}`)
      toast.success('Quotation deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const filteredQuotes = quotes.filter(q => {
    if (!searchQuery.trim()) return true
    const q_ = searchQuery.toLowerCase()
    return (
      q.quote_number?.toLowerCase().includes(q_) ||
      q.client_name?.toLowerCase().includes(q_) ||
      q.quote_name?.toLowerCase().includes(q_)
    )
  })

  const pdfFileName = (q) =>
    `${(q.quote_name?.trim() || q.quote_number).replace(/[\/\\:*?"<>|]/g, '-')}.pdf`

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="section-label">History</p>
          <h2 className="font-display text-2xl text-gray-900">Quotation Archive</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredQuotes.length} of {quotes.length} quotation{quotes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 !py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          className="input-field pl-10"
          placeholder="Search by name, client or quotation number…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors text-xs"
            onClick={() => setSearchQuery('')}
          >✕</button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading quotations…</span>
        </div>
      ) : filteredQuotes.length === 0 && searchQuery ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <Search className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">No quotations match <span className="text-gold-400 font-mono">"{searchQuery}"</span></p>
          <button onClick={() => setSearchQuery('')} className="btn-ghost !py-1.5 !px-4 text-xs">Clear Search</button>
        </div>
      ) : quotes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <FileText className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">No quotations yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((q) => (
            <div key={q.id} className="card overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-gold-600 font-semibold text-sm">{q.quote_number}</span>
                      {q.quote_name && (
                        <span className="text-sm text-gray-700 font-medium truncate max-w-[220px]">— {q.quote_name}</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status] || STATUS_STYLES.draft}`}>
                        {q.status?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      {q.client_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {q.client_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Grand Total</p>
                    <p className="font-mono font-semibold text-gold-600">{fmt(q.grand_total || q.total_amount)}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Eye — expand items */}
                    <button
                      onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="p-2 text-gray-500 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors"
                      title="View items"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Pencil — edit */}
                    <button
                      onClick={() => setEditingQuote(q)}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit quotation"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Download */}
                    <PDFDownloadLink
                      document={<QuotePDF quote={q} />}
                      fileName={pdfFileName(q)}
                    >
                      {({ loading: pdfLoading }) => (
                        <button
                          className="p-2 text-gray-500 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </PDFDownloadLink>

                    {/* Delete */}
                    <button
                      onClick={() => deleteQuote(q.id, q.quote_number)}
                      className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable items */}
              {expanded === q.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  {q.items && q.items.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-200">
                          <th className="text-left py-1.5 font-medium">Item</th>
                          <th className="text-center py-1.5 font-medium w-12">Qty</th>
                          <th className="text-right py-1.5 font-medium w-24">Rate</th>
                          <th className="text-right py-1.5 font-medium w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="py-2">
                              <p className="text-gray-700 font-medium">{item.item_name}</p>
                              {item.description && (
                                <p className="text-gray-600 mt-0.5 truncate max-w-xs">{item.description}</p>
                              )}
                            </td>
                            <td className="py-2 text-center text-gray-500">{item.qty}</td>
                            <td className="py-2 text-right font-mono text-gray-500">{fmt(item.rate)}</td>
                            <td className="py-2 text-right font-mono text-gold-500 font-semibold">{fmt(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-600 text-xs">No items recorded.</p>
                  )}

                  {/* Totals */}
                  <div className="mt-3 flex justify-end">
                    <div className="space-y-1 text-xs min-w-[180px]">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="font-mono">{fmt(q.total_amount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>CGST 9%</span>
                        <span className="font-mono">{fmt(q.cgst_amount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>SGST 9%</span>
                        <span className="font-mono">{fmt(q.sgst_amount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gold-300 border-t border-ink-600 pt-1.5">
                        <span>Grand Total</span>
                        <span className="font-mono">{fmt(q.grand_total || q.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {q.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic border-t border-ink-700 pt-3">
                      Note: {q.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingQuote && (
        <EditModal
          quote={editingQuote}
          onClose={() => setEditingQuote(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}

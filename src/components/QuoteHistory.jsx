import React, { useState, useEffect } from 'react'
import { FileText, Trash2, RefreshCw, Download, Eye, Calendar, User } from 'lucide-react'
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

export default function QuoteHistory() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

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

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="section-label">History</p>
          <h2 className="font-display text-2xl text-white">Quotation Archive</h2>
          <p className="text-gray-500 text-sm mt-1">
            {quotes.length} quotation{quotes.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 !py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading quotations…</span>
        </div>
      ) : quotes.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <FileText className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">No quotations yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="card overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-gold-300 font-semibold text-sm">
                        {q.quote_number}
                      </span>
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
                    <p className="font-mono font-semibold text-gold-300">{fmt(q.grand_total || q.total_amount)}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="p-2 text-gray-500 hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-colors"
                      title="View items"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <PDFDownloadLink
                      document={<QuotePDF quote={q} />}
                      fileName={`${q.quote_number.replace(/\//g, '-')}.pdf`}
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
                <div className="border-t border-ink-700 bg-ink-800/40 px-5 py-4">
                  {q.items && q.items.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-ink-600">
                          <th className="text-left py-1.5 font-medium">Item</th>
                          <th className="text-center py-1.5 font-medium w-12">Qty</th>
                          <th className="text-right py-1.5 font-medium w-24">Rate</th>
                          <th className="text-right py-1.5 font-medium w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.items.map((item, i) => (
                          <tr key={i} className="border-b border-ink-700/40">
                            <td className="py-2">
                              <p className="text-gray-300 font-medium">{item.item_name}</p>
                              {item.description && (
                                <p className="text-gray-600 mt-0.5 truncate max-w-xs">{item.description}</p>
                              )}
                            </td>
                            <td className="py-2 text-center text-gray-400">{item.qty}</td>
                            <td className="py-2 text-right font-mono text-gray-400">{fmt(item.rate)}</td>
                            <td className="py-2 text-right font-mono text-gold-300 font-semibold">{fmt(item.amount)}</td>
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
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Search, Trash2, Edit2, X, Check, RefreshCw, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

export default function ViewItems() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/items?search=${encodeURIComponent(search)}&limit=200`)
      setItems(data)
    } catch {
      toast.error('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  const startEdit = (item) => {
    setEditId(item.id)
    setEditForm({ name: item.name, description: item.description || '', rate: item.rate, hsn_code: item.hsn_code || '', category: item.category || '' })
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/api/items/${id}`, { ...editForm, rate: parseFloat(editForm.rate) })
      toast.success('Item updated')
      setEditId(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/api/items/${id}`)
      toast.success('Item removed')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="section-label">Item Catalogue</p>
          <h2 className="font-display text-2xl text-gray-900">Product & Service Library</h2>
          <p className="text-gray-500 text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in catalogue</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 !py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        <input
          className="input-field pl-10 max-w-sm"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading catalogue…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <Package className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm">
            {search ? 'No items match your search.' : 'Your catalogue is empty. Add items to get started.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gold-50 border-b border-ink-700">
                {['Item Name', 'Description', 'HSN/SAC', 'Category', 'Rate (₹)', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gold-600 tracking-wider uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={`border-b border-ink-700/60 transition-colors
                    ${i % 2 === 0 ? 'bg-white' : 'bg-ink-800/40'}
                    hover:bg-gold-50`}
                >
                  {editId === item.id ? (
                    // Edit row
                    <>
                      <td className="px-3 py-2">
                        <input className="input-field text-xs !py-1.5"
                          value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input-field text-xs !py-1.5"
                          value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input-field text-xs !py-1.5 w-24"
                          value={editForm.hsn_code} onChange={e => setEditForm(f => ({ ...f, hsn_code: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input-field text-xs !py-1.5"
                          value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input-field text-xs !py-1.5 w-24" type="number"
                          value={editForm.rate} onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(item.id)}
                            className="p-1.5 text-gold-400 hover:bg-gold-400/10 rounded-md transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="p-1.5 text-gray-500 hover:bg-ink-600 rounded-md transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Read row
                    <>
                      <td className="px-4 py-3">
                        <span className="text-gray-800 font-medium">{item.name}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-gray-500 text-xs truncate block">{item.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{item.hsn_code || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {item.category ? (
                          <span className="bg-gold-100 text-gold-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {item.category}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gold-500 font-mono font-semibold">
                          ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-gold-500 hover:bg-gold-50 rounded-md transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteItem(item.id, item.name)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { Plus, Tag, Hash, DollarSign, FileText, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'

export default function AddItem({ onAdded }) {
  const [form, setForm] = useState({
    name: '', description: '', rate: '', hsn_code: '', category: '',
  })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.rate) return toast.error('Name and Rate are required')
    setLoading(true)
    try {
      await api.post('/api/items', { ...form, rate: parseFloat(form.rate) })
      toast.success(`"${form.name}" added to catalogue`)
      setForm({ name: '', description: '', rate: '', hsn_code: '', category: '' })
      onAdded?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name',        label: 'Item / Product Name', placeholder: 'e.g. Dell Gaming G15 5530', icon: Tag,        required: true, col: 2 },
    { name: 'description', label: 'Description',          placeholder: 'Full technical specification…',  icon: FileText,    required: false, col: 2 },
    { name: 'rate',        label: 'Rate (₹)',             placeholder: '0.00',                          icon: DollarSign,  required: true,  col: 1, type: 'number' },
    { name: 'hsn_code',    label: 'HSN / SAC Code',       placeholder: 'e.g. 84713010',                icon: Hash,        required: false, col: 1 },
    { name: 'category',    label: 'Category',             placeholder: 'e.g. Laptops, Peripherals',    icon: Layers,      required: false, col: 2 },
  ]

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <p className="section-label">Item Catalogue</p>
        <h2 className="font-display text-2xl text-gray-900">Add New Item</h2>
        <p className="text-gray-500 text-sm mt-1">
          Items saved here appear in the typeahead search when building quotations.
        </p>
      </div>

      <div className="card p-7">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ name, label, placeholder, icon: Icon, required, col, type }) => (
              <div key={name} className={col === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  {label} {required && <span className="text-gold-400">*</span>}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  {name === 'description' ? (
                    <textarea
                      name={name}
                      value={form[name]}
                      onChange={handle}
                      placeholder={placeholder}
                      rows={3}
                      className="input-field pl-8 resize-none"
                    />
                  ) : (
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handle}
                      placeholder={placeholder}
                      type={type || 'text'}
                      min={type === 'number' ? '0' : undefined}
                      step={type === 'number' ? '0.01' : undefined}
                      className="input-field pl-8"
                      required={required}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview chip */}
          {form.name && (
            <div className="flex items-center gap-3 bg-gold-50 border border-gold-200 rounded-lg px-4 py-3">
              <div className="w-8 h-8 bg-gold-400/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-gold-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{form.name}</p>
                {form.description && (
                  <p className="text-xs text-gray-500 truncate">{form.description}</p>
                )}
              </div>
              {form.rate && (
                <span className="text-gold-500 font-mono text-sm font-semibold ml-auto">
                  ₹{parseFloat(form.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}

          <div className="gold-rule pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              <Plus className="w-4 h-4" />
              {loading ? 'Saving…' : 'Add to Catalogue'}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="mt-5 bg-gold-400/5 border border-gold-400/15 rounded-xl p-4">
        <p className="text-xs font-semibold text-gold-400/80 uppercase tracking-widest mb-2">Pro Tips</p>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex gap-2"><span className="text-gold-400">→</span> Use precise product names for faster typeahead search.</li>
          <li className="flex gap-2"><span className="text-gold-400">→</span> HSN codes appear on the final PDF for GST compliance.</li>
          <li className="flex gap-2"><span className="text-gold-400">→</span> Rates can be overridden per-quotation when building quotes.</li>
        </ul>
      </div>
    </div>
  )
}

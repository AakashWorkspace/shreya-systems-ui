import React, { useState, useEffect } from 'react'
import Auth from './Auth'
import CreateQuotation from './components/CreateQuotation'
import AddItem from './components/AddItem'
import ViewItems from './components/ViewItems'
import QuoteHistory from './components/QuoteHistory'
import {
  FilePlus, Package, Library, History, LogOut,
  ChevronRight, Menu, X, Zap,
} from 'lucide-react'

const NAV = [
  { id: 'create', label: 'New Quotation',     icon: FilePlus,  desc: 'Split-screen builder' },
  { id: 'add',    label: 'Add Item',           icon: Package,   desc: 'Expand catalogue'     },
  { id: 'items',  label: 'Item Catalogue',     icon: Library,   desc: 'Browse & edit items'  },
  { id: 'history',label: 'Quotation Archive',  icon: History,   desc: 'Past quotations'      },
]

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_user')) } catch { return null }
  })
  const [active, setActive] = useState('create')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const logout = () => {
    localStorage.removeItem('ss_token')
    localStorage.removeItem('ss_user')
    setUser(null)
  }

  if (!user) return <Auth onAuth={setUser} />

  const currentNav = NAV.find(n => n.id === active)

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">

      {/* ── SIDEBAR ── */}
      <aside className={`flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        bg-ink-900 border-r border-ink-700 relative
        ${sidebarOpen ? 'w-60' : 'w-16'}`}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-ink-700 overflow-hidden`}>
          <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-950" fill="currentColor" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-gold-400 font-display font-bold text-sm leading-tight whitespace-nowrap">
                SHREYA SYSTEMS
              </p>
              <p className="text-gray-600 text-[10px] whitespace-nowrap tracking-wide">
                QUOTATION STUDIO
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon, desc }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                title={!sidebarOpen ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left group
                  ${isActive
                    ? 'bg-gold-400/10 text-gold-300 border border-gold-400/20'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-ink-800'}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gold-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${isActive ? 'text-gold-200' : ''}`}>
                      {label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-gold-400/60' : 'text-gray-700'}`}>
                      {desc}
                    </p>
                  </div>
                )}
                {sidebarOpen && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-ink-700 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gold-400 text-xs font-bold uppercase">
                  {user.username?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{user.full_name || user.username}</p>
                <p className="text-[10px] text-gray-600 truncate">{user.username}</p>
              </div>
              <button onClick={logout} title="Logout"
                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={logout} title="Logout"
              className="w-full flex justify-center p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="absolute -right-3 top-[72px] w-6 h-6 bg-ink-800 border border-ink-600
                     rounded-full flex items-center justify-center text-gray-500
                     hover:text-gold-400 hover:border-gold-400/40 transition-colors z-10"
        >
          {sidebarOpen
            ? <X className="w-3 h-3" />
            : <Menu className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-ink-700 bg-ink-900/50 flex-shrink-0">
          <div>
            <h1 className="font-display text-lg text-white leading-tight">
              {currentNav?.label}
            </h1>
            <p className="text-xs text-gray-500">{currentNav?.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="w-px h-6 bg-ink-600" />
            <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center">
              <span className="text-gold-400 text-xs font-bold uppercase">
                {user.username?.[0] || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page */}
        <div className={`flex-1 overflow-hidden ${active === 'create' ? '' : 'overflow-y-auto'}`}>
          {active === 'create' && (
            <div className="h-full">
              <CreateQuotation
                key={refreshKey}
                onSaved={() => { setRefreshKey(k => k + 1); setTimeout(() => setActive('history'), 800) }}
              />
            </div>
          )}
          {active === 'add' && (
            <div className="p-8">
              <AddItem onAdded={() => {}} />
            </div>
          )}
          {active === 'items' && (
            <div className="p-8">
              <ViewItems />
            </div>
          )}
          {active === 'history' && (
            <div className="p-8">
              <QuoteHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

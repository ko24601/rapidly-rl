import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// ─── Utilities ────────────────────────────────────────────────────────────────

async function sha256(text) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function compressImage(file, maxPx, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const COUNTRIES = [
  '🇦🇺 Australia','🇦🇹 Austria','🇧🇪 Belgium','🇧🇷 Brazil','🇨🇦 Canada',
  '🇨🇳 China','🇩🇰 Denmark','🇫🇮 Finland','🇫🇷 France','🇩🇪 Germany',
  '🇬🇷 Greece','🇭🇺 Hungary','🇮🇳 India','🇮🇩 Indonesia','🇮🇪 Ireland',
  '🇮🇱 Israel','🇮🇹 Italy','🇯🇵 Japan','🇲🇽 Mexico','🇳🇱 Netherlands',
  '🇳🇿 New Zealand','🇳🇴 Norway','🇵🇱 Poland','🇵🇹 Portugal','🇷🇴 Romania',
  '🇷🇺 Russia','🇸🇦 Saudi Arabia','🇿🇦 South Africa','🇰🇷 South Korea',
  '🇪🇸 Spain','🇸🇪 Sweden','🇨🇭 Switzerland','🇹🇷 Turkey','🇦🇪 UAE',
  '🇬🇧 United Kingdom','🇺🇸 United States','🇺🇦 Ukraine','🇦🇷 Argentina',
]

const NEWS_CATEGORIES = ['Breaking', 'Team Update', 'Race Report', 'Other']
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'drivers', label: 'Drivers', icon: '🏎' },
  { id: 'staff', label: 'Staff', icon: '👥' },
  { id: 'sponsors', label: 'Sponsors', icon: '🤝' },
  { id: 'enquiries', label: 'Enquiries', icon: '📬' },
  { id: 'results', label: 'Results', icon: '🏁' },
  { id: 'standings', label: 'Standings', icon: '🏆' },
  { id: 'gallery', label: 'Gallery', icon: '🖼' },
]
const PARTNERSHIP_TYPES = ['Title Sponsor', 'Co-Sponsor', 'Technical Partner', 'Media Partner', 'Community Partner', 'Other']
const TIERS = ['Primary', 'Gold', 'Silver', 'Community']

// ─── Shared Components ────────────────────────────────────────────────────────

function AdminCard({ label, children }) {
  return (
    <div style={{
      background: 'rgba(20,20,20,0.9)',
      border: '1px solid var(--border)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {label && (
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          letterSpacing: '3px', textTransform: 'uppercase',
          color: 'var(--primary)', background: 'rgba(255,0,0,0.05)',
        }}>
          {label}
        </div>
      )}
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function RowBtns({ onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onEdit}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1px',
          padding: '5px 12px', background: 'transparent',
          border: '1px solid var(--primary)', color: 'var(--primary)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1px',
          padding: '5px 12px', background: 'transparent',
          border: '1px solid rgba(255,80,80,0.4)', color: '#ff5555',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        Delete
      </button>
    </div>
  )
}

function EditBox({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: 'rgba(255,0,0,0.04)',
        border: '1px solid rgba(255,0,0,0.2)',
        borderRadius: '2px',
        padding: '20px',
        marginTop: '8px',
      }}
    >
      {children}
    </motion.div>
  )
}

function FieldInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg)',
          border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          color: 'var(--text)', fontFamily: 'var(--font-body)',
          fontSize: '14px', padding: '9px 12px', outline: 'none',
          width: '100%', transition: 'border-color 0.2s', borderRadius: '2px',
        }}
      />
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg)',
          border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          color: 'var(--text)', fontFamily: 'var(--font-body)',
          fontSize: '14px', padding: '9px 12px', outline: 'none',
          width: '100%', transition: 'border-color 0.2s', borderRadius: '2px', appearance: 'none',
        }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function FieldTextarea({ label, value, onChange, rows = 3, placeholder = '' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg)',
          border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          color: 'var(--text)', fontFamily: 'var(--font-body)',
          fontSize: '14px', padding: '9px 12px', outline: 'none',
          width: '100%', transition: 'border-color 0.2s', borderRadius: '2px',
          resize: 'vertical',
        }}
      />
    </div>
  )
}

function SaveBtn({ onClick, label = 'Save' }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--primary)', color: '#fff',
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '15px',
        letterSpacing: '2px', textTransform: 'uppercase',
        padding: '10px 24px', border: 'none', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function CancelBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', color: 'var(--muted)',
        fontFamily: 'var(--font-mono)', fontSize: '12px',
        padding: '10px 16px', border: '1px solid var(--border)', cursor: 'pointer',
      }}
    >
      Cancel
    </button>
  )
}

function grid2(children) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>{children}</div>
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ dbData, drivers, updateDb }) {
  const stats = [
    { label: 'News Posts', value: (dbData.news || []).length, icon: '📰' },
    { label: 'Calendar Rounds', value: (dbData.calendar || []).length, icon: '📅' },
    { label: 'Drivers', value: drivers.length, icon: '🏎' },
    { label: 'Staff', value: (dbData.staff || []).length, icon: '👥' },
    { label: 'Sponsors', value: (dbData.sponsors || []).length, icon: '🤝' },
    { label: 'Enquiries', value: (dbData.enquiries || []).length, icon: '📬' },
  ]

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')

  async function changePassword() {
    if (!pw.next || pw.next !== pw.confirm) { setPwMsg('Passwords do not match'); return }
    if (dbData.passHash) {
      const currentHash = await sha256(pw.current)
      if (currentHash !== dbData.passHash) { setPwMsg('Current password incorrect'); return }
    }
    const hash = await sha256(pw.next)
    await updateDb({ passHash: hash })
    setPwMsg('✓ Password updated!')
    setPw({ current: '', next: '', confirm: '' })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '2px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', marginTop: '4px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <AdminCard label="Change Password">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {dbData.passHash && <FieldInput label="Current Password" type="password" value={pw.current} onChange={v => setPw(p => ({ ...p, current: v }))} />}
          <FieldInput label="New Password" type="password" value={pw.next} onChange={v => setPw(p => ({ ...p, next: v }))} />
          <FieldInput label="Confirm New" type="password" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SaveBtn onClick={changePassword} label="Update Password" />
          {pwMsg && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: pwMsg.startsWith('✓') ? '#4caf50' : '#ff5555' }}>{pwMsg}</span>}
        </div>
      </AdminCard>
    </div>
  )
}

// ─── News Tab ─────────────────────────────────────────────────────────────────

function NewsTab({ dbData, updateDb }) {
  const news = dbData.news || []
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category: NEWS_CATEGORIES[0], body: '', author: '' })

  function startEdit(item) { setEditing(item.id); setEditData({ ...item }); setAdding(false) }
  function cancelEdit() { setEditing(null) }

  async function saveEdit() {
    await updateDb({ news: news.map(n => n.id === editing ? editData : n) })
    setEditing(null)
    showToast('News post saved successfully')
  }

  async function deleteItem(id) {
    if (!confirm('Delete this news post?')) return
    await updateDb({ news: news.filter(n => n.id !== id) })
    showToast('News post deleted', 'error')
  }

  async function addItem() {
    if (!newItem.title || !newItem.body) return
    const item = { ...newItem, id: Date.now(), date: new Date().toISOString().slice(0, 10) }
    await updateDb({ news: [item, ...news] })
    setNewItem({ title: '', category: NEWS_CATEGORIES[0], body: '', author: '' })
    setAdding(false)
    showToast('News post published')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Post" />
      </div>

      <AnimatePresence>
        {adding && (
          <EditBox key="add">
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {grid2(<>
                <FieldInput label="Title" value={newItem.title} onChange={v => setNewItem(p => ({ ...p, title: v }))} placeholder="News headline" />
                <FieldSelect label="Category" value={newItem.category} onChange={v => setNewItem(p => ({ ...p, category: v }))} options={NEWS_CATEGORIES} />
                <FieldInput label="Author" value={newItem.author} onChange={v => setNewItem(p => ({ ...p, author: v }))} placeholder="Author name" />
              </>)}
              <FieldTextarea label="Body" value={newItem.body} onChange={v => setNewItem(p => ({ ...p, body: v }))} placeholder="Write the full news post..." rows={4} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Publish" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>

      {news.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>
          NO NEWS POSTS YET
        </div>
      ) : (
        news.map((item) => (
          <AdminCard key={item.id} label={null}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '2px' }}>
                  {item.category} · {item.date} {item.author && `· ${item.author}`}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.body}
                </p>
              </div>
              <RowBtns onEdit={() => startEdit(item)} onDelete={() => deleteItem(item.id)} />
            </div>
            <AnimatePresence>
              {editing === item.id && (
                <EditBox key="edit">
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                    {grid2(<>
                      <FieldInput label="Title" value={editData.title || ''} onChange={v => setEditData(p => ({ ...p, title: v }))} />
                      <FieldSelect label="Category" value={editData.category || NEWS_CATEGORIES[0]} onChange={v => setEditData(p => ({ ...p, category: v }))} options={NEWS_CATEGORIES} />
                      <FieldInput label="Author" value={editData.author || ''} onChange={v => setEditData(p => ({ ...p, author: v }))} />
                    </>)}
                    <FieldTextarea label="Body" value={editData.body || ''} onChange={v => setEditData(p => ({ ...p, body: v }))} rows={4} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={cancelEdit} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function RoundForm({ data, setData }) {
  return (
    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
      {grid2(<>
        <FieldInput label="Round #" value={data.round || ''} onChange={v => setData(p => ({ ...p, round: v }))} placeholder="1" />
        <FieldInput label="Circuit" value={data.circuit || ''} onChange={v => setData(p => ({ ...p, circuit: v }))} placeholder="Monza" />
        <FieldInput label="Country" value={data.country || ''} onChange={v => setData(p => ({ ...p, country: v }))} placeholder="Italy" />
        <FieldInput label="Category" value={data.category || ''} onChange={v => setData(p => ({ ...p, category: v }))} placeholder="GT3 Pro" />
        <FieldInput label="Date" value={data.date || ''} onChange={v => setData(p => ({ ...p, date: v }))} placeholder="2026-06-14" />
        <FieldSelect label="Status" value={data.status || 'TBD'} onChange={v => setData(p => ({ ...p, status: v }))} options={['Next', 'Done', 'TBD']} />
      </>)}
    </div>
  )
}

function CalendarTab({ dbData, updateDb }) {
  const rounds = dbData.calendar || []
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const blank = { round: '', circuit: '', country: '', category: '', date: '', status: 'TBD' }
  const [newItem, setNewItem] = useState(blank)

  function startEdit(r) { setEditing(r.id); setEditData({ ...r }); setAdding(false) }

  async function saveEdit() {
    await updateDb({ calendar: rounds.map(r => r.id === editing ? editData : r) })
    setEditing(null)
    showToast('Round saved successfully')
  }

  async function deleteItem(id) {
    if (!confirm('Delete this round?')) return
    await updateDb({ calendar: rounds.filter(r => r.id !== id) })
    showToast('Round deleted', 'error')
  }

  async function addItem() {
    if (!newItem.circuit) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ calendar: [...rounds, item] })
    setNewItem(blank)
    setAdding(false)
    showToast('Round added')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Round" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox key="add">
            <RoundForm data={newItem} setData={setNewItem} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Add Round" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>
      {rounds.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>
          NO ROUNDS YET
        </div>
      ) : (
        rounds.map((r) => (
          <AdminCard key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '13px', marginRight: '12px' }}>R{r.round}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{r.circuit}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginLeft: '12px', letterSpacing: '1px' }}>
                  {r.date} · {r.status}
                </span>
              </div>
              <RowBtns onEdit={() => startEdit(r)} onDelete={() => deleteItem(r.id)} />
            </div>
            <AnimatePresence>
              {editing === r.id && (
                <EditBox>
                  <RoundForm data={editData} setData={setEditData} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={() => setEditing(null)} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Drivers Tab ──────────────────────────────────────────────────────────────

function DriverForm({ data, setData, onPhotoChange }) {
  return (
    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
      {grid2(<>
        <FieldInput label="Name" value={data.name || ''} onChange={v => setData(p => ({ ...p, name: v }))} />
        <FieldSelect label="Nationality" value={data.nationality || COUNTRIES[0]} onChange={v => setData(p => ({ ...p, nationality: v }))} options={COUNTRIES} />
        <FieldInput label="Car Number" value={data.number || ''} onChange={v => setData(p => ({ ...p, number: v }))} />
        <FieldInput label="Category" value={data.category || ''} onChange={v => setData(p => ({ ...p, category: v }))} />
        <FieldInput label="Discord" value={data.discord || ''} onChange={v => setData(p => ({ ...p, discord: v }))} />
      </>)}
      <FieldTextarea label="Bio" value={data.bio || ''} onChange={v => setData(p => ({ ...p, bio: v }))} rows={2} />
      {grid2(<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>Team Colour</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="color" value={data.teamColor || '#39FF14'} onChange={e => setData(p => ({ ...p, teamColor: e.target.value }))}
              style={{ width: '40px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', padding: '2px' }} />
            <input type="text" value={data.teamColor || ''} onChange={e => setData(p => ({ ...p, teamColor: e.target.value }))} placeholder="#39FF14"
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>Helmet Colour</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="color" value={data.helmetColor || '#39FF14'} onChange={e => setData(p => ({ ...p, helmetColor: e.target.value }))}
              style={{ width: '40px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', padding: '2px' }} />
            <input type="text" value={data.helmetColor || ''} onChange={e => setData(p => ({ ...p, helmetColor: e.target.value }))} placeholder="#39FF14"
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
          </div>
        </div>
      </>)}
      <div>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
          Photo (will be compressed to 480px)
        </label>
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && onPhotoChange(e.target.files[0])}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
        {data.photo && <img src={data.photo} style={{ width: '80px', height: '107px', objectFit: 'cover', marginTop: '8px', border: '1px solid var(--border)' }} />}
      </div>
    </div>
  )
}

function DriversTab({ drivers, saveDriver, deleteDriver }) {
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const blank = { name: '', nationality: COUNTRIES[0], flag: '', number: '', category: '', bio: '', discord: '', photo: '' }
  const [newItem, setNewItem] = useState(blank)

  async function handlePhoto(file, setter) {
    if (!file) return
    const b64 = await compressImage(file, 480, 0.78)
    setter(p => ({ ...p, photo: b64 }))
  }

  function startEdit(d) { setEditing(d.id); setEditData({ ...d }); setAdding(false) }

  async function saveEdit() {
    await saveDriver(editing, editData)
    setEditing(null)
    showToast('Driver saved successfully')
  }

  async function addItem() {
    if (!newItem.name) return
    const id = `driver_${Date.now()}`
    await saveDriver(id, newItem)
    setNewItem(blank)
    setAdding(false)
    showToast('Driver added')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver?')) return
    await deleteDriver(id)
    showToast('Driver deleted', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Driver" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <DriverForm data={newItem} setData={setNewItem} onPhotoChange={f => handlePhoto(f, setNewItem)} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Add Driver" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>
      {drivers.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>NO DRIVERS YET</div>
      ) : (
        drivers.map((d) => (
          <AdminCard key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {d.photo && <img src={d.photo} style={{ width: '40px', height: '53px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
                    {d.nationality} · #{d.number} · {d.category}
                  </div>
                </div>
              </div>
              <RowBtns onEdit={() => startEdit(d)} onDelete={() => handleDelete(d.id)} />
            </div>
            <AnimatePresence>
              {editing === d.id && (
                <EditBox>
                  <DriverForm data={editData} setData={setEditData} onPhotoChange={f => handlePhoto(f, setEditData)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={() => setEditing(null)} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────

function StaffForm({ data, setData, onPhotoChange }) {
  return (
    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
      {grid2(<>
        <FieldInput label="Name" value={data.name || ''} onChange={v => setData(p => ({ ...p, name: v }))} />
        <FieldInput label="Role" value={data.role || ''} onChange={v => setData(p => ({ ...p, role: v }))} />
        <FieldInput label="Discord" value={data.discord || ''} onChange={v => setData(p => ({ ...p, discord: v }))} />
      </>)}
      <FieldTextarea label="Bio" value={data.bio || ''} onChange={v => setData(p => ({ ...p, bio: v }))} rows={2} />
      <div>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
          Photo (300px / 0.72q)
        </label>
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && onPhotoChange(e.target.files[0])}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
        {data.photo && <img src={data.photo} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid var(--primary)' }} />}
      </div>
    </div>
  )
}

function StaffTab({ dbData, updateDb }) {
  const staff = dbData.staff || []
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const blank = { name: '', role: '', discord: '', bio: '', photo: '' }
  const [newItem, setNewItem] = useState(blank)

  async function handlePhoto(file, setter) {
    const b64 = await compressImage(file, 300, 0.72)
    setter(p => ({ ...p, photo: b64 }))
  }

  function startEdit(m) { setEditing(m.id); setEditData({ ...m }); setAdding(false) }

  async function saveEdit() {
    await updateDb({ staff: staff.map(m => m.id === editing ? editData : m) })
    setEditing(null)
  }

  async function addItem() {
    if (!newItem.name) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ staff: [...staff, item] })
    setNewItem(blank)
    setAdding(false)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this staff member?')) return
    await updateDb({ staff: staff.filter(m => m.id !== id) })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Staff" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <StaffForm data={newItem} setData={setNewItem} onPhotoChange={f => handlePhoto(f, setNewItem)} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Add Member" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>
      {staff.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>NO STAFF YET</div>
      ) : (
        staff.map((m) => (
          <AdminCard key={m.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {m.photo && <img src={m.photo} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--primary)', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', letterSpacing: '2px' }}>{m.role}</div>
                </div>
              </div>
              <RowBtns onEdit={() => startEdit(m)} onDelete={() => deleteItem(m.id)} />
            </div>
            <AnimatePresence>
              {editing === m.id && (
                <EditBox>
                  <StaffForm data={editData} setData={setEditData} onPhotoChange={f => handlePhoto(f, setEditData)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={() => setEditing(null)} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Sponsors Tab ─────────────────────────────────────────────────────────────

function SponsorForm({ data, setData, onLogoChange }) {
  return (
    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
      {grid2(<>
        <FieldInput label="Company Name" value={data.name || ''} onChange={v => setData(p => ({ ...p, name: v }))} />
        <FieldSelect label="Tier" value={data.tier || 'Community'} onChange={v => setData(p => ({ ...p, tier: v }))} options={TIERS} />
        <FieldSelect label="Partnership Type" value={data.type || PARTNERSHIP_TYPES[0]} onChange={v => setData(p => ({ ...p, type: v }))} options={PARTNERSHIP_TYPES} />
      </>)}
      <FieldTextarea label="Description" value={data.description || ''} onChange={v => setData(p => ({ ...p, description: v }))} rows={2} />
      <div>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
          Logo (400px / 0.85q)
        </label>
        <input type="file" accept="image/*" onChange={e => e.target.files[0] && onLogoChange(e.target.files[0])}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
        {data.logo && <img src={data.logo} style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain', marginTop: '8px', border: '1px solid var(--border)' }} />}
      </div>
    </div>
  )
}

function SponsorsTab({ dbData, updateDb }) {
  const sponsors = dbData.sponsors || []
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const blank = { name: '', description: '', tier: 'Community', type: PARTNERSHIP_TYPES[0], logo: '' }
  const [newItem, setNewItem] = useState(blank)

  async function handleLogo(file, setter) {
    const b64 = await compressImage(file, 400, 0.85)
    setter(p => ({ ...p, logo: b64 }))
  }

  function startEdit(s) { setEditing(s.id); setEditData({ ...s }); setAdding(false) }

  async function saveEdit() {
    await updateDb({ sponsors: sponsors.map(s => s.id === editing ? editData : s) })
    setEditing(null)
  }

  async function addItem() {
    if (!newItem.name) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ sponsors: [...sponsors, item] })
    setNewItem(blank)
    setAdding(false)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this sponsor?')) return
    await updateDb({ sponsors: sponsors.filter(s => s.id !== id) })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Sponsor" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <SponsorForm data={newItem} setData={setNewItem} onLogoChange={f => handleLogo(f, setNewItem)} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Add Sponsor" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>
      {sponsors.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>NO SPONSORS YET</div>
      ) : (
        sponsors.map((s) => (
          <AdminCard key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {s.logo && <img src={s.logo} style={{ maxWidth: '80px', maxHeight: '40px', objectFit: 'contain', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>{s.tier} · {s.type}</div>
                </div>
              </div>
              <RowBtns onEdit={() => startEdit(s)} onDelete={() => deleteItem(s.id)} />
            </div>
            <AnimatePresence>
              {editing === s.id && (
                <EditBox>
                  <SponsorForm data={editData} setData={setEditData} onLogoChange={f => handleLogo(f, setEditData)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={() => setEditing(null)} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Enquiries Tab ────────────────────────────────────────────────────────────

function EnquiriesTab({ dbData, updateDb }) {
  const enquiries = dbData.enquiries || []

  async function deleteItem(id) {
    if (!confirm('Delete this enquiry?')) return
    await updateDb({ enquiries: enquiries.filter(e => e.id !== id) })
  }

  if (enquiries.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>
        NO ENQUIRIES YET
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Name', 'Contact', 'Type', 'Budget', 'Message', 'Date', ''].map(h => (
              <th key={h} style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
                textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 12px', textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enquiries.map((e) => (
            <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>{e.name}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>{e.contact}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>{e.type}</td>
              <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{e.budget}</td>
              <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)', maxWidth: '200px' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</div>
              </td>
              <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{e.date}</td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => deleteItem(e.id)} style={{
                  background: 'transparent', border: '1px solid rgba(255,80,80,0.3)',
                  color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '11px',
                  padding: '4px 10px', cursor: 'pointer',
                }}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Results Tab ─────────────────────────────────────────────────────────────

function ResultsTab({ dbData, updateDb }) {
  const results = dbData.results || []
  const { showToast } = useToast()
  const [expanded, setExpanded] = useState(null)
  const [adding, setAdding] = useState(false)
  const blankEntry = { driver: '', pos: '', points: '', fastestLap: false }
  const blank = { round: '', circuit: '', date: '', category: '', entries: [{ ...blankEntry }] }
  const [newItem, setNewItem] = useState(blank)

  function setNewField(k, v) { setNewItem(p => ({ ...p, [k]: v })) }
  function setEntry(i, k, v) {
    setNewItem(p => {
      const entries = [...p.entries]
      entries[i] = { ...entries[i], [k]: v }
      return { ...p, entries }
    })
  }
  function addEntryRow() { setNewItem(p => ({ ...p, entries: [...p.entries, { ...blankEntry }] })) }
  function removeEntryRow(i) { setNewItem(p => ({ ...p, entries: p.entries.filter((_, idx) => idx !== i) })) }

  async function addItem() {
    if (!newItem.circuit) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ results: [item, ...results] })
    setNewItem(blank)
    setAdding(false)
    showToast('Race result added')
  }

  async function deleteItem(id) {
    if (!confirm('Delete this result?')) return
    await updateDb({ results: results.filter(r => r.id !== id) })
    showToast('Result deleted', 'error')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a) }} label="+ Add Result" />
      </div>

      <AnimatePresence>
        {adding && (
          <EditBox key="add-result">
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {grid2(<>
                <FieldInput label="Round (e.g. R01)" value={newItem.round} onChange={v => setNewField('round', v)} placeholder="R01" />
                <FieldInput label="Circuit" value={newItem.circuit} onChange={v => setNewField('circuit', v)} placeholder="Monza" />
                <FieldInput label="Date" value={newItem.date} onChange={v => setNewField('date', v)} placeholder="2026-06-14" />
                <FieldInput label="Category" value={newItem.category} onChange={v => setNewField('category', v)} placeholder="GT3 Pro" />
              </>)}
            </div>

            {/* Entries */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
              Driver Entries
            </div>
            {newItem.entries.map((entry, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 40px 32px', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                <FieldInput label={i === 0 ? 'Pos' : ''} value={entry.pos} onChange={v => setEntry(i, 'pos', v)} placeholder="1" />
                <FieldInput label={i === 0 ? 'Driver' : ''} value={entry.driver} onChange={v => setEntry(i, 'driver', v)} placeholder="Driver name" />
                <FieldInput label={i === 0 ? 'Points' : ''} value={entry.points} onChange={v => setEntry(i, 'points', v)} placeholder="25" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {i === 0 && <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>FL</label>}
                  <input
                    type="checkbox"
                    checked={entry.fastestLap}
                    onChange={e => setEntry(i, 'fastestLap', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', marginTop: '4px' }}
                  />
                </div>
                <div />
                <button onClick={() => removeEntryRow(i)} style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5555', cursor: 'pointer', fontSize: '14px', height: '36px', alignSelf: 'flex-end' }}>✕</button>
              </div>
            ))}
            <button onClick={addEntryRow} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', padding: '8px 16px', cursor: 'pointer', width: '100%', marginBottom: '16px' }}>
              + ADD ROW
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Save Result" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>

      {results.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>
          NO RESULTS YET
        </div>
      ) : (
        [...results].sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => (
          <AdminCard key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => setExpanded(prev => prev === r.id ? null : r.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', gap: '12px', alignItems: 'center' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '13px' }}>{r.round}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{r.circuit}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>{r.date}</span>
                  {r.category && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary)', border: '1px solid rgba(57,255,20,0.2)', padding: '2px 8px' }}>{r.category}</span>}
                  <span style={{ color: 'var(--primary)', fontSize: '12px' }}>{expanded === r.id ? '▴' : '▾'}</span>
                </button>
                <AnimatePresence>
                  {expanded === r.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Pos', 'Driver', 'Points', 'FL'].map(h => (
                              <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--muted)', padding: '6px 10px', textAlign: 'left', fontWeight: 400 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(r.entries || []).map((e, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '6px 10px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: e.pos == 1 ? '#FFD700' : e.pos == 2 ? '#C0C0C0' : e.pos == 3 ? '#CD7F32' : 'var(--text)' }}>{e.pos}</td>
                              <td style={{ padding: '6px 10px' }}>{e.driver}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--primary)', fontWeight: 700 }}>{e.points}</td>
                              <td style={{ padding: '6px 10px', color: e.fastestLap ? 'var(--primary)' : 'var(--muted)' }}>{e.fastestLap ? '✓' : '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => deleteItem(r.id)} style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.4)', color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>Delete</button>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Standings Tab ────────────────────────────────────────────────────────────

function StandingForm({ data, setData }) {
  return (
    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
      {grid2(<>
        <FieldInput label="Driver Name" value={data.driver || ''} onChange={v => setData(p => ({ ...p, driver: v }))} />
        <FieldInput label="Nationality" value={data.nationality || ''} onChange={v => setData(p => ({ ...p, nationality: v }))} placeholder="United Kingdom" />
        <FieldInput label="Flag Emoji" value={data.flag || ''} onChange={v => setData(p => ({ ...p, flag: v }))} placeholder="🇬🇧" />
        <FieldInput label="Points" value={data.points || ''} onChange={v => setData(p => ({ ...p, points: v }))} placeholder="0" />
        <FieldInput label="Wins" value={data.wins || ''} onChange={v => setData(p => ({ ...p, wins: v }))} placeholder="0" />
        <FieldInput label="Podiums" value={data.podiums || ''} onChange={v => setData(p => ({ ...p, podiums: v }))} placeholder="0" />
        <FieldInput label="Fastest Laps" value={data.fastestLaps || ''} onChange={v => setData(p => ({ ...p, fastestLaps: v }))} placeholder="0" />
      </>)}
    </div>
  )
}

function StandingsTab({ dbData, updateDb }) {
  const standings = dbData.standings || []
  const results = dbData.results || []
  const { showToast } = useToast()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const blank = { driver: '', nationality: '', flag: '', points: '', wins: '', podiums: '', fastestLaps: '' }
  const [newItem, setNewItem] = useState(blank)

  async function addItem() {
    if (!newItem.driver) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ standings: [...standings, item] })
    setNewItem(blank)
    setAdding(false)
    showToast('Standing entry added')
  }

  function startEdit(s) { setEditing(s.id); setEditData({ ...s }); setAdding(false) }

  async function saveEdit() {
    await updateDb({ standings: standings.map(s => s.id === editing ? editData : s) })
    setEditing(null)
    showToast('Standing saved')
  }

  async function deleteItem(id) {
    if (!confirm('Delete this standing?')) return
    await updateDb({ standings: standings.filter(s => s.id !== id) })
    showToast('Standing deleted', 'error')
  }

  async function recalculate() {
    if (!results.length) { showToast('No results to aggregate from', 'error'); return }
    const map = {}
    results.forEach(r => {
      (r.entries || []).forEach(e => {
        if (!e.driver) return
        if (!map[e.driver]) map[e.driver] = { driver: e.driver, nationality: '', flag: '', points: 0, wins: 0, podiums: 0, fastestLaps: 0 }
        map[e.driver].points += Number(e.points) || 0
        if (Number(e.pos) === 1) map[e.driver].wins += 1
        if (Number(e.pos) <= 3) map[e.driver].podiums += 1
        if (e.fastestLap) map[e.driver].fastestLaps += 1
      })
    })
    // Preserve existing nationality/flag if present
    const next = Object.values(map).map(entry => {
      const existing = standings.find(s => s.driver === entry.driver)
      return { id: existing?.id || Date.now() + Math.random(), ...entry, nationality: existing?.nationality || '', flag: existing?.flag || '' }
    })
    await updateDb({ standings: next })
    showToast('Standings recalculated from results')
  }

  const sorted = [...standings].sort((a, b) => Number(b.points) - Number(a.points))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={recalculate} style={{ background: 'transparent', border: '1px solid rgba(57,255,20,0.4)', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', padding: '8px 16px', cursor: 'pointer' }}>
          ⟳ RECALC FROM RESULTS
        </button>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Entry" />
      </div>

      <AnimatePresence>
        {adding && (
          <EditBox key="add-standing">
            <StandingForm data={newItem} setData={setNewItem} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SaveBtn onClick={addItem} label="Add Entry" />
              <CancelBtn onClick={() => setAdding(false)} />
            </div>
          </EditBox>
        )}
      </AnimatePresence>

      {sorted.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>NO STANDINGS YET</div>
      ) : (
        sorted.map((s, i) => (
          <AdminCard key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 900, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--muted)', minWidth: '32px' }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{s.flag} {s.driver}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>{s.nationality}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>{s.points} pts</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>W:{s.wins || 0} P:{s.podiums || 0} FL:{s.fastestLaps || 0}</span>
              </div>
              <RowBtns onEdit={() => startEdit(s)} onDelete={() => deleteItem(s.id)} />
            </div>
            <AnimatePresence>
              {editing === s.id && (
                <EditBox>
                  <StandingForm data={editData} setData={setEditData} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <SaveBtn onClick={saveEdit} />
                    <CancelBtn onClick={() => setEditing(null)} />
                  </div>
                </EditBox>
              )}
            </AnimatePresence>
          </AdminCard>
        ))
      )}
    </div>
  )
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────

function GalleryTab({ dbData, updateDb }) {
  const gallery = dbData.gallery || []
  const { showToast } = useToast()
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const src = await compressImage(file, 1200, 0.82)
      const item = { id: Date.now(), src, caption, date: new Date().toISOString().slice(0, 10) }
      await updateDb({ gallery: [...gallery, item] })
      setCaption('')
      showToast('Image uploaded')
    } catch {
      showToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this image?')) return
    await updateDb({ gallery: gallery.filter(g => g.id !== id) })
    showToast('Image deleted', 'error')
  }

  return (
    <div>
      <AdminCard label="Upload Image">
        <div style={{ display: 'grid', gap: '12px' }}>
          <FieldInput label="Caption (optional)" value={caption} onChange={setCaption} placeholder="Race day at Monza..." />
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
              Image (max 1200px, JPEG 0.82q)
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={e => e.target.files[0] && handleUpload(e.target.files[0])}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }}
            />
          </div>
          {uploading && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)', letterSpacing: '2px' }}>Uploading...</span>}
        </div>
      </AdminCard>

      {gallery.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '12px', letterSpacing: '2px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border)' }}>NO IMAGES YET</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {gallery.map(item => (
            <div key={item.id} style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <img src={item.src} alt={item.caption || ''} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '8px 10px', background: 'var(--card)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.caption || '—'}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.4)', color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', padding: '3px 10px', cursor: 'pointer', width: '100%' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, passHash }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  async function attempt() {
    const hash = await sha256(pw)
    if (!passHash || hash === passHash) {
      onLogin(hash, !passHash)
    } else {
      setError(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <motion.div
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--primary)',
          padding: '48px 40px',
          width: '100%', maxWidth: '400px',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '8px' }}>
          // ADMIN ACCESS
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '32px' }}>
          Sign In
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {!passHash ? 'Set Admin Password' : 'Password'}
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="••••••••"
            autoFocus
            style={{
              background: 'var(--bg)',
              border: `1px solid ${error ? '#ff5555' : 'var(--border)'}`,
              color: 'var(--text)', fontFamily: 'var(--font-body)',
              fontSize: '16px', padding: '12px 16px', outline: 'none',
              width: '100%', transition: 'border-color 0.2s',
            }}
          />
          {error && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ff5555', letterSpacing: '1px' }}>
              ✗ Incorrect password
            </span>
          )}
          {!passHash && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
              First time: enter any password to set it
            </span>
          )}
        </div>

        <button
          onClick={attempt}
          style={{
            width: '100%', background: 'var(--primary)', color: '#fff',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px',
            letterSpacing: '2px', textTransform: 'uppercase',
            padding: '14px', border: 'none', cursor: 'pointer',
          }}
        >
          Authenticate
        </button>
      </motion.div>
    </div>
  )
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin() {
  const { dbData, updateDb, drivers, saveDriver, deleteDriver } = useDatabase()
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  async function handleLogin(hash, isFirst) {
    if (isFirst) await updateDb({ passHash: hash })
    setLoggedIn(true)
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} passHash={dbData.passHash} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex' }} className="admin-layout">
        {/* Desktop sidebar */}
        <aside className="admin-sidebar" style={{
          width: '220px', flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '32px 0',
          position: 'sticky', top: '100px', height: 'calc(100vh - 100px)',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0 20px 24px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', color: 'var(--primary)' }}>
            ADMIN PANEL
          </div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 20px', background: activeTab === tab.id ? 'rgba(255,0,0,0.1)' : 'transparent',
                borderLeft: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '24px 20px 0' }}>
            <button
              onClick={() => setLoggedIn(false)}
              style={{
                width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11px',
                letterSpacing: '2px', padding: '8px 12px',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', cursor: 'pointer',
              }}
            >
              LOG OUT
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '32px' }}>
            {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
          </div>

          {activeTab === 'dashboard' && <DashboardTab dbData={dbData} drivers={drivers} updateDb={updateDb} />}
          {activeTab === 'news' && <NewsTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'calendar' && <CalendarTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'drivers' && <DriversTab drivers={drivers} saveDriver={saveDriver} deleteDriver={deleteDriver} />}
          {activeTab === 'staff' && <StaffTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'sponsors' && <SponsorsTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'enquiries' && <EnquiriesTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'results' && <ResultsTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'standings' && <StandingsTab dbData={dbData} updateDb={updateDb} />}
          {activeTab === 'gallery' && <GalleryTab dbData={dbData} updateDb={updateDb} />}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="admin-bottom-bar" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 800,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '8px 4px',
              background: activeTab === tab.id ? 'rgba(255,0,0,0.1)' : 'transparent',
              border: 'none', borderTop: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span className="tab-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      <style>{`
        @media (max-width: 1024px) {
          .admin-sidebar { display: none !important; }
          .admin-bottom-bar { display: flex !important; }
          .admin-layout main { padding: 24px 16px 80px !important; }
        }
        @media (max-width: 480px) {
          .tab-label { display: none !important; }
        }
      `}</style>
    </div>
  )
}

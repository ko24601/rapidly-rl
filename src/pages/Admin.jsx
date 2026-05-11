import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'

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
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category: NEWS_CATEGORIES[0], body: '', author: '' })

  function startEdit(item) { setEditing(item.id); setEditData({ ...item }); setAdding(false) }
  function cancelEdit() { setEditing(null) }

  async function saveEdit() {
    await updateDb({ news: news.map(n => n.id === editing ? editData : n) })
    setEditing(null)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this news post?')) return
    await updateDb({ news: news.filter(n => n.id !== id) })
  }

  async function addItem() {
    if (!newItem.title || !newItem.body) return
    const item = { ...newItem, id: Date.now(), date: new Date().toISOString().slice(0, 10) }
    await updateDb({ news: [item, ...news] })
    setNewItem({ title: '', category: NEWS_CATEGORIES[0], body: '', author: '' })
    setAdding(false)
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

function CalendarTab({ dbData, updateDb }) {
  const rounds = dbData.calendar || []
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [adding, setAdding] = useState(false)
  const blank = { round: '', circuit: '', country: '', category: '', date: '', status: 'TBD' }
  const [newItem, setNewItem] = useState(blank)

  function startEdit(r) { setEditing(r.id); setEditData({ ...r }); setAdding(false) }

  async function saveEdit() {
    await updateDb({ calendar: rounds.map(r => r.id === editing ? editData : r) })
    setEditing(null)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this round?')) return
    await updateDb({ calendar: rounds.filter(r => r.id !== id) })
  }

  async function addItem() {
    if (!newItem.circuit) return
    const item = { ...newItem, id: Date.now() }
    await updateDb({ calendar: [...rounds, item] })
    setNewItem(blank)
    setAdding(false)
  }

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

function DriversTab({ drivers, saveDriver, deleteDriver }) {
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
  }

  async function addItem() {
    if (!newItem.name) return
    const id = `driver_${Date.now()}`
    await saveDriver(id, newItem)
    setNewItem(blank)
    setAdding(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver?')) return
    await deleteDriver(id)
  }

  function DriverForm({ data, setData }) {
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
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '5px' }}>
            Photo (will be compressed to 480px)
          </label>
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && handlePhoto(e.target.files[0], setData)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
          {data.photo && <img src={data.photo} style={{ width: '80px', height: '107px', objectFit: 'cover', marginTop: '8px', border: '1px solid var(--border)' }} />}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Driver" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <DriverForm data={newItem} setData={setNewItem} />
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
                  <DriverForm data={editData} setData={setEditData} />
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

  function StaffForm({ data, setData }) {
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
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && handlePhoto(e.target.files[0], setData)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
          {data.photo && <img src={data.photo} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginTop: '8px', border: '2px solid var(--primary)' }} />}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Staff" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <StaffForm data={newItem} setData={setNewItem} />
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
                  <StaffForm data={editData} setData={setEditData} />
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

  function SponsorForm({ data, setData }) {
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
          <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleLogo(e.target.files[0], setData)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }} />
          {data.logo && <img src={data.logo} style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain', marginTop: '8px', border: '1px solid var(--border)' }} />}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <SaveBtn onClick={() => { setAdding(a => !a); setEditing(null) }} label="+ Add Sponsor" />
      </div>
      <AnimatePresence>
        {adding && (
          <EditBox>
            <SponsorForm data={newItem} setData={setNewItem} />
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
                  <SponsorForm data={editData} setData={setEditData} />
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

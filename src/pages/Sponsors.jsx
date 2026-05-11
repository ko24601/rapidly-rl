import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDatabase } from '../context/DatabaseContext.jsx'
import { SITE } from '../config.js'

const TIER_COLORS = {
  Primary: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.5)', color: '#FFD700', glow: 'rgba(255,215,0,0.2)' },
  Gold: { bg: 'rgba(255,165,0,0.08)', border: 'rgba(255,165,0,0.4)', color: '#FFA500', glow: 'rgba(255,165,0,0.15)' },
  Silver: { bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.3)', color: '#C0C0C0', glow: 'rgba(192,192,192,0.1)' },
  Community: { bg: 'rgba(100,200,255,0.05)', border: 'rgba(100,200,255,0.2)', color: '#64C8FF', glow: 'transparent' },
}

const TIER_SIZE = {
  Primary: { minWidth: '340px', padding: '32px' },
  Gold: { minWidth: '280px', padding: '28px' },
  Silver: { minWidth: '240px', padding: '24px' },
  Community: { minWidth: '200px', padding: '20px' },
}

const PARTNERSHIP_TYPES = ['Title Sponsor', 'Co-Sponsor', 'Technical Partner', 'Media Partner', 'Community Partner', 'Other']
const BUDGETS = ['Under $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000 – $10,000', '$10,000+', 'Let\'s Talk']

function inputStyle(focused) {
  return {
    background: 'var(--surface)',
    border: `1px solid ${focused ? '#39FF14' : 'var(--border)'}`,
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    padding: '12px 16px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    borderRadius: '2px',
    boxShadow: focused ? '0 0 0 2px rgba(57,255,20,0.12)' : 'none',
  }
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function Sponsors() {
  const { dbData, updateDb } = useDatabase()
  const sponsors = dbData.sponsors || []

  const [form, setForm] = useState({ name: '', contact: '', type: PARTNERSHIP_TYPES[0], budget: BUDGETS[0], message: '' })
  const [focused, setFocused] = useState('')
  const [status, setStatus] = useState('')

  function handleChange(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const enquiry = { ...form, date: new Date().toISOString().slice(0, 10), id: Date.now() }
    try {
      await updateDb({ enquiries: [...(dbData.enquiries || []), enquiry] })
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'YOUR_WEB3FORMS_ACCESS_KEY',
          subject: `New Sponsorship Enquiry from ${form.name}`,
          from_name: form.name,
          ...form,
        }),
      })
      setStatus('success')
      setForm({ name: '', contact: '', type: PARTNERSHIP_TYPES[0], budget: BUDGETS[0], message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(57,255,20,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 40px 60px',
        textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '16px' }}>
            // PARTNERSHIPS & SPONSORS
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 900,
            letterSpacing: '-1px', textTransform: 'uppercase', color: 'var(--text)',
          }}>
            Partner With Us
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--muted)', maxWidth: '560px', margin: '16px auto 0', lineHeight: 1.6 }}>
            Join {SITE.name} and get your brand in front of a passionate motorsport audience. We offer competitive, flexible partnership tiers.
          </p>
        </motion.div>
      </div>

      {/* Why Sponsor pitch section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(57,255,20,0.07) 0%, rgba(57,255,20,0.02) 50%, transparent 100%)',
        borderBottom: '1px solid rgba(57,255,20,0.15)',
        padding: '64px 40px',
      }}>
        {/* Diagonal accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'repeating-linear-gradient(135deg, transparent, transparent 60px, rgba(57,255,20,0.015) 60px, rgba(57,255,20,0.015) 61px)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px' }}>
              // WHY PARTNER WITH US
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', marginBottom: '16px' }}>
              Why Sponsor RAPIDLY RL?
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
              We are one of the fastest-growing sim racing leagues. Your brand gets exposure to a dedicated, engaged motorsport community across every race weekend.
            </p>
          </motion.div>

          {/* Stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { stat: '500+', label: 'Community Members', icon: '👥' },
              { stat: '20+', label: 'Active Racers', icon: '🏎' },
              { stat: '2026', label: 'Season', icon: '🏆' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: 'rgba(10,10,10,0.8)',
                  border: '1px solid rgba(57,255,20,0.2)',
                  borderTop: '3px solid var(--primary)',
                  borderRadius: '2px',
                  padding: '28px 24px',
                  textAlign: 'center',
                  boxShadow: '0 0 30px rgba(57,255,20,0.05)',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '48px',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  lineHeight: 1,
                  textShadow: '0 0 20px rgba(57,255,20,0.4)',
                  marginBottom: '8px',
                }}>
                  {item.stat}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px 0' }}>

        {/* Tier system visual */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px' }}>
            // PARTNERSHIP TIERS
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px' }}>
            Choose Your Tier
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.entries(TIER_COLORS).map(([tier, styles], i) => (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: styles.bg,
                  border: `1px solid ${styles.border}`,
                  borderTop: `3px solid ${styles.color}`,
                  borderRadius: '2px',
                  padding: TIER_SIZE[tier]?.padding || '24px',
                  boxShadow: `0 0 30px ${styles.glow}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: styles.color,
                  padding: '3px 8px',
                  border: `1px solid ${styles.border}`,
                  alignSelf: 'flex-start',
                }}>
                  {tier}
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: styles.color }}>
                  {tier === 'Primary' && 'Title Partner'}
                  {tier === 'Gold' && 'Gold Sponsor'}
                  {tier === 'Silver' && 'Silver Sponsor'}
                  {tier === 'Community' && 'Community Friend'}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                  {tier === 'Primary' && 'Logo on livery, full branding across all channels, race-day shoutouts.'}
                  {tier === 'Gold' && 'Featured sponsor, social media promotion, event mentions.'}
                  {tier === 'Silver' && 'Website listing, newsletter feature, community shoutouts.'}
                  {tier === 'Community' && 'Discord recognition, newsletter mention, supporter badge.'}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sponsors Grid */}
        {sponsors.length > 0 && (
          <section style={{ marginBottom: '80px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px' }}>
              // CURRENT PARTNERS
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px' }}>
              Our Partners
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}>
              {sponsors.map((s, i) => {
                const tier = TIER_COLORS[s.tier] || TIER_COLORS.Community
                return (
                  <motion.div
                    key={s.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: 'var(--card)',
                      border: `1px solid ${tier.border}`,
                      borderTop: `3px solid ${tier.color}`,
                      borderRadius: '2px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: `0 0 20px ${tier.glow}`,
                    }}
                  >
                    {s.logo && (
                      <div style={{ height: '60px', display: 'flex', alignItems: 'center' }}>
                        <img src={s.logo} alt={s.name} style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, letterSpacing: '1px' }}>
                        {s.name}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px',
                        padding: '3px 8px', background: tier.bg, border: `1px solid ${tier.border}`,
                        color: tier.color, whiteSpace: 'nowrap',
                      }}>
                        {s.tier || 'Community'}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{s.description}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* Enquiry Form */}
        <section>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '12px' }}>
            // GET IN TOUCH
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px' }}>
            Get In Touch
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'start',
          }}>
            {/* Info panel */}
            <div>
              <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '32px' }}>
                We believe in partnerships built on mutual value. Whether you're a startup or an established brand,
                there's a tier for you. Fill out the form and we'll respond within 48 hours.
              </p>
              {Object.entries(TIER_COLORS).map(([tier, styles]) => (
                <div key={tier} style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ width: '4px', height: '36px', background: styles.color, flexShrink: 0, boxShadow: `0 0 8px ${styles.glow}` }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, letterSpacing: '1px', color: styles.color }}>
                      {tier}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {tier === 'Primary' && 'Logo on livery, full branding across all channels'}
                      {tier === 'Gold' && 'Featured sponsor, social media promotion'}
                      {tier === 'Silver' && 'Website listing, event mentions'}
                      {tier === 'Community' && 'Discord recognition, newsletter feature'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-two-col">
                  <Field label="Your Name">
                    <input
                      required value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                      placeholder="John Smith"
                      style={inputStyle(focused === 'name')}
                    />
                  </Field>
                  <Field label="Contact (Email / Discord)">
                    <input
                      required value={form.contact}
                      onChange={e => handleChange('contact', e.target.value)}
                      onFocus={() => setFocused('contact')} onBlur={() => setFocused('')}
                      placeholder="john@brand.com"
                      style={inputStyle(focused === 'contact')}
                    />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-two-col">
                  <Field label="Partnership Type">
                    <select
                      value={form.type} onChange={e => handleChange('type', e.target.value)}
                      onFocus={() => setFocused('type')} onBlur={() => setFocused('')}
                      style={{ ...inputStyle(focused === 'type'), appearance: 'none' }}
                    >
                      {PARTNERSHIP_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Budget Range">
                    <select
                      value={form.budget} onChange={e => handleChange('budget', e.target.value)}
                      onFocus={() => setFocused('budget')} onBlur={() => setFocused('')}
                      style={{ ...inputStyle(focused === 'budget'), appearance: 'none' }}
                    >
                      {BUDGETS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Message">
                  <textarea
                    required value={form.message}
                    onChange={e => handleChange('message', e.target.value)}
                    onFocus={() => setFocused('message')} onBlur={() => setFocused('')}
                    placeholder="Tell us about your brand and goals..."
                    rows={5}
                    style={{ ...inputStyle(focused === 'message'), resize: 'vertical' }}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    background: status === 'success' ? '#1a7a1a' : 'var(--primary)',
                    color: '#fff',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700, fontSize: '18px',
                    letterSpacing: '2px', textTransform: 'uppercase',
                    padding: '16px 32px',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.2s',
                    opacity: status === 'sending' ? 0.7 : 1,
                  }}
                >
                  {status === 'sending' ? 'Sending...' : status === 'success' ? '✓ Sent!' : 'Send Enquiry'}
                </button>

                {status === 'success' && (
                  <p style={{ color: '#4caf50', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px' }}>
                    ✓ Your enquiry has been received. We'll be in touch within 48 hours.
                  </p>
                )}
                {status === 'error' && (
                  <p style={{ color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px' }}>
                    ✗ Something went wrong. Please try again or reach out via Discord.
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .form-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState } from 'react'

const EXAMPLE_THREAD = `From: Sarah Chen <sarah@acmecorp.com>
To: recruiting@talentbridge.com
Subject: Re: Re: Re: Interview scheduling - Marcus Webb

Hi Jessica,

Sorry for the delay. Marcus is available Tuesday or Wednesday next week. He's in London (GMT+1) and strongly prefers morning slots, so ideally before 11am his time. He has a hard stop at 10am EST on Tuesday for a board call.

The panel is: myself (EST), David Kim our CTO (PST), and Priya Mehta from the London office (GMT+1). We need 90 minutes total, 30 min each.

Can we also make sure this is on Zoom, not Google Meet? Our enterprise firewall blocks Meet.

Thanks,
Sarah

---
From: Jessica Park <jessica@talentbridge.com>
To: sarah@acmecorp.com
Subject: Re: Re: Interview scheduling - Marcus Webb

Sarah,

David is out Monday and has back-to-back on Wednesday afternoon PST. He mentioned he could do Wednesday morning but needs to leave by noon PST for a flight.

Priya just flagged she has a team standup Wednesday 9-9:30am GMT+1 and is on leave Thursday.

Would Tuesday 3pm EST work? That would be 8pm for Priya and 8am PST for David.

Jessica`

type ParsedData = {
  attendees: { name: string; email: string | null; timezone: string | null; role: string | null }[]
  availableWindows: { person: string; windows: string[]; constraints: string[] }[]
  meetingRequirements: { duration: string | null; type: string | null; platform: string | null; notes: string[] }
  blockers: string[]
  urgency: string
  summary: string
}

type ResolvedData = {
  recommendedSlots: { rank: number; datetime: string; duration: string; confidence: string; reasoning: string; conflicts: string[] }[]
  conflicts: { description: string; affectedParties: string[]; resolution: string }[]
  timezoneMap: { person: string; timezone: string; localTime: string }[]
  recommendation: string
}

type DraftData = {
  subject: string
  body: string
  calendarInviteDetails: { title: string; datetime: string; duration: string; attendees: string[]; platform: string | null; agenda: string[] }
  followUpActions: string[]
}

type Step = 'input' | 'parsing' | 'parsed' | 'resolving' | 'resolved' | 'drafting' | 'done'

export default function Home() {
  const [thread, setThread] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [resolved, setResolved] = useState<ResolvedData | null>(null)
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function runParse() {
    if (!thread.trim()) return
    setStep('parsing')
    setError(null)
    try {
      const res = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ thread }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setParsed(data)
      setStep('parsed')
    } catch (e) {
      setError(String(e))
      setStep('input')
    }
  }

  async function runResolve() {
    if (!parsed) return
    setStep('resolving')
    setError(null)
    try {
      const res = await fetch('/api/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parsed }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResolved(data)
      setStep('resolved')
    } catch (e) {
      setError(String(e))
      setStep('parsed')
    }
  }

  async function runDraft() {
    if (!parsed || !resolved) return
    setStep('drafting')
    setError(null)
    try {
      const res = await fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parsed, resolved }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDraft(data)
      setStep('done')
    } catch (e) {
      setError(String(e))
      setStep('resolved')
    }
  }

  function reset() {
    setThread('')
    setStep('input')
    setParsed(null)
    setResolved(null)
    setDraft(null)
    setError(null)
  }

  function copyEmail() {
    if (!draft) return
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLoading = step === 'parsing' || step === 'resolving' || step === 'drafting'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#000', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-sans)' }}>V</span>
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text)' }}>Vela</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SCHEDULING INTELLIGENCE</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(['input', 'parsed', 'resolved', 'done'] as const).map((s, i) => {
            const labels = ['01 PARSE', '02 RESOLVE', '03 DRAFT', '04 DONE']
            const stepOrder = ['input', 'parsed', 'resolved', 'done']
            const currentIdx = stepOrder.indexOf(step === 'parsing' ? 'input' : step === 'resolving' ? 'parsed' : step === 'drafting' ? 'resolved' : step)
            const isActive = i === currentIdx
            const isDone = i < currentIdx
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i > 0 && <div style={{ width: 20, height: 1, background: isDone ? 'var(--accent-dim)' : 'var(--border)' }} />}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                  color: isActive ? 'var(--accent)' : isDone ? 'var(--accent-dim)' : 'var(--text-muted)',
                  fontWeight: isActive ? 500 : 400
                }}>
                  {labels[i]}
                </span>
              </div>
            )
          })}
        </div>
        {step !== 'input' && (
          <button onClick={reset} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.1em' }}>
            RESET
          </button>
        )}
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px' }}>

        {/* Step 1: Input */}
        {(step === 'input' || step === 'parsing') && (
          <div className="slide-up">
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8 }}>
                Paste a scheduling<br />
                <span style={{ color: 'var(--accent)' }}>email thread.</span>
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Multi-party, multi-timezone, messy. Vela handles it.
              </p>
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <textarea
                value={thread}
                onChange={e => setThread(e.target.value)}
                placeholder="Paste email thread here..."
                disabled={isLoading}
                style={{
                  width: '100%', height: 280, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 4, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12,
                  padding: '16px', resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={runParse}
                disabled={isLoading || !thread.trim()}
                style={{
                  background: thread.trim() ? 'var(--accent)' : 'var(--border)',
                  color: thread.trim() ? '#000' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
                  padding: '12px 28px', border: 'none', borderRadius: 3, cursor: thread.trim() ? 'pointer' : 'not-allowed',
                  letterSpacing: '-0.01em', transition: 'all 0.15s'
                }}
              >
                {step === 'parsing' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#000', animation: 'pulse-dot 1s infinite' }} />
                    Parsing thread...
                  </span>
                ) : 'Parse Thread →'}
              </button>
              <button
                onClick={() => setThread(EXAMPLE_THREAD)}
                disabled={isLoading}
                style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '12px 16px', borderRadius: 3, cursor: 'pointer', letterSpacing: '0.08em' }}
              >
                LOAD EXAMPLE
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b6b' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Parsed */}
        {(step === 'parsed' || step === 'resolving') && parsed && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Thread parsed</h2>
              <span className="tag" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--accent)', border: '1px solid rgba(200,255,0,0.2)' }}>
                {parsed.urgency} urgency
              </span>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>SUMMARY</p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>{parsed.summary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>ATTENDEES ({parsed.attendees.length})</p>
                {parsed.attendees.map((a, i) => (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < parsed.attendees.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{a.timezone || 'tz unknown'} {a.role ? `· ${a.role}` : ''}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>MEETING REQUIREMENTS</p>
                {parsed.meetingRequirements.duration && <div style={{ marginBottom: 6 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>DURATION </span><span style={{ fontSize: 13 }}>{parsed.meetingRequirements.duration}</span></div>}
                {parsed.meetingRequirements.platform && <div style={{ marginBottom: 6 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>PLATFORM </span><span style={{ fontSize: 13 }}>{parsed.meetingRequirements.platform}</span></div>}
                {parsed.meetingRequirements.type && <div style={{ marginBottom: 6 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>TYPE </span><span style={{ fontSize: 13 }}>{parsed.meetingRequirements.type}</span></div>}
                {parsed.blockers.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>BLOCKERS</p>
                    {parsed.blockers.map((b, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#ff9f43', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #ff9f43' }}>{b}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>AVAILABILITY WINDOWS</p>
              {parsed.availableWindows.map((w, i) => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < parsed.availableWindows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{w.person}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {w.windows.map((win, j) => (
                      <span key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(200,255,0,0.08)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 2, border: '1px solid rgba(200,255,0,0.15)' }}>{win}</span>
                    ))}
                    {w.constraints.map((c, j) => (
                      <span key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(255,159,67,0.08)', color: '#ff9f43', padding: '2px 8px', borderRadius: 2, border: '1px solid rgba(255,159,67,0.2)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={runResolve}
              disabled={step === 'resolving'}
              style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '12px 28px', border: 'none', borderRadius: 3, cursor: 'pointer', letterSpacing: '-0.01em' }}
            >
              {step === 'resolving' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#000', animation: 'pulse-dot 1s infinite' }} />
                  Resolving conflicts...
                </span>
              ) : 'Resolve Conflicts →'}
            </button>
          </div>
        )}

        {/* Step 3: Resolved */}
        {(step === 'resolved' || step === 'drafting') && resolved && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Conflicts resolved</h2>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>RECOMMENDATION</p>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{resolved.recommendation}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>RECOMMENDED SLOTS</p>
              {resolved.recommendedSlots?.slice(0, 3).map((slot, i) => (
                <div key={i} style={{ background: i === 0 ? 'rgba(200,255,0,0.05)' : 'var(--surface)', border: `1px solid ${i === 0 ? 'rgba(200,255,0,0.25)' : 'var(--border)'}`, borderRadius: 4, padding: '14px 18px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>#{slot.rank}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{slot.datetime}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{slot.duration}</span>
                    </div>
                    <span className="tag" style={{
                      background: slot.confidence === 'high' ? 'rgba(200,255,0,0.1)' : slot.confidence === 'medium' ? 'rgba(255,159,67,0.1)' : 'rgba(255,80,80,0.1)',
                      color: slot.confidence === 'high' ? 'var(--accent)' : slot.confidence === 'medium' ? '#ff9f43' : '#ff6b6b',
                      border: `1px solid ${slot.confidence === 'high' ? 'rgba(200,255,0,0.2)' : slot.confidence === 'medium' ? 'rgba(255,159,67,0.2)' : 'rgba(255,80,80,0.2)'}`
                    }}>
                      {slot.confidence}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{slot.reasoning}</p>
                </div>
              ))}
            </div>

            {resolved.timezoneMap?.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em' }}>TIMEZONE MAP</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {resolved.timezoneMap.map((t, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{t.person}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.localTime}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{t.timezone}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={runDraft}
              disabled={step === 'drafting'}
              style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, padding: '12px 28px', border: 'none', borderRadius: 3, cursor: 'pointer', letterSpacing: '-0.01em' }}
            >
              {step === 'drafting' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#000', animation: 'pulse-dot 1s infinite' }} />
                  Drafting email...
                </span>
              ) : 'Draft Confirmation Email →'}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && draft && (
          <div className="slide-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Ready to send</h2>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginRight: 8, letterSpacing: '0.08em' }}>SUBJECT</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{draft.subject}</span>
                </div>
                <button
                  onClick={copyEmail}
                  style={{ background: copied ? 'rgba(200,255,0,0.1)' : 'none', border: `1px solid ${copied ? 'rgba(200,255,0,0.3)' : 'var(--border)'}`, color: copied ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.2s' }}
                >
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <div style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                {draft.body}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em' }}>CALENDAR INVITE</p>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{draft.calendarInviteDetails.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{draft.calendarInviteDetails.datetime}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{draft.calendarInviteDetails.duration} {draft.calendarInviteDetails.platform ? `· ${draft.calendarInviteDetails.platform}` : ''}</div>
                {draft.calendarInviteDetails.agenda.length > 0 && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>AGENDA</p>
                    {draft.calendarInviteDetails.agenda.map((a, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid var(--border-bright)' }}>{a}</div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em' }}>FOLLOW-UP ACTIONS</p>
                {draft.followUpActions.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid var(--accent-dim)', color: 'var(--text)', lineHeight: 1.5 }}>{a}</div>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                3 agents · parse → resolve → draft · powered by Claude
              </span>
              <button onClick={reset} style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12, padding: '8px 18px', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                New Thread
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

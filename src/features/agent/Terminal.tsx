import { useQuery } from '@tanstack/react-query'
import { Fragment, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { TOOL_LABEL, agentStatus, streamChat, type ChartSpec, type ChatMessage } from './api'

// The chart library is only downloaded once a reply actually has a chart.
const PriceChart = lazy(() => import('./PriceChart').then((m) => ({ default: m.PriceChart })))
import { useTerminalHistory } from './store'

/** Recent messages sent as context; matches the server's limit and keeps requests small. */
const CONTEXT_MESSAGES = 12

const EXAMPLES = [
  'How is the crypto market right now?',
  'Full technical analysis of BTC',
  'Which altcoins are oversold on the daily?',
  'Screen the top 10 pump.fun tokens right now',
  'How much SOL do I get for 1 ETH?',
]

const HELP = `Ask in plain words about the lab, its research, BTC and altcoin analysis, live swap rates, a swap's status, or a pump.fun token screen.
Commands:
  /help   show this help
  /clear  clear the conversation (stored only in this browser)`

const INTERNAL_PATHS = 'swap|research|technology|vision|roadmap|ecosystem|assistant|tools|web3|pqc'

/** Turns URLs and our own paths (/swap?…, /research/…) into links; everything else stays text. */
function linkify(text: string): ReactNode[] {
  const pattern = new RegExp(`(https?://[^\\s)]+|/(?:${INTERNAL_PATHS})(?:[/?#][^\\s)]*)?)`, 'g')
  const parts = text.split(pattern)
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
    const clean = part.replace(/[.,;:!?]+$/, '')
    const rest = part.slice(clean.length)
    const cls = 'text-lab-cyan underline decoration-lab-cyan/40 underline-offset-2 hover:text-white'
    const link = clean.startsWith('/') ? (
      <Link to={clean} className={cls}>
        {clean.startsWith('/swap?') ? 'Open in swap ↗' : clean}
      </Link>
    ) : (
      <a href={clean} target="_blank" rel="noopener noreferrer" className={cls}>
        {clean}
      </a>
    )
    return (
      <Fragment key={i}>
        {link}
        {rest}
      </Fragment>
    )
  })
}

const Caret = () => <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[2px] animate-pulse bg-lab-cyan" aria-hidden="true" />

function Line({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="agent-msg-user">
        <span className="whitespace-pre-wrap break-words">{message.content}</span>
      </div>
    )
  }
  return (
    <>
      <div className="agent-msg-ai whitespace-pre-wrap break-words text-white/80">{linkify(message.content)}</div>
      <Charts charts={message.charts} />
    </>
  )
}

function Charts({ charts }: { charts?: ChartSpec[] }) {
  if (!charts?.length) return null
  return (
    <div className="space-y-3">
      <Suspense fallback={<p className="text-xs text-white/55">Loading chart…</p>}>
        {charts.map((chart, i) => (
          <PriceChart key={`${chart.pair}:${chart.timeframe}:${i}`} spec={chart} />
        ))}
      </Suspense>
    </div>
  )
}

/** Chat with the read-only Quantum Agent, styled as a terminal. */
export function Terminal() {
  const messages = useTerminalHistory((s) => s.messages)
  const add = useTerminalHistory((s) => s.add)
  const pop = useTerminalHistory((s) => s.pop)
  const clear = useTerminalHistory((s) => s.clear)
  const status = useQuery({ queryKey: ['agent', 'status'], queryFn: agentStatus, staleTime: 5 * 60_000 })
  const available = status.data?.available ?? false

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [reply, setReply] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [charts, setCharts] = useState<ChartSpec[]>([])
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Keep the newest output in view as it streams in.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, reply, tools, charts, notice])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(text: string) {
    const question = text.trim()
    if (!question || busy) return
    setInput('')
    setNotice(null)

    if (question === '/clear') return clear()
    if (question === '/help') return setNotice({ text: HELP })
    if (question.startsWith('/')) return setNotice({ text: `Unknown command ${question}. Type /help.`, error: true })

    const history = [...messages, { role: 'user' as const, content: question }].slice(-CONTEXT_MESSAGES)
    add({ role: 'user', content: question })
    setBusy(true)
    setReply('')
    setTools([])
    setCharts([])
    let answer = ''
    const gotCharts: ChartSpec[] = []
    let failed: string | null = null
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamChat(
        history,
        (event) => {
          if (event.type === 'text') {
            answer += event.text
            setReply(answer)
          } else if (event.type === 'tool') {
            setTools((t) => [...t, TOOL_LABEL[event.name] ?? event.name])
          } else if (event.type === 'chart') {
            gotCharts.push(event.chart)
            setCharts([...gotCharts])
          } else if (event.type === 'error') {
            failed = event.message
          }
        },
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) return
      failed = error instanceof Error ? error.message : 'Something went wrong.'
    } finally {
      setBusy(false)
      setReply('')
      setTools([])
      setCharts([])
      abortRef.current = null
    }

    if (answer.trim()) add({ role: 'assistant', content: answer.trim(), ...(gotCharts.length ? { charts: gotCharts } : {}) })
    else {
      // No reply: forget the question so the conversation still alternates, and let the user retry.
      pop()
      setInput(question)
    }
    if (failed) setNotice({ text: failed, error: true })
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div
      className="agent-terminal panel overflow-hidden font-mono text-[13px] leading-relaxed"
      onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="agent-head">
        <span className={`agent-orb ${busy ? 'is-busy' : ''}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] font-light tracking-tight text-white">Quantum Agent</span>
          <span className="block truncate text-[10.5px] uppercase tracking-[0.16em] text-white/50">Read-only research console</span>
        </span>
        <span className={`agent-signal ${busy ? 'is-busy' : ''}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className={`agent-state ${available ? '' : 'is-off'}`}>{status.isPending ? 'Connecting' : available ? 'Online' : 'Offline'}</span>
        {messages.length > 0 && (
          <button
            type="button"
            className="agent-clear"
            onClick={() => clear()}
            disabled={busy}
          >
            Clear
          </button>
        )}
      </div>

      <div className="agent-log scrollbar-thin h-[56vh] min-h-[360px] space-y-4 overflow-y-auto px-5 py-5" ref={logRef} aria-live="polite">
        <div className="agent-intro">
          <span className="text-lab-cyan">Quantum Agent</span> · the lab, market analysis, swap rates and status, and pump.fun
          screens. Type /help.
        </div>
        {!status.isPending && !available && (
          <div className="text-red-300">Quantum Agent isn’t available right now. Please check back soon.</div>
        )}

        {messages.length === 0 && available && (
          <div>
            <span className="text-[10.5px] uppercase tracking-[0.16em] text-white/45">Try:</span>
            <ul className="agent-examples">
              {EXAMPLES.map((example, i) => (
                <li key={example}>
                  <button type="button" className="agent-example" onClick={() => void send(example)}>
                    <span className="agent-example-n">0{i + 1}</span>
                    <span className="flex-1">{example}</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message, i) => (
          <Line key={i} message={message} />
        ))}

        {busy && (
          <>
            {tools.map((tool, i) => (
              <div key={i} className="text-white/55">
                · {tool}…
              </div>
            ))}
            {reply ? (
              <div className="whitespace-pre-wrap break-words text-white/75">
                {linkify(reply)}
                <Caret />
              </div>
            ) : (
              <div className="text-white/55">
                <Caret /> thinking
              </div>
            )}
            <Charts charts={charts} />
          </>
        )}

        {notice && (
          <div className={'whitespace-pre-wrap ' + (notice.error ? 'text-red-300' : 'text-white/60')}>{notice.text}</div>
        )}
      </div>

      <form
        className="agent-input"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <span className="agent-prompt" aria-hidden="true">
          ›
        </span>
        <input
          ref={inputRef}
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/50 disabled:cursor-not-allowed"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? 'Working…' : available ? 'Ask a research question…' : 'Unavailable'}
          disabled={busy || !available}
          maxLength={1000}
          autoComplete="off"
          spellCheck={false}
          aria-label="Message Quantum Agent"
        />
        <button type="submit" className="agent-send" disabled={busy || !available || !input.trim()} aria-label="Send">
          Send <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  )
}

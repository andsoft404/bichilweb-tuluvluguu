import { useState, useRef, useCallback, useEffect } from 'react'
import data from './data.json'
import './App.css'

type TabKey = 'main' | 'marketing' | 'callCenter' | 'customerService' | 'design' | 'boost' | 'budget' | 'expenses'
type Role = 'super' | 'marketing' | 'callCenter' | 'customerService' | 'design'

const allTabs: { key: TabKey; label: string }[] = [
  { key: 'main', label: 'БХГ-2026 Нэгтгэл' },
  { key: 'marketing', label: 'Маркетинг' },
  { key: 'callCenter', label: 'Дуудлагын төв' },
  { key: 'customerService', label: 'Харилцагчийн үйлчилгээ' },
  { key: 'design', label: 'Дизайн' },
  { key: 'boost', label: 'Boost зардал' },
  { key: 'budget', label: 'Төсөв' },
  { key: 'expenses', label: 'Гарсан зардлууд' },
]

const roles: { key: Role; label: string }[] = [
  { key: 'super', label: 'Super (Бүгд)' },
  { key: 'marketing', label: 'Маркетинг' },
  { key: 'callCenter', label: 'Дуудлагын төв' },
  { key: 'customerService', label: 'Харилцагчийн үйлчилгээ' },
  { key: 'design', label: 'Дизайн' },
]

const roleTabs: Record<Role, TabKey[]> = {
  super: ['main', 'marketing', 'callCenter', 'customerService', 'design', 'boost', 'budget', 'expenses'],
  marketing: ['marketing', 'boost'],
  callCenter: ['callCenter'],
  customerService: ['customerService'],
  design: ['design'],
}

function formatNum(v: number | string): string {
  if (typeof v !== 'number' || v === 0) return ''
  return v.toLocaleString('mn-MN')
}

function completionColor(pct: number): string {
  if (pct >= 100) return '#10b981'
  if (pct >= 70) return '#3b82f6'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

function completionLabel(pct: number): string {
  if (pct >= 100) return 'Дууссан'
  if (pct >= 70) return 'Сайн'
  if (pct >= 40) return 'Дунд'
  if (pct > 0) return 'Бага'
  return 'Эхлээгүй'
}

function ProgressBar({ value }: { value: number }) {
  const color = completionColor(value)
  return (
    <div className="progress-bar" title={completionLabel(value)}>
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      <span className="progress-text" style={{ color: value > 55 ? '#fff' : '#374151' }}>{value}%</span>
    </div>
  )
}

function StatusDot({ value }: { value: number }) {
  return <span className="status-dot" style={{ background: completionColor(value) }} />
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
}

function StatCard({ label, value, sub, color = '#1e3a5f', icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-value" style={{ color }}>{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

function calcStats(tasks: { completion: number; isParent: boolean; overdueDays: number | string }[]) {
  const parents = tasks.filter(t => t.isParent)
  const children = tasks.filter(t => !t.isParent)
  const all = children.length > 0 ? children : parents
  const total = all.length
  const done = all.filter(t => t.completion >= 100).length
  const inProgress = all.filter(t => t.completion > 0 && t.completion < 100).length
  const notStarted = all.filter(t => t.completion === 0).length
  const overdue = all.filter(t => Number(t.overdueDays) > 0).length
  const avgCompletion = total > 0 ? Math.round(all.reduce((s, t) => s + t.completion, 0) / total) : 0
  return { total, done, inProgress, notStarted, overdue, avgCompletion }
}

interface DeptTask {
  num: number | string
  task: string
  subtask: string
  partner: string
  cost: string | number
  startDate: string
  endDate: string
  completion: number
  actualStart: string
  actualEnd: string
  overdueDays: number | string
  duration: number | string
  isParent: boolean
}

interface DeptData {
  title: string
  department: string
  responsible: string
  period: string
  tasks: DeptTask[]
}

function DeptSheet({ dept }: { dept: DeptData }) {
  const stats = calcStats(dept.tasks)
  const taskDates = dept.tasks.filter(t => t.startDate && t.endDate).flatMap(t => [t.startDate, t.endDate]).sort()
  const dateRange = taskDates.length > 0 ? `${taskDates[0]} ~ ${taskDates[taskDates.length - 1]}` : dept.period
  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h2>{dept.title}</h2>
        <div className="sheet-meta-table">
          <div className="meta-row">
            <span className="meta-label">Газар нэгж:</span>
            <span className="meta-value">{dept.department}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Хариуцагч</span>
            <span className="meta-value">{dept.responsible}</span>
            <span className="meta-label">Хийгдэх хугацаа</span>
            <span className="meta-value">{dateRange}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📊" label="Нийт ажил" value={stats.total} color="#1e3a5f" />
        <StatCard icon="✅" label="Дууссан" value={stats.done} sub={`${stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0}%`} color="#10b981" />
        <StatCard icon="🔄" label="Хийгдэж буй" value={stats.inProgress} color="#3b82f6" />
        <StatCard icon="⏳" label="Эхлээгүй" value={stats.notStarted} color="#6b7280" />
        <StatCard icon="⚠️" label="Хугацаа хэтэрсэн" value={stats.overdue} color="#ef4444" />
        <StatCard icon="📈" label="Дундаж гүйцэтгэл" value={`${stats.avgCompletion}%`} color={completionColor(stats.avgCompletion)} />
      </div>

      <div className="overall-progress">
        <div className="overall-label">Нийт гүйцэтгэл</div>
        <div className="overall-bar">
          <div className="overall-fill" style={{ width: `${stats.avgCompletion}%`, background: completionColor(stats.avgCompletion) }} />
        </div>
        <div className="overall-pct">{stats.avgCompletion}%</div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Хийгдэх ажил</th>
              <th>Хамтрах нэгж</th>
              <th>Гарах зардал</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th>Гүйцэтгэл</th>
              <th>Бодит эхэлсэн</th>
              <th>Бодит дууссан</th>
              <th>Хэтэрсэн өдөр</th>
              <th>Хугацаа</th>
            </tr>
          </thead>
          <tbody>
            {dept.tasks.map((t, i) => (
              <tr key={i} className={t.isParent ? 'parent-row' : 'child-row'}>
                <td className="num-cell">{t.num}</td>
                <td className={t.isParent ? 'task-parent' : 'task-child'}>
                  {t.isParent ? t.task : t.subtask || t.task}
                </td>
                <td>{t.partner}</td>
                <td className="num-cell">{formatNum(t.cost)}</td>
                <td className="date-cell">{t.startDate}</td>
                <td className="date-cell">{t.endDate}</td>
                <td className="progress-cell">
                  <StatusDot value={t.completion} />
                  <ProgressBar value={t.completion} />
                </td>
                <td className="date-cell">{t.actualStart}</td>
                <td className="date-cell">{t.actualEnd}</td>
                <td className={`num-cell ${Number(t.overdueDays) > 0 ? 'overdue' : Number(t.overdueDays) < 0 ? 'early' : ''}`}>
                  {Number(t.overdueDays) > 0 ? `+${t.overdueDays}` : t.overdueDays || ''}
                </td>
                <td className="num-cell">{t.duration ? `${t.duration} өдөр` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface MainTask {
  num: number | string
  priority: string
  topic: string
  subtask: string
  partner: string
  cost: string | number
  startDate: string
  endDate: string
  completion: number
  actualStart: string
  actualEnd: string
  quality: string
  overdueDays: number | string
  duration: number | string
  isParent: boolean
  gantt: number[]
}

interface Milestone {
  label: string
  sub: string
  startCol: number
  endCol: number
  lineCol: number
  color: string
}

const DATA_COL_COUNT = 12 // number of non-gantt columns (№ through Хугацаа)

function getMilestones(dayDates: string[]): Milestone[] {
  const dateIdx = (mmdd: string) => dayDates.findIndex(d => d.endsWith(mmdd))
  return [
    { label: 'ЗУРШИЛААС ХЭВШИЛ РҮҮ', sub: '', startCol: dateIdx('05-02'), endCol: dateIdx('05-10'), lineCol: dateIdx('05-12'), color: '#c0392b' },
    { label: 'КОМПАНИТ АЖИЛ', sub: '', startCol: dateIdx('05-10'), endCol: dateIdx('05-13'), lineCol: dateIdx('05-13'), color: '#5d6d7e' },
    { label: 'АРГА ХЭМЖЭЭ', sub: '', startCol: dateIdx('05-14'), endCol: dateIdx('05-18'), lineCol: dateIdx('05-15'), color: '#e67e22' },
    { label: 'ИДЭВХЖҮҮЛЭЛТ', sub: '', startCol: dateIdx('05-19'), endCol: dateIdx('05-23'), lineCol: dateIdx('05-20'), color: '#2980b9' },
    { label: 'ҮР ДҮН / ТАЙЛАН', sub: '', startCol: dateIdx('05-24'), endCol: dateIdx('05-30'), lineCol: dateIdx('05-24'), color: '#27ae60' },
  ].filter(m => m.startCol >= 0 && m.endCol >= 0)
}

function getMilestoneForCol(milestones: Milestone[], colIdx: number): { isLine: boolean; milestone: Milestone } | null {
  for (const m of milestones) {
    if (colIdx === m.lineCol) return { isLine: true, milestone: m }
  }
  return null
}

function MainSheet() {
  const main = data.main as {
    title: string
    department: string
    responsible: string
    period: string
    dayDates: string[]
    tasks: MainTask[]
  }
  const stats = calcStats(main.tasks)
  const [milestones, setMilestones] = useState(() => getMilestones(main.dayDates))
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  /** Drag a milestone flag to change its lineCol (date) – works with mouse & touch */
  const onFlagDrag = useCallback((msIndex: number) => {
    const table = tableRef.current
    if (!table) return
    const headerRow = table.querySelector('thead tr:last-child') as HTMLTableRowElement
    if (!headerRow) return
    const ganttThs = Array.from(headerRow.children).slice(DATA_COL_COUNT) as HTMLElement[]
    const rects = ganttThs.map(th => th.getBoundingClientRect())

    const updateCol = (x: number) => {
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]
        if (x >= r.left && x <= r.right) {
          setMilestones(prev => {
            if (prev[msIndex].lineCol === i) return prev
            const next = [...prev]
            next[msIndex] = { ...next[msIndex], lineCol: i }
            return next
          })
          break
        }
      }
    }

    const onMouseMove = (ev: MouseEvent) => updateCol(ev.clientX)
    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      updateCol(ev.touches[0].clientX)
    }
    const onEnd = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }, [])

  useEffect(() => {
    // Only apply sticky columns on wider screens
    if (window.innerWidth < 768) return
    const table = tableRef.current
    if (!table) return
    const headerRow = table.querySelector('thead tr:last-child') as HTMLTableRowElement
    if (!headerRow) return
    const ths = Array.from(headerRow.children).slice(0, DATA_COL_COUNT) as HTMLElement[]
    const lefts: number[] = []
    let cum = 0
    for (const th of ths) {
      lefts.push(cum)
      cum += th.offsetWidth
    }
    // Apply sticky to all data cells
    table.querySelectorAll('tr').forEach(row => {
      const cells = Array.from(row.children) as HTMLElement[]
      const first = cells[0]
      // Milestone spacer spans all data cols
      if (first?.classList.contains('milestone-spacer')) {
        first.style.position = 'sticky'
        first.style.left = '0px'
        first.style.zIndex = '5'
        first.style.minWidth = `${cum}px`
        return
      }
      // Regular data cells
      cells.slice(0, DATA_COL_COUNT).forEach((cell, i) => {
        if (cell.classList.contains('milestone-line-header') || cell.classList.contains('milestone-empty')) return
        cell.style.position = 'sticky'
        cell.style.left = `${lefts[i]}px`
        cell.style.zIndex = '3'
      })
    })
  }, [])

  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h2>{main.title}</h2>
        <div className="sheet-meta-table">
          <div className="meta-row">
            <span className="meta-label">Газар нэгж:</span>
            <span className="meta-value">{main.department}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Хариуцагч:</span>
            <span className="meta-value">{main.responsible}</span>
            <span className="meta-label">Хийгдэх хугацаа</span>
            <span className="meta-value">{main.dayDates[0]} ~ {main.dayDates[main.dayDates.length - 1]}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📊" label="Нийт ажил" value={stats.total} color="#1e3a5f" />
        <StatCard icon="✅" label="Дууссан" value={stats.done} sub={`${stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0}%`} color="#10b981" />
        <StatCard icon="🔄" label="Хийгдэж буй" value={stats.inProgress} color="#3b82f6" />
        <StatCard icon="⏳" label="Эхлээгүй" value={stats.notStarted} color="#6b7280" />
        <StatCard icon="⚠️" label="Хугацаа хэтэрсэн" value={stats.overdue} color="#ef4444" />
        <StatCard icon="📈" label="Дундаж гүйцэтгэл" value={`${stats.avgCompletion}%`} color={completionColor(stats.avgCompletion)} />
      </div>

      <div className="overall-progress">
        <div className="overall-label">Нийт гүйцэтгэл</div>
        <div className="overall-bar">
          <div className="overall-fill" style={{ width: `${stats.avgCompletion}%`, background: completionColor(stats.avgCompletion) }} />
        </div>
        <div className="overall-pct">{stats.avgCompletion}%</div>
      </div>

      <div className="table-wrap" ref={tableWrapRef}>
        <table className="main-table" ref={tableRef}>
          <thead>
            {/* Milestone labels row – each label sits at lineCol */}
            <tr className="milestone-row">
              <th colSpan={DATA_COL_COUNT} className="milestone-spacer" />
              {main.dayDates.map((_d, i) => {
                const msIdx = milestones.findIndex(m => m.lineCol === i)
                if (msIdx >= 0) {
                  const ms = milestones[msIdx]
                  const dateLabel = main.dayDates[i] ? main.dayDates[i].slice(5) : ''
                  return (
                    <th key={i} className="milestone-line-header" style={{ '--ms-color': ms.color } as React.CSSProperties}>
                      <div className="milestone-flag"
                        onMouseDown={(e) => { e.preventDefault(); onFlagDrag(msIdx) }}
                        onTouchStart={(e) => { e.preventDefault(); onFlagDrag(msIdx) }}
                      >
                        <span className="milestone-flag-label">{ms.label}</span>
                        <span className="milestone-flag-date">{dateLabel}</span>
                        <div className="milestone-flag-arrow" />
                      </div>
                    </th>
                  )
                }
                return <th key={i} className="milestone-empty" />
              })}
            </tr>
            <tr>
              <th>№</th>
              <th>Эрэмбэ</th>
              <th>Хийгдэх ажил</th>
              <th>Хамтрах</th>
              <th>Зардал</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th>Гүйцэтгэл</th>
              <th>Бодит эхэлсэн</th>
              <th>Бодит дууссан</th>
              <th>Хэтэрсэн</th>
              <th>Хугацаа</th>
              {main.dayDates.map((d, i) => {
                const msLine = getMilestoneForCol(milestones, i)
                return (
                  <th key={i} className={`gantt-header ${msLine ? 'gantt-header-milestone' : ''}`}
                    style={msLine ? { borderBottom: `3px solid ${msLine.milestone.color}` } : undefined}>
                    {d ? d.slice(5) : ''}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {main.tasks.map((t, i) => (
              <tr key={i} className={t.isParent ? 'parent-row' : 'child-row'}>
                <td className="num-cell">{t.num}</td>
                <td>
                  {t.priority && (
                    <span className={`priority priority-${t.priority.toLowerCase()}`}>
                      {t.priority}
                    </span>
                  )}
                </td>
                <td className={t.isParent ? 'task-parent' : 'task-child'}>
                  {t.isParent ? t.topic : t.subtask || t.topic}
                </td>
                <td>{t.partner}</td>
                <td className="num-cell">{formatNum(t.cost)}</td>
                <td className="date-cell">{t.startDate}</td>
                <td className="date-cell">{t.endDate}</td>
                <td className="progress-cell">
                  <StatusDot value={t.completion} />
                  <ProgressBar value={t.completion} />
                </td>
                <td className="date-cell">{t.actualStart}</td>
                <td className="date-cell">{t.actualEnd}</td>
                <td className={`num-cell ${Number(t.overdueDays) > 0 ? 'overdue' : Number(t.overdueDays) < 0 ? 'early' : ''}`}>
                  {Number(t.overdueDays) > 0 ? `+${t.overdueDays}` : t.overdueDays || ''}
                </td>
                <td className="num-cell">{t.duration ? `${t.duration} өдөр` : ''}</td>
                {t.gantt.map((g, j) => {
                  const msLine = getMilestoneForCol(milestones, j)
                  return (
                    <td
                      key={j}
                      className={`gantt-cell ${g > 0 ? (t.isParent ? 'gantt-parent' : 'gantt-active') : ''} ${msLine ? 'gantt-milestone-line' : ''}`}
                      style={msLine ? { '--ms-color': msLine.milestone.color } as React.CSSProperties : undefined}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface BudgetRow {
  num: number | string
  task: string
  values: number[]
  isTotal: boolean
}

function BudgetSheet() {
  const budget = data.budget as { title: string; months: string[]; rows: BudgetRow[] }
  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h2>{budget.title}</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Хийгдэх ажил</th>
              {budget.months.map((m, i) => (
                <th key={i} className="num-cell">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budget.rows.map((r, i) => (
              <tr key={i} className={r.isTotal ? 'total-row' : ''}>
                <td className="num-cell">{r.num}</td>
                <td className={r.isTotal ? 'task-parent' : ''}>{r.task}</td>
                {r.values.map((v, j) => (
                  <td key={j} className="num-cell">{formatNum(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface BoostRow {
  num: number | string
  idea: string
  date: string
  format: string
  description: string
  startDate: string
  endDate: string
  totalBoost: number | string
}

function BoostSheet() {
  const boost = data.boost as { title: string; rows: BoostRow[] }
  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h2>{boost.title}</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>IDEA</th>
              <th>Хугацаа</th>
              <th>Хэлбэр</th>
              <th>Тайлбар</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th>Нийт Boost</th>
            </tr>
          </thead>
          <tbody>
            {boost.rows.map((r, i) => (
              <tr key={i}>
                <td className="num-cell">{r.num}</td>
                <td>{r.idea}</td>
                <td className="date-cell">{r.date}</td>
                <td>{r.format}</td>
                <td className="desc-cell">{r.description}</td>
                <td className="date-cell">{r.startDate}</td>
                <td className="date-cell">{r.endDate}</td>
                <td className="num-cell">{formatNum(r.totalBoost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ExpenseRow {
  num: number | string
  task: string
  code: string | number
  date: string
  unitPrice: number | string
  quantity: number | string
  total: number | string
  discount: number | string
  expense: number | string
}

function ExpensesSheet() {
  const expenses = data.expenses as { title: string; rows: ExpenseRow[] }
  return (
    <div className="sheet-container">
      <div className="sheet-header">
        <h2>{expenses.title}</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Хийгдсэн ажил</th>
              <th>Санхүү код</th>
              <th>Хугацаа</th>
              <th>Нэгж үнэ</th>
              <th>Тоо</th>
              <th>Нийт үнэ</th>
              <th>Хөнгөлөлт</th>
              <th>Гарсан зардал</th>
            </tr>
          </thead>
          <tbody>
            {expenses.rows.map((r, i) => (
              <tr key={i}>
                <td className="num-cell">{r.num}</td>
                <td>{r.task}</td>
                <td>{r.code}</td>
                <td className="date-cell">{r.date}</td>
                <td className="num-cell">{formatNum(r.unitPrice)}</td>
                <td className="num-cell">{formatNum(r.quantity)}</td>
                <td className="num-cell">{formatNum(r.total)}</td>
                <td className="num-cell">{typeof r.discount === 'number' && r.discount > 0 ? `${Math.round(r.discount * 100)}%` : ''}</td>
                <td className="num-cell">{formatNum(r.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RoleSelector({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="role-selector">
      <div className="role-card">
        <h1>БХГ 2026 - Төлөвлөгөө</h1>
        <p>Хэлтсээ сонгоно уу</p>
        <div className="role-buttons">
          {roles.map(r => (
            <button key={r.key} className={`role-btn role-btn-${r.key}`} onClick={() => onSelect(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey | null>(null)

  if (!role) {
    return <RoleSelector onSelect={(r) => { setRole(r); setActiveTab(roleTabs[r][0]); }} />
  }

  const visibleTabs = allTabs.filter(t => roleTabs[role].includes(t.key))

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">БХГ</div>
          <div className="header-info">
            <h1>БХГ 2026 - Төлөвлөгөө</h1>
            <span className="header-date">2026 оны 5-р сар</span>
          </div>
        </div>
        <div className="header-right">
          <div className="header-role">
            <span className="role-icon">👤</span>
            <span className="role-name">{roles.find(r => r.key === role)?.label}</span>
          </div>
          <button className="logout-btn" onClick={() => { setRole(null); setActiveTab(null); }}>
            ↩ Гарах
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'main' && <MainSheet />}
        {activeTab === 'marketing' && data.marketing && <DeptSheet dept={data.marketing as DeptData} />}
        {activeTab === 'callCenter' && data.callCenter && <DeptSheet dept={data.callCenter as DeptData} />}
        {activeTab === 'customerService' && data.customerService && <DeptSheet dept={data.customerService as DeptData} />}
        {activeTab === 'design' && data.design && <DeptSheet dept={data.design as DeptData} />}
        {activeTab === 'boost' && <BoostSheet />}
        {activeTab === 'budget' && <BudgetSheet />}
        {activeTab === 'expenses' && <ExpensesSheet />}
      </main>
    </div>
  )
}

export default App

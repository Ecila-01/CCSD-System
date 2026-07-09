import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import '../styles/Dashboard.css';
import '../styles/Reports.css';
import PDFExportButton from '../components/PDFExportButton';

// ── helpers ──────────────────────────────────────────────────────────────────
const toMonthValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const parseMonthValue = (val) => {
  const [y, m] = val.split('-').map(Number);
  return { year: y, month: m - 1 }; // month is 0-indexed
};

const COLORS = ['#c00000', '#1e293b', '#e2b05f', '#475569', '#0284c7', '#16a34a', '#d97706'];

const statusType = (status) => {
  if (['Completed', 'Resolved', 'Issued'].includes(status)) return 'completed';
  if (['Declined', 'Cancelled', 'No-Show'].includes(status)) return 'declined';
  return 'pending';
};

const statusColor = (status) => {
  const t = statusType(status);
  if (t === 'completed') return '#16a34a';
  if (t === 'declined')  return '#dc2626';
  return '#f59e0b';
};

// ── component ─────────────────────────────────────────────────────────────────
function Reports() {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const [requests, setRequests]   = useState([]);
  const [user]                    = useState(storedUser);
  const [isLoading, setIsLoading] = useState(true);
  const [casePage, setCasePage]   = useState(1);
  const CASE_PAGE_SIZE = 20;

  const now = new Date();

  // Month range state — default: last 6 months → current month
  const defaultEnd   = toMonthValue(now);
  const defaultStart = toMonthValue(new Date(now.getFullYear(), now.getMonth() - 5, 1));
  const [startMonth, setStartMonth] = useState(defaultStart);
  const [endMonth,   setEndMonth]   = useState(defaultEnd);

  const [reportType, setReportType] = useState(
    storedUser?.role === 'admin' ? 'overall' : 'accomplishment'
  );

  // pdfRef captures ONLY the stats section (no case log)
  const pdfRef = useRef(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/requests`)
      .then(res => setRequests(res.data))
      .catch(err => console.error('Error fetching report data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // ── filtered requests within the selected month range ──────────────────────
  const filtered = useMemo(() => {
    const { year: sy, month: sm } = parseMonthValue(startMonth);
    const { year: ey, month: em } = parseMonthValue(endMonth);
    const start = new Date(sy, sm, 1);
    const end   = new Date(ey, em + 1, 0, 23, 59, 59); // last day of end month
    return requests.filter(r => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });
  }, [requests, startMonth, endMonth]);

  // Requests belonging to the current counselor within the range
  const myFiltered = useMemo(() =>
    filtered.filter(r => r.assignedCounselor === user?.name),
    [filtered, user]
  );

  // ── build month labels between start and end ───────────────────────────────
  const monthLabels = useMemo(() => {
    const { year: sy, month: sm } = parseMonthValue(startMonth);
    const { year: ey, month: em } = parseMonthValue(endMonth);
    const labels = [];
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      labels.push(new Date(y, m, 1).toLocaleString('default', { month: 'short', year: '2-digit' }));
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return labels;
  }, [startMonth, endMonth]);

  // ── stats builder (works for any array of requests) ───────────────────────
  const buildStats = (reqs) => {
    const completed = reqs.filter(r => statusType(r.status) === 'completed');
    const declined  = reqs.filter(r => statusType(r.status) === 'declined');
    const pending   = reqs.filter(r => statusType(r.status) === 'pending');
    const rate      = reqs.length > 0 ? Math.round((completed.length / reqs.length) * 100) : 0;

    // Monthly trend
    const monthMap = {};
    monthLabels.forEach(l => { monthMap[l] = { month: l, completed: 0, pending: 0, declined: 0 }; });
    reqs.forEach(r => {
      const l = new Date(r.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[l]) return;
      monthMap[l][statusType(r.status)]++;
    });
    const monthlyTrend = monthLabels.map(l => monthMap[l]);

    // Services table
    const svcMap = {};
    reqs.forEach(r => {
      const s = (r.serviceName || 'UNKNOWN').toUpperCase();
      if (!svcMap[s]) svcMap[s] = { service: s, total: 0, completed: 0, pending: 0, declined: 0 };
      svcMap[s].total++;
      svcMap[s][statusType(r.status)]++;
    });
    const servicesTable = Object.values(svcMap).sort((a, b) => b.total - a.total);
    const servicesPie   = servicesTable.map(s => ({ name: s.service, value: s.total }));

    return { completed, declined, pending, rate, monthlyTrend, servicesTable, servicesPie };
  };

  const overallStats = useMemo(() => {
    const s = buildStats(filtered);
    const referralCount = filtered.filter(r => r.serviceName?.toUpperCase() === 'REFERRAL').length;

    // Counselor table
    const cMap = {};
    filtered.forEach(r => {
      const c = r.assignedCounselor && r.assignedCounselor !== 'Unassigned' ? r.assignedCounselor : null;
      if (!c) return;
      if (!cMap[c]) cMap[c] = { name: c, total: 0, completed: 0, pending: 0, declined: 0 };
      cMap[c].total++;
      cMap[c][statusType(r.status)]++;
    });
    const counselorTable = Object.values(cMap).sort((a, b) => b.total - a.total);

    return { ...s, referralCount, counselorTable };
  }, [filtered, monthLabels]);

  const myStats = useMemo(() => {
    const s = buildStats(myFiltered);

    // Weekly breakdown within the range
    const weeks = Array.from({ length: 5 }, (_, i) => ({ name: `Week ${i+1}`, completed: 0, pending: 0, declined: 0 }));
    myFiltered.forEach(r => {
      const wi = Math.min(Math.floor((new Date(r.createdAt).getDate() - 1) / 7), 4);
      weeks[wi][statusType(r.status)]++;
    });

    return { ...s, weeks };
  }, [myFiltered, monthLabels]);

  // ── data passed directly to PDF generator ─────────────────────────────────
  const pdfStatsData = useMemo(() => {
    const stats  = reportType === 'overall' ? overallStats : myStats;
    const reqs   = reportType === 'overall' ? filtered    : myFiltered;

    const kpis = [
      { label: 'TOTAL REQUESTS',       value: reqs.length },
      { label: 'COMPLETED',             value: stats.completed.length },
      { label: 'PENDING / IN-PROGRESS', value: stats.pending.length },
      { label: 'DECLINED / CANCELLED',  value: stats.declined.length },
      { label: 'COMPLETION RATE',       value: `${stats.rate}%` },
      ...(reportType === 'overall'
        ? [{ label: 'TOTAL REFERRALS', value: overallStats.referralCount }]
        : []),
    ];

    return {
      reportType,
      kpis,
      servicesTable:  stats.servicesTable,
      monthlyTrend:   stats.monthlyTrend,
      ...(reportType === 'overall'
        ? { counselorTable: overallStats.counselorTable }
        : { weeks: myStats.weeks }),
    };
  }, [reportType, overallStats, myStats, filtered, myFiltered]);

  const getReportTitle = () =>
    reportType === 'overall'
      ? `CCSD Narrative Report — ${startMonth} to ${endMonth}`
      : `${user?.name ?? 'Staff'} — Accomplishment Report`;

  const getFilename = () =>
    reportType === 'overall'
      ? `CCSD_Report_${startMonth}_${endMonth}`
      : `${(user?.name ?? 'Staff').replace(/\s+/g,'_')}_Accomplishment_${startMonth}_${endMonth}`;

  const rangeLabel = `${new Date(...parseMonthValue(startMonth).month !== undefined
    ? [parseMonthValue(startMonth).year, parseMonthValue(startMonth).month]
    : []).toLocaleString?.('default', { month:'long', year:'numeric' }) ?? startMonth}`;

  const prettyRange = (() => {
    const { year: sy, month: sm } = parseMonthValue(startMonth);
    const { year: ey, month: em } = parseMonthValue(endMonth);
    const s = new Date(sy, sm, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const e = new Date(ey, em, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    return s === e ? s : `${s} – ${e}`;
  })();

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Report Data…</div>;

  const activeReqs = reportType === 'overall' ? filtered   : myFiltered;
  const activeStats = reportType === 'overall' ? overallStats : myStats;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content" style={{ padding: '20px', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <TopBar />

        <section className="reports-view">

          {/* ── Controls ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0' }}>
                {reportType === 'overall' ? 'Narrative Report' : 'Accomplishment Report'}
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{prettyRange}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
              {/* Report type toggle (admin only) */}
              {user?.role === 'admin' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { setReportType('overall');         setCasePage(1); }} style={reportType === 'overall'        ? btnActive : btnInactive}>Narrative</button>
                  <button onClick={() => { setReportType('accomplishment'); setCasePage(1); }} style={reportType === 'accomplishment' ? btnActive : btnInactive}>Accomplishment</button>
                </div>
              )}

              {/* Month range */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={labelStyle}>
                  From
                  <input type="month" value={startMonth} max={endMonth}
                    onChange={e => { setStartMonth(e.target.value); setCasePage(1); }} style={monthInput} />
                </label>
                <label style={labelStyle}>
                  To
                  <input type="month" value={endMonth} min={startMonth} max={toMonthValue(now)}
                    onChange={e => { setEndMonth(e.target.value); setCasePage(1); }} style={monthInput} />
                </label>
              </div>

              <PDFExportButton
                statsData={pdfStatsData}
                filename={getFilename()}
                reportTitle={getReportTitle()}
                generatedBy={user?.name ?? 'Staff'}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PDF-CAPTURED SECTION — stats only, no case log
          ══════════════════════════════════════════════════════════════════ */}
          <div ref={pdfRef} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px' }}>

            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
              Period: {prettyRange} · {activeReqs.length} total request{activeReqs.length !== 1 ? 's' : ''}
            </p>

            {/* KPI row */}
            <div style={kpiRow}>
              <KPI label="Total Requests"        value={activeReqs.length}                  color="#0284c7" />
              <KPI label="Completed"             value={activeStats.completed.length}        color="#16a34a" />
              <KPI label="Pending / In-Progress" value={activeStats.pending.length}          color="#f59e0b" />
              <KPI label="Declined / Cancelled"  value={activeStats.declined.length}         color="#dc2626" />
              <KPI label="Completion Rate"       value={`${activeStats.rate}%`}              color="#7c3aed" />
              {reportType === 'overall' && (
                <KPI label="Total Referrals"     value={overallStats.referralCount}          color="#c00000" />
              )}
            </div>

            {/* Charts */}
            <div style={chartsRow}>
              <div style={chartCard}>
                <h4 style={subTitle}>Monthly Volume</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={activeStats.monthlyTrend} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#16a34a" radius={[0,0,4,4]} />
                    <Bar dataKey="pending"   name="Pending"   stackId="a" fill="#f59e0b" />
                    <Bar dataKey="declined"  name="Declined"  stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={chartCard}>
                <h4 style={subTitle}>Services Distribution</h4>
                {activeStats.servicesPie.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={activeStats.servicesPie} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2} dataKey="value">
                          {activeStats.servicesPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={legendWrap}>
                      {activeStats.servicesPie.map((e, i) => (
                        <span key={i} style={legendItem}>
                          <span style={{ ...dot, backgroundColor: COLORS[i % COLORS.length] }} />
                          {e.name} ({e.value})
                        </span>
                      ))}
                    </div>
                  </>
                ) : <p style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '60px' }}>No data.</p>}
              </div>
            </div>

            {/* Services summary table */}
            <h4 style={subTitle}>Services Summary</h4>
            <SummaryTable
              rows={activeStats.servicesTable}
              colHeader="Service"
              nameKey="service"
              emptyMsg="No service data for this period."
            />

            {/* Counselor table — overall only */}
            {reportType === 'overall' && (
              <>
                <h4 style={subTitle}>Counselor Performance</h4>
                <SummaryTable
                  rows={overallStats.counselorTable}
                  colHeader="Counselor"
                  nameKey="name"
                  emptyMsg="No counselor data for this period."
                />
              </>
            )}

            {/* Weekly breakdown — accomplishment only */}
            {reportType === 'accomplishment' && (
              <>
                <h4 style={subTitle}>Weekly Breakdown (latest month in range)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={myStats.weeks} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,.1)' }} />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#16a34a" radius={[0,0,4,4]} />
                    <Bar dataKey="pending"   name="Pending"   stackId="a" fill="#f59e0b" />
                    <Bar dataKey="declined"  name="Declined"  stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}

          </div>
          {/* ══ end PDF section ══ */}

          {/* Case log */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(activeReqs.length / CASE_PAGE_SIZE));
            const pageReqs   = activeReqs.slice((casePage - 1) * CASE_PAGE_SIZE, casePage * CASE_PAGE_SIZE);
            return (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ ...subTitle, margin: 0 }}>
                    {reportType === 'overall' ? 'Full Case Log' : 'My Case Log'}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {activeReqs.length} record{activeReqs.length !== 1 ? 's' : ''}
                    {totalPages > 1 && ` · Page ${casePage} of ${totalPages}`}
                  </span>
                </div>
                <div style={tableWrap}>
                  {activeReqs.length > 0 ? (
                    <table style={tbl}>
                      <thead>
                        <tr>
                          <th style={th}>Date</th>
                          <th style={th}>Client Name</th>
                          <th style={th}>Service</th>
                          {reportType === 'overall' && <th style={th}>Assigned To</th>}
                          <th style={th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageReqs.map((r, i) => (
                          <tr key={r._id || i} style={i % 2 === 0 ? trEven : {}}>
                            <td style={td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td style={td}>{getClientName(r)}</td>
                            <td style={td}>{r.serviceName || 'N/A'}</td>
                            {reportType === 'overall' && <td style={td}>{r.assignedCounselor || 'Unassigned'}</td>}
                            <td style={{ ...td, fontWeight: 600, color: statusColor(r.status) }}>{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p style={{ color: '#64748b', margin: 0 }}>No cases in this period.</p>}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                    <button onClick={() => setCasePage(1)}            disabled={casePage === 1}          style={pgBtn(casePage === 1)}>«</button>
                    <button onClick={() => setCasePage(p => p - 1)}  disabled={casePage === 1}          style={pgBtn(casePage === 1)}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - casePage) <= 2)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) => p === '…'
                        ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                        : <button key={p} onClick={() => setCasePage(p)} style={pgBtn(false, p === casePage)}>{p}</button>
                      )
                    }
                    <button onClick={() => setCasePage(p => p + 1)}  disabled={casePage === totalPages} style={pgBtn(casePage === totalPages)}>›</button>
                    <button onClick={() => setCasePage(totalPages)}   disabled={casePage === totalPages} style={pgBtn(casePage === totalPages)}>»</button>
                  </div>
                )}
              </div>
            );
          })()}

        </section>
      </main>
    </div>
  );
}

// ── getClientName ─────────────────────────────────────────────────────────────
function getClientName(req) {
  const student = req.studentName || 'Unknown Student';
  if (req.serviceName?.toUpperCase() === 'REFERRAL') {
    return `${student} (via ${req.referrerName || 'Unknown Referrer'})`;
  }
  return student;
}

// ── SummaryTable ──────────────────────────────────────────────────────────────
function SummaryTable({ rows, colHeader, nameKey, emptyMsg }) {
  const totals = rows.reduce(
    (acc, r) => ({ total: acc.total + r.total, completed: acc.completed + r.completed, pending: acc.pending + r.pending, declined: acc.declined + r.declined }),
    { total: 0, completed: 0, pending: 0, declined: 0 }
  );

  return (
    <div style={tableWrap}>
      <table style={tbl}>
        <thead>
          <tr>
            {[colHeader, 'Total', 'Completed', 'Pending', 'Declined', 'Completion Rate'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((r, i) => (
            <tr key={i} style={i % 2 === 0 ? trEven : {}}>
              <td style={{ ...td, fontWeight: 600 }}>{r[nameKey]}</td>
              <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{r.total}</td>
              <td style={{ ...td, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{r.completed}</td>
              <td style={{ ...td, textAlign: 'center', color: '#f59e0b' }}>{r.pending}</td>
              <td style={{ ...td, textAlign: 'center', color: '#dc2626' }}>{r.declined}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                {r.total > 0 ? `${Math.round((r.completed / r.total) * 100)}%` : '—'}
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94a3b8' }}>{emptyMsg}</td></tr>
          )}
          {rows.length > 1 && (
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700 }}>
              <td style={td}>TOTAL</td>
              <td style={{ ...td, textAlign: 'center' }}>{totals.total}</td>
              <td style={{ ...td, textAlign: 'center', color: '#16a34a' }}>{totals.completed}</td>
              <td style={{ ...td, textAlign: 'center', color: '#f59e0b' }}>{totals.pending}</td>
              <td style={{ ...td, textAlign: 'center', color: '#dc2626' }}>{totals.declined}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                {totals.total > 0 ? `${Math.round((totals.completed / totals.total) * 100)}%` : '—'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, color }) {
  return (
    <div style={{
      flex: '1 1 120px', minWidth: '110px', background: 'white',
      border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px',
      boxShadow: '0 2px 4px rgba(0,0,0,.03)', borderTop: `4px solid ${color}`,
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{value}</p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const subTitle   = { fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: '20px 0 10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' };
const kpiRow     = { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' };
const chartsRow  = { display: 'flex', flexWrap: 'wrap', gap: '14px', margin: '4px 0' };
const chartCard  = { flex: '1 1 260px', minWidth: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' };
const legendWrap = { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#475569' };
const dot        = { width: '10px', height: '10px', borderRadius: '2px', display: 'inline-block' };
const tableWrap  = { width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' };
const tbl        = { width: '100%', minWidth: '560px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' };
const th         = { background: '#f8fafc', color: '#475569', padding: '8px 10px', borderBottom: '2px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', whiteSpace: 'nowrap' };
const td         = { padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#334155' };
const trEven     = { backgroundColor: '#f8fafc' };
const pgBtn = (disabled, active = false) => ({
  padding: '4px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: disabled ? 'not-allowed' : 'pointer',
  background: active ? '#c00000' : disabled ? '#f8fafc' : 'white',
  color: active ? 'white' : disabled ? '#cbd5e1' : '#334155',
  fontWeight: active ? 700 : 400, fontSize: '13px',
});
const btnActive  = { padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#c00000', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
const btnInactive= { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' };
const monthInput = { padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', marginTop: '2px' };

export default Reports;

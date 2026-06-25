import '../styles/Skeleton.css';

/** Single shimmer block. Pass width/height/borderRadius as inline style overrides. */
export const Sk = ({ w, h, circle, pill, style = {}, className = '' }) => (
  <span
    className={`sk ${circle ? 'sk-circle' : ''} ${pill ? 'sk-pill' : ''} ${className}`}
    style={{ width: w, height: h, display: 'block', ...style }}
  />
);

/** N skeleton table rows, each with `cols` shimmer blocks */
export const SkTableRows = ({ rows = 5, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={{ padding: '14px 10px' }}>
            <Sk h="14px" w={j === 0 ? '30px' : j === cols - 1 ? '80px' : '100%'} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/** N skeleton announcement / career cards in a grid */
export const SkCards = ({ count = 6, height = '220px' }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="sk-card" style={{ minHeight: height }}>
        <Sk h="130px" className="sk-rounded" style={{ marginBottom: '4px' }} />
        <Sk h="14px" w="40%" className="sk-pill" />
        <Sk h="18px" w="80%" />
        <Sk h="13px" w="95%" />
        <Sk h="13px" w="70%" />
      </div>
    ))}
  </>
);

/** KPI summary cards (for Reports) */
export const SkKpiRow = ({ count = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '16px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="sk-kpi">
        <Sk h="12px" w="60%" />
        <Sk h="36px" w="50%" />
        <Sk h="11px" w="40%" />
      </div>
    ))}
  </div>
);

/** Chart placeholder box */
export const SkChart = ({ height = '260px', title = true }) => (
  <div className="sk-chart">
    {title && <Sk h="16px" w="35%" />}
    <Sk h={height} className="sk-rounded" />
  </div>
);

/** Simple stacked text lines */
export const SkLines = ({ lines = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Sk key={i} h="14px" w={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </div>
);

/** Full guest-view status card skeleton */
export const SkGuestCard = () => (
  <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
    <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '45%' }}>
        <Sk h="12px" w="60%" />
        <Sk h="28px" w="80%" className="sk-pill" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '40%', alignItems: 'flex-end' }}>
        <Sk h="12px" w="55%" />
        <Sk h="20px" w="90%" />
      </div>
    </div>
    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Sk h="16px" w="40%" />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Sk h="12px" w="30%" />
          <Sk h="14px" w="85%" />
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: '14px', borderRadius: '10px', background: '#fcfcfc', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Sk h="11px" w="50%" />
            <Sk h="16px" w="80%" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

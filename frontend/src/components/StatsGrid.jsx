import React from 'react';
import { MdOutlineAccessTime, MdOutlineCheckCircleOutline, MdOutlinePendingActions } from "react-icons/md";

const StatsGrid = ({ requests }) => {
  const totalCases    = requests.length;
  const resolvedCases = requests.filter(req => req.status === 'Completed').length;
  const pendingCases  = requests.filter(req => req.status === 'Pending').length;

  const stats = [
    {
      icon: <MdOutlineAccessTime />,
      value: totalCases,
      label: 'Total Cases',
      bg: '#fee2e2',
      color: '#c00000',
    },
    {
      icon: <MdOutlineCheckCircleOutline />,
      value: resolvedCases,
      label: 'Resolved Cases',
      bg: '#dcfce7',
      color: '#15803d',
    },
    {
      icon: <MdOutlinePendingActions />,
      value: pendingCases,
      label: 'Pending Cases',
      bg: '#fff3e0',
      color: '#f57f17',
    },
  ];

  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 20px 30px 0 30px;
          box-sizing: border-box;
          max-width: 100%;
          min-width: 0;
        }

        .stats-grid .sg-card {
          background: white;
          padding: 18px 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          border-radius: 6px;
          min-width: 0;
          box-sizing: border-box;
        }

        .stats-grid .sg-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stats-grid .sg-text { min-width: 0; }
        .stats-grid .sg-text h3 {
          margin: 0 0 2px;
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
        }
        .stats-grid .sg-text span {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          display: block;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .stats-grid {
            margin: 16px 20px 0 20px;
            gap: 12px;
          }
          .stats-grid .sg-card { padding: 14px 12px; gap: 10px; }
          .stats-grid .sg-icon { width: 42px; height: 42px; font-size: 22px; }
          .stats-grid .sg-text h3   { font-size: 20px; }
          .stats-grid .sg-text span { font-size: 11px; }
        }

        /* Mobile — icon + bold number only, no label */
        @media (max-width: 768px) {
          .stats-grid {
            margin: 12px 14px 0 14px;
            gap: 8px;
          }
          .stats-grid .sg-card {
            padding: 12px 8px;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            text-align: center;
          }
          .stats-grid .sg-icon { width: 40px; height: 40px; font-size: 22px; border-radius: 10px; }
          .stats-grid .sg-text h3   { font-size: 20px; font-weight: 800; }
          .stats-grid .sg-text span { display: none; }
        }

        /* Small mobile */
        @media (max-width: 480px) {
          .stats-grid {
            margin: 10px 10px 0 10px;
            gap: 6px;
          }
          .stats-grid .sg-card { padding: 10px 4px; gap: 4px; }
          .stats-grid .sg-icon { width: 34px; height: 34px; font-size: 18px; border-radius: 8px; }
          .stats-grid .sg-text h3 { font-size: 17px; font-weight: 800; }
        }
      `}</style>

      <div className="stats-grid">
        {stats.map(({ icon, value, label, bg, color }) => (
          <div className="sg-card" key={label}>
            <div className="sg-icon" style={{ background: bg, color }}>
              {icon}
            </div>
            <div className="sg-text">
              <h3>{value}</h3>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default StatsGrid;
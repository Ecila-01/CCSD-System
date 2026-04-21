import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineDateRange, MdOutlinePendingActions, MdOutlineFolderShared } from "react-icons/md";

const WelcomeCard = ({ user, sessionsToday, displayQueue, yourActive, isAdmin }) => {
  const navigate = useNavigate();
  const userDepartments = user.assignedDepartments || [];
  
  const deptString = isAdmin 
    ? "Global Administrator" 
    : (userDepartments.length > 0 ? userDepartments.join(", ") : "Unassigned Department");

  // UB Heritage Garnet
  const ubGarnet = "#3C3736";

  return (
    <div className="welcome-card" style={{ background: '#C3151C', color: 'white', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '20px', marginRight: '20px' }}>
      
      <div className="welcome-text" style={{ flex: 1 }}>
        <div style={{ 
          display: 'inline-block', 
          background: 'rgba(255,255,255,0.15)', 
          padding: '5px 14px', 
          //borderRadius: '6px', // Matches your other UI elements better than a pill
          fontSize: '11px', 
          fontWeight: 'bold', 
          letterSpacing: '1.2px', 
          textTransform: 'uppercase', 
          marginBottom: '15px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {deptString}
        </div>

        <h2 style={{ fontSize: '40px', margin: '0 0 10px 0', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'}}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]}!
        </h2>
        
        <p style={{ 
          margin: '0 0 25px 0', 
          fontSize: '14px', 
          color: '#f8fafc', // Slightly off-white for better reading
          lineHeight: '1.8',
          maxWidth: '500px'
        }}>

          You have <strong style={{ color: '#fff' }}>{sessionsToday}</strong> scheduled sessions today.<br/>
          
          {isAdmin ? (
            <span>There are <strong>{displayQueue}</strong> total cases awaiting review across all departments.</span>
          ) : (
            <span>There are <strong>{displayQueue}</strong> cases awaiting review in your assigned department(s).</span>
          )}
        </p>
        
        <button 
          onClick={() => navigate('/schedules')} 
          style={{ 
            background: 'white', 
            border: 'none', 
            color: ubGarnet, // ✅ Matches the theme perfectly
            padding: '12px 28px', 
            //borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: '800', // Made it extra bold
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MdOutlineDateRange size={20} /> View My Schedule
        </button>
      </div>

      <div className="welcome-stats" style={{ display: 'flex', gap: '20px' }}>
        
        {/* Box 1: Pending */}
        <div style={{ 
          background: '#3C3736', // ✅ Darker background for more "pop"
          padding: '25px', 
          //borderRadius: '16px', 
          minWidth: '140px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}>
          <MdOutlinePendingActions size={28} style={{ color: '#ffffff', marginBottom: '10px' }} /> {/* Added Gold accent icon */}
          <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: '1', color: '#fff' }}>{displayQueue}</div>
          <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {isAdmin ? "Total Pending" : "Pending"}
          </div>
        </div>

        {/* Box 2: Active */}
        <div style={{ 
          background: '#929396', 
          padding: '25px', 
          //borderRadius: '16px', 
          minWidth: '160px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}>
          <MdOutlineFolderShared size={28} style={{ color: '#fdfdfd', marginBottom: '10px' }} /> {/* Added Gold accent icon */}
          <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: '1', color: '#fff' }}>{yourActive}</div>
          <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '8px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {isAdmin ? "Total" : "Your Cases"}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeCard;
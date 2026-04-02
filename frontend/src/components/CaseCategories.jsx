import React from 'react';

const CaseCategories = () => {
  return (
    <div className="categories-section">
      <h3>Case Categories</h3>
      <div className="categories-grid">
        <div className="category-card">
          <h4>COUNSELING</h4>
          <p>Mental Health - Level II</p>
          <div className="progress-bar"><div className="progress-fill" style={{width: '38%'}}></div></div>
        </div>
        <div className="category-card">
          <h4>REFERRALS</h4>
          <p>Student & Staffs</p>
          <div className="progress-bar"><div className="progress-fill" style={{width: '25%'}}></div></div>
        </div>
        <div className="category-card">
          <h4>CAREERS</h4>
          <p>Students Support</p>
          <div className="progress-bar"><div className="progress-fill" style={{width: '85%'}}></div></div>
        </div>
        <div className="category-card">
          <h4>TESTING</h4>
          <p>Psychological Assessments</p>
          <div className="progress-bar"><div className="progress-fill" style={{width: '50%'}}></div></div>
        </div>
      </div>
    </div>
  );
};

export default CaseCategories;
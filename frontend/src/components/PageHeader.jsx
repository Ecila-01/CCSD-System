import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PageHeader.css';

/**
 * PageHeader — shared responsive header for all pages
 *
 * Props:
 *   user        — the logged-in user object (from localStorage)
 *   showSearch  — boolean, default true. Pass false to hide search box.
 *   searchPlaceholder — string for the search input placeholder
 *   onSearch    — optional callback (value) => void for search changes
 */
const PageHeader = ({
  user,
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearch,
}) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="page-header-bar">
      {/* Left: Search (optional) */}
      <div className="phb-left">
        {showSearch ? (
          <div className="phb-search">
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
        ) : (
          <div className="phb-spacer" />
        )}
      </div>

      {/* Right: Date + Role pill */}
      <div className="phb-right">
        <span className="phb-date">{today}</span>
        {user && (
          <div className="phb-pill">
            <span className="phb-role-tag">{user.role}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
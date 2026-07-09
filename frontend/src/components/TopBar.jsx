import React from 'react';
import NotificationBell from './NotificationBell';

// Shared top bar for all authenticated pages: a sticky white bar
// (styled by .content-header) with the notification bell on the right.
const TopBar = () => (
  <header className="content-header">
    <NotificationBell />
  </header>
);

export default TopBar;

import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <nav>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/dashboard/dogs">Dogs</Link></li>
          <li><Link to="/dashboard/litters">Litters</Link></li>
          <li><Link to="/dashboard/heats">Heats</Link></li>
          {/* ... other menu items ... */}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 
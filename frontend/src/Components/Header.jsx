// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header({ user, onLogOut }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/login") return null;

  const handleLogout = () => {
    onLogOut();
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logoLink}>GEN.AI</Link>
      <nav style={styles.nav}>
        {/* <Link to="/archive" style={styles.navLink}>My Archive</Link> */}
        {/* <Link to="/home" style={styles.navLink}>My Home</Link> */}
        <Link to="/generate" style={styles.navLink}>Create</Link>
        {user ? (
          <button onClick={handleLogout} style={styles.authButton}>
            Logout
          </button>
        ) : (
          <Link to="/login" style={styles.authButton}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}

const HEADER_HEIGHT = 60;
const styles = {
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${HEADER_HEIGHT}px`,
    padding: '0 8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  logoLink: {
    fontFamily: 'MuseoModerno',
    textDecoration: 'none',
    color: '#383325',
    fontSize: '1.5rem',
    fontWeight: 'Regular',
  },
  nav: {
    fontFamily: 'Pretendard, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '10rem',
  },
  navLink: {
    textDecoration: 'none',
    color: '#383325',
    fontWeight: 500,
  },
  authButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#383325',
    fontWeight: 500,
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};

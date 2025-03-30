// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <Link to="/" style={styles.logoLink}>GEN.AI</Link>
      </div>
      <nav style={styles.nav}>
        <Link to="/archive" style={styles.navLink}>My Archive</Link>
        <Link to="/home" style={styles.navLink}>My Home</Link>
        <Link to="/generate" style={styles.navLink}>Create</Link>
        <Link to="/login" style={styles.navLink}>Login</Link>
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
    padding: '0 8rem', // 0 뒤에 스페이스 하나 무조건 넣어야됨. 뒤의 rem앞 숫자로만 조절.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  logo: {
  },
  logoLink: {
    fontFamily: 'MuseoModerno, sans-serif',
    textDecoration: 'none',
    color: '#333',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
    gap: '10rem', // nav간 간격
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 500,
  },
};

export default Header;
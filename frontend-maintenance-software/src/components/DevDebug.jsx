import React from 'react';

export default function DevDebug() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return (
    <div style={{ position: 'fixed', right: 10, bottom: 10, zIndex: 9999, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>
      <div><strong>DEV DEBUG</strong></div>
      <div>user: {user ? JSON.parse(user).name : 'null'}</div>
      <div>token: {token ? token.slice(0,20) + '...' : 'null'}</div>
      <div style={{ marginTop: 6 }}>frontend port: 3000</div>
    </div>
  );
}

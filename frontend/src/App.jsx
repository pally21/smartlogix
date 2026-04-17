import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Warehouses from './pages/Warehouses';
import Orders from './pages/Orders';
import Shipping from './pages/Shipping';
import Checkout from './pages/Checkout';

const NAV = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/inventory', label: '📦 Inventario' },
  { to: '/warehouses', label: '🏬 Bodegas' },
  { to: '/orders',    label: '🛒 Pedidos' },
  { to: '/shipping',  label: '🚚 Envíos' },
  { to: '/checkout',  label: '💳 Pago' },
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SmartLogix</h1>
          <span>Plataforma Logística</span>
        </div>
        <nav>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => isActive ? 'active' : ''}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#475569' }}>
          DSY1106 — Fullstack III
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/orders"    element={<Orders />} />
          <Route path="/shipping"  element={<Shipping />} />
          <Route path="/checkout"  element={<Checkout />} />
        </Routes>
      </main>
    </div>
  );
}

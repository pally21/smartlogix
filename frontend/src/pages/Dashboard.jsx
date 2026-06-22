import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { dashboardApi } from '../services/api';

const fmtCLP = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

const STATUS_BADGE = {
  PENDING:    { cls: 'badge-yellow', label: 'Pendiente' },
  APPROVED:   { cls: 'badge-blue',   label: 'Aprobado' },
  SHIPPED:    { cls: 'badge-blue',   label: 'Enviado' },
  DELIVERED:  { cls: 'badge-green',  label: 'Entregado' },
  CANCELLED:  { cls: 'badge-red',    label: 'Cancelado' },
  PROCESSING: { cls: 'badge-yellow', label: 'En proceso' },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando dashboard...</div>;

  const kpis = data?.kpis || {};
  const chartData = [
    { name: 'Productos', value: kpis.totalProducts || 0 },
    { name: 'Pedidos', value: kpis.totalOrders || 0 },
    { name: 'Envíos activos', value: kpis.activeShipments || 0 },
    { name: 'Alertas stock', value: kpis.lowStockAlerts || 0 },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Ejecutivo</h2>
        <p>Resumen en tiempo real de la operación logística</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="label">Productos</div>
          <div className="value">{kpis.totalProducts ?? '—'}</div>
          <div className="sub">En catálogo activo</div>
        </div>
        <div className="kpi-card green">
          <div className="label">Ingresos</div>
          <div className="value">{fmtCLP(kpis.totalRevenue)}</div>
          <div className="sub">Pedidos pagados</div>
        </div>
        <div className="kpi-card yellow">
          <div className="label">Pedidos pendientes</div>
          <div className="value">{kpis.pendingOrders ?? '—'}</div>
          <div className="sub">Requieren atención</div>
        </div>
        <div className="kpi-card">
          <div className="label">Envíos activos</div>
          <div className="value">{kpis.activeShipments ?? '—'}</div>
          <div className="sub">En tránsito ahora</div>
        </div>
        <div className="kpi-card red">
          <div className="label">Alertas stock</div>
          <div className="value">{kpis.lowStockAlerts ?? '—'}</div>
          <div className="sub">Stock bajo mínimo</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
            Resumen Operativo
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
            Últimos Pedidos
          </h3>
          {data?.recentOrders?.length > 0 ? (
            <table><tbody>
              {data.recentOrders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.customerName}</td>
                  <td>{fmtCLP(o.totalAmount)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status]?.cls || 'badge-gray'}`}>
                      {STATUS_BADGE[o.status]?.label || o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody></table>
          ) : <div className="empty">Sin pedidos recientes</div>}
        </div>
      </div>

      {data?.lowStockProducts?.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
            ⚠️ Productos con Stock Bajo
          </h3>
          <table>
            <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Stock mínimo</th></tr></thead>
            <tbody>
              {data.lowStockProducts.map(p => (
                <tr key={p.id}>
                  <td><code>{p.sku}</code></td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td><span className="badge badge-red">{p.minStock} und</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

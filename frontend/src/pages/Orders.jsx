import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ordersApi, inventoryApi } from '../services/api';

const STATUS_BADGE = {
  PENDING:    { cls: 'badge-yellow', label: 'Pendiente' },
  VALIDATED:  { cls: 'badge-blue',   label: 'Validado' },
  APPROVED:   { cls: 'badge-green',  label: 'Aprobado' },
  PROCESSING: { cls: 'badge-blue',   label: 'En proceso' },
  SHIPPED:    { cls: 'badge-blue',   label: 'Enviado' },
  DELIVERED:  { cls: 'badge-green',  label: 'Entregado' },
  CANCELLED:  { cls: 'badge-red',    label: 'Cancelado' },
};

const PAY_BADGE = {
  PENDING: { cls: 'badge-yellow', label: 'Pendiente' },
  PAID:    { cls: 'badge-green',  label: 'Pagado' },
  FAILED:  { cls: 'badge-red',    label: 'Fallido' },
};

const buildUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  throw new Error('No hay API segura de crypto disponible para generar UUID');
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerId: buildUuid(),
    shippingAddress: '', shippingComuna: '', shippingCity: '', warehouseId: '', notes: '',
    items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
  });

  const load = () => {
    setLoading(true);
    Promise.all([ordersApi.getOrders(), inventoryApi.getProducts(), inventoryApi.getWarehouses()])
      .then(([oRes, pRes, wRes]) => {
        const ws = wRes.data || [];
        setOrders(oRes.data || []);
        setProducts(pRes.data || []);
        setWarehouses(ws);
        setForm((prev) => ({ ...prev, warehouseId: prev.warehouseId || ws[0]?.id || '' }));
      })
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', productName: '', quantity: 1, unitPrice: 0 }] });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) { items[i].productName = prod.name; items[i].unitPrice = parseFloat(prod.price); }
    }
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedWarehouse = warehouses.find((w) => w.id === form.warehouseId);
      const normalizedAddress = [form.shippingAddress, form.shippingComuna, form.shippingCity]
        .filter(Boolean)
        .join(', ');
      const notes = [form.notes, selectedWarehouse ? `Bodega: ${selectedWarehouse.name}` : '']
        .filter(Boolean)
        .join(' | ');

      await ordersApi.createOrder({
        ...form,
        customerId: form.customerId || buildUuid(),
        shippingAddress: normalizedAddress,
        notes,
      });
      toast.success('Pedido creado');
      setShowModal(false);
      setForm({
        customerName: '', customerEmail: '', customerId: buildUuid(),
        shippingAddress: '', shippingComuna: '', shippingCity: '', warehouseId: warehouses[0]?.id || '', notes: '',
        items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
      });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success(`Estado actualizado: ${status}`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const total = form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>Procesamiento de Pedidos</h2><p>Gestión y trazabilidad de órdenes</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Pedido</button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>N° Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Pago</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin pedidos aún</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.orderNumber}</strong></td>
                    <td>{o.customerName}<br /><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{o.customerEmail}</span></td>
                    <td>${Number(o.totalAmount).toLocaleString('es-CL')}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status]?.cls || 'badge-gray'}`}>{STATUS_BADGE[o.status]?.label || o.status}</span></td>
                    <td><span className={`badge ${PAY_BADGE[o.paymentStatus]?.cls || 'badge-gray'}`}>{PAY_BADGE[o.paymentStatus]?.label || o.paymentStatus}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString('es-CL')}</td>
                    <td>
                      {o.status === 'PENDING' && <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1d4ed8', marginRight: 4 }} onClick={() => handleStatus(o.id, 'VALIDATED')}>Validar</button>}
                      {o.status === 'VALIDATED' && <button className="btn btn-sm btn-success" onClick={() => handleStatus(o.id, 'APPROVED')}>Aprobar</button>}
                      {o.status === 'APPROVED' && <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#166534' }} onClick={() => handleStatus(o.id, 'PROCESSING')}>Procesar</button>}
                      {!['CANCELLED', 'DELIVERED'].includes(o.status) && (
                        <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => handleStatus(o.id, 'CANCELLED')}>Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>Nuevo Pedido</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Nombre cliente *</label>
                  <input required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email cliente</label>
                  <input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección de envío</label>
                <input value={form.shippingAddress} onChange={e => setForm({...form, shippingAddress: e.target.value})} placeholder="Calle y número" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Comuna</label>
                  <input value={form.shippingComuna} onChange={e => setForm({...form, shippingComuna: e.target.value})} placeholder="Ej. Providencia" />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input value={form.shippingCity} onChange={e => setForm({...form, shippingCity: e.target.value})} placeholder="Ej. Santiago" />
                </div>
              </div>
              <div className="form-group">
                <label>Bodega</label>
                <select value={form.warehouseId} onChange={e => setForm({...form, warehouseId: e.target.value})}>
                  <option value="">Seleccionar bodega...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ margin: '1rem 0 0.5rem', fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Productos</span>
                <button type="button" className="btn btn-sm" style={{ background: '#f1f5f9' }} onClick={addItem}>+ Agregar</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Producto</label>
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString('es-CL')}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Cantidad</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Precio unit.</label>
                    <input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value))} required />
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                Total: ${total.toLocaleString('es-CL')}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

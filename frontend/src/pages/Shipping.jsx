import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryApi, ordersApi, shippingApi } from '../services/api';

const STATUS_MAP = {
  PENDING:           { cls: 'badge-gray',   label: 'Pendiente' },
  PICKED_UP:         { cls: 'badge-blue',   label: 'Recogido' },
  IN_TRANSIT:        { cls: 'badge-blue',   label: 'En tránsito' },
  OUT_FOR_DELIVERY:  { cls: 'badge-yellow', label: 'En reparto' },
  DELIVERED:         { cls: 'badge-green',  label: 'Entregado' },
  FAILED:            { cls: 'badge-red',    label: 'Fallido' },
};

const NEXT_STATUS = {
  PENDING: 'PICKED_UP', PICKED_UP: 'IN_TRANSIT', IN_TRANSIT: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

export default function Shipping() {
  const [shipments, setShipments] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingOrderData, setLoadingOrderData] = useState(false);
  const [form, setForm] = useState({
    orderNumber: '',
    orderId: '',
    productId: '',
    warehouseId: '',
    carrier: 'Starken',
    originAddress: '',
    originComuna: '',
    originCity: '',
    destinationAddress: '',
    destinationComuna: '',
    destinationCity: '',
    weight: '',
    estimatedDelivery: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([shippingApi.getShipments(), inventoryApi.getProducts(), inventoryApi.getWarehouses(), ordersApi.getOrders()])
      .then(([shipmentsRes, productsRes, warehousesRes, ordersRes]) => {
        const productsData = productsRes.data || [];
        const warehousesData = warehousesRes.data || [];
        const ordersData = ordersRes.data || [];
        setShipments(shipmentsRes.data || []);
        setProducts(productsData);
        setWarehouses(warehousesData);
        setOrders(ordersData);
        setForm((prev) => ({
          ...prev,
          orderNumber: prev.orderNumber || ordersData[0]?.orderNumber || '',
          orderId: prev.orderId || ordersData[0]?.id || '',
          productId: prev.productId || productsData[0]?.id || '',
          warehouseId: prev.warehouseId || warehousesData[0]?.id || '',
        }));
      })
      .catch(() => toast.error('Error al cargar envíos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const parseAddressParts = (address = '') => {
    const parts = String(address).split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return {
        address: parts.slice(0, parts.length - 2).join(', '),
        comuna: parts[parts.length - 2],
        city: parts[parts.length - 1],
      };
    }
    if (parts.length === 2) return { address: parts[0], comuna: '', city: parts[1] };
    return { address: parts[0] || '', comuna: '', city: '' };
  };

  const applyWarehouseToOrigin = (warehouseId) => {
    const selected = warehouses.find((w) => w.id === warehouseId);
    if (!selected) return;
    const parsed = parseAddressParts(selected.location || '');
    setForm((prev) => ({
      ...prev,
      warehouseId,
      originAddress: parsed.address || selected.name || prev.originAddress,
      originComuna: parsed.comuna || prev.originComuna,
      originCity: parsed.city || prev.originCity,
    }));
  };

  const inferWarehouseByProduct = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return warehouses[0]?.id || '';
    const stocks = product.stocks || [];
    if (stocks.length === 0) return warehouses[0]?.id || '';
    const best = [...stocks].sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0];
    return best?.warehouseId || warehouses[0]?.id || '';
  };

  const autofillFromOrder = async () => {
    const orderNumber = form.orderNumber?.trim();
    const directOrderId = form.orderId?.trim();
    if (!orderNumber && !directOrderId) {
      toast.error('Ingresa N° pedido o ID de pedido');
      return;
    }
    setLoadingOrderData(true);
    try {
      let resolvedOrderId = directOrderId;
      if (!resolvedOrderId && orderNumber) {
        const found = orders.find((o) => o.orderNumber === orderNumber);
        if (!found) {
          toast.error('N° de pedido no encontrado');
          return;
        }
        resolvedOrderId = found.id;
      }

      const res = await ordersApi.getOrder(resolvedOrderId);
      const order = res.data;
      if (!order) {
        toast.error('Pedido no encontrado');
        return;
      }

      const firstItem = order.items?.[0];
      const productId = firstItem?.productId || '';
      const inferredWarehouseId = productId ? inferWarehouseByProduct(productId) : (warehouses[0]?.id || '');
      const destination = parseAddressParts(order.shippingAddress || '');

      setForm((prev) => ({
        ...prev,
        orderId: order.id || resolvedOrderId,
        orderNumber: order.orderNumber || prev.orderNumber,
        productId: productId || prev.productId,
        warehouseId: inferredWarehouseId || prev.warehouseId,
        destinationAddress: destination.address || prev.destinationAddress,
        destinationComuna: destination.comuna || prev.destinationComuna,
        destinationCity: destination.city || prev.destinationCity,
      }));

      if (inferredWarehouseId) applyWarehouseToOrigin(inferredWarehouseId);
      toast.success('Pedido cargado y formulario autocompletado');
    } catch (err) {
      toast.error(err.message || 'No se pudo cargar el pedido');
    } finally {
      setLoadingOrderData(false);
    }
  };

  const handleTrack = async () => {
    if (!trackInput.trim()) return;
    try {
      const res = await shippingApi.track(trackInput.trim());
      setTrackResult(res.data);
    } catch { toast.error('Número de tracking no encontrado'); setTrackResult(null); }
  };

  const handleAdvance = async (id, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await shippingApi.updateStatus(id, next);
      toast.success(`Estado avanzado a: ${STATUS_MAP[next]?.label}`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        originAddress: [form.originAddress, form.originComuna, form.originCity].filter(Boolean).join(', '),
        destinationAddress: [form.destinationAddress, form.destinationComuna, form.destinationCity].filter(Boolean).join(', '),
      };
      await shippingApi.createShipment(payload);
      toast.success('Envío creado');
      setShowModal(false);
      setForm({
        orderNumber: orders[0]?.orderNumber || '',
        orderId: orders[0]?.id || '',
        productId: products[0]?.id || '',
        warehouseId: warehouses[0]?.id || '',
        carrier: 'Starken',
        originAddress: '',
        originComuna: '',
        originCity: '',
        destinationAddress: '',
        destinationComuna: '',
        destinationCity: '',
        weight: '',
        estimatedDelivery: '',
      });
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>Coordinación de Envíos</h2><p>Tracking y gestión de despachos</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Envío</button>
      </div>

      {/* Tracking público */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>🔍 Rastrear Envío</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input style={{ flex: 1, padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: 8 }}
            placeholder="Número de tracking (ej. SL-1234567890-1234)"
            value={trackInput} onChange={e => setTrackInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()} />
          <button className="btn btn-primary" onClick={handleTrack}>Rastrear</button>
        </div>
        {trackResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
            <strong>Tracking: {trackResult.trackingNumber}</strong><br />
            <span>Transportista: {trackResult.carrier}</span><br />
            <span>Estado: <span className={`badge ${STATUS_MAP[trackResult.status]?.cls}`}>{STATUS_MAP[trackResult.status]?.label}</span></span><br />
            {trackResult.estimatedDelivery && <span>Entrega estimada: {new Date(trackResult.estimatedDelivery).toLocaleDateString('es-CL')}</span>}
          </div>
        )}
      </div>

      {/* Lista de envíos */}
      <div className="card">
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Tracking</th><th>Pedido</th><th>Producto</th><th>Bodega</th><th>Transportista</th><th>Estado</th><th>Entrega Est.</th><th>Peso</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {shipments.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin envíos registrados</td></tr>
                ) : shipments.map(s => (
                  <tr key={s.id}>
                    <td><code style={{ fontSize: '0.78rem' }}>{s.trackingNumber}</code></td>
                    <td style={{ fontSize: '0.8rem' }}>{orders.find((o) => o.id === s.orderId)?.orderNumber || (s.orderId?.slice(0, 8) + '...')}</td>
                    <td style={{ fontSize: '0.8rem' }}>{s.productId ? s.productId.slice(0, 8) : '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{s.warehouseId ? s.warehouseId.slice(0, 8) : '—'}</td>
                    <td>{s.carrier}</td>
                    <td><span className={`badge ${STATUS_MAP[s.status]?.cls || 'badge-gray'}`}>{STATUS_MAP[s.status]?.label || s.status}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('es-CL') : '—'}</td>
                    <td>{s.weight ? `${s.weight} kg` : '—'}</td>
                    <td>
                      {NEXT_STATUS[s.status] && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAdvance(s.id, s.status)}>
                          → {STATUS_MAP[NEXT_STATUS[s.status]]?.label}
                        </button>
                      )}
                      {s.status !== 'FAILED' && s.status !== 'DELIVERED' && (
                        <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }}
                          onClick={() => shippingApi.updateStatus(s.id, 'FAILED').then(() => { toast.success('Marcado como fallido'); load(); }).catch(e => toast.error(e.message))}>
                          Fallido
                        </button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nuevo Envío</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>N° Pedido (ORD-...)</label>
                <select value={form.orderNumber} onChange={e => {
                  const selected = orders.find((o) => o.orderNumber === e.target.value);
                  setForm({ ...form, orderNumber: e.target.value, orderId: selected?.id || '' });
                }}>
                  <option value="">Seleccionar pedido...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>{o.orderNumber} — {o.customerName || 'Sin nombre'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ID del Pedido (interno)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                  <input required value={form.orderId} onChange={e => setForm({...form, orderId: e.target.value})} placeholder="UUID del pedido" />
                  <button type="button" className="btn btn-sm" style={{ background: '#dbeafe', color: '#1d4ed8' }} onClick={autofillFromOrder} disabled={loadingOrderData}>
                    {loadingOrderData ? 'Cargando...' : 'Autocompletar'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Producto (ID)</label>
                  <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}>
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bodega de Origen</label>
                  <select value={form.warehouseId} onChange={e => applyWarehouseToOrigin(e.target.value)}>
                    <option value="">Seleccionar bodega...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.location || 'sin ubicación'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Transportista</label>
                  <select value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})}>
                    <option>Starken</option><option>Chilexpress</option><option>DHL</option><option>BlueExpress</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="0.0" />
                </div>
              </div>
              <div className="form-group">
                <label>Origen</label>
                <input value={form.originAddress} onChange={e => setForm({...form, originAddress: e.target.value})} placeholder="Bodega de origen" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Comuna origen</label>
                  <input value={form.originComuna} onChange={e => setForm({...form, originComuna: e.target.value})} placeholder="Ej. Pudahuel" />
                </div>
                <div className="form-group">
                  <label>Ciudad origen</label>
                  <input value={form.originCity} onChange={e => setForm({...form, originCity: e.target.value})} placeholder="Ej. Santiago" />
                </div>
              </div>
              <div className="form-group">
                <label>Destino</label>
                <input value={form.destinationAddress} onChange={e => setForm({...form, destinationAddress: e.target.value})} placeholder="Dirección del cliente" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Comuna destino</label>
                  <input value={form.destinationComuna} onChange={e => setForm({...form, destinationComuna: e.target.value})} placeholder="Ej. Ñuñoa" />
                </div>
                <div className="form-group">
                  <label>Ciudad destino</label>
                  <input value={form.destinationCity} onChange={e => setForm({...form, destinationCity: e.target.value})} placeholder="Ej. Santiago" />
                </div>
              </div>
              <div className="form-group">
                <label>Entrega estimada</label>
                <input type="date" value={form.estimatedDelivery} onChange={e => setForm({...form, estimatedDelivery: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Envío</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

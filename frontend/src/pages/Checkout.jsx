import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { paymentApi, ordersApi } from '../services/api';

/**
 * Página de Checkout — integra con el Payment Service.
 * Soporta Stripe (PaymentIntent) y MercadoPago (redirect).
 */
export default function Checkout() {
  const [step, setStep] = useState(1); // 1=datos, 2=procesando, 3=resultado
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [form, setForm] = useState({
    orderNumber: '',
    orderId: '',
    customerName: '',
    customerEmail: '',
    amount: '',
    description: 'Pedido SmartLogix',
    provider: 'stripe',
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoadingOrders(true);
    ordersApi.getOrders()
      .then((res) => {
        const list = res.data || [];
        setOrders(list);
        if (list.length > 0) {
          const first = list[0];
          setForm((prev) => ({
            ...prev,
            orderNumber: first.orderNumber || '',
            orderId: first.id || '',
            customerName: first.customerName || '',
            customerEmail: first.customerEmail || '',
            amount: Math.round(Number(first.totalAmount || 0)).toString(),
            description: first.orderNumber ? `Pedido ${first.orderNumber}` : prev.description,
          }));
        }
      })
      .catch(() => toast.error('No se pudieron cargar los pedidos para autocompletar pago'))
      .finally(() => setLoadingOrders(false));
  }, []);

  const selectOrder = (orderNumber) => {
    const selected = orders.find((o) => o.orderNumber === orderNumber);
    if (!selected) {
      setForm((prev) => ({ ...prev, orderNumber, orderId: '' }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      orderNumber: selected.orderNumber || '',
      orderId: selected.id || '',
      customerName: selected.customerName || '',
      customerEmail: selected.customerEmail || '',
      amount: Math.round(Number(selected.totalAmount || 0)).toString(),
      description: selected.orderNumber ? `Pedido ${selected.orderNumber}` : prev.description,
    }));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.amount) {
      toast.error('ID de pedido y monto son requeridos');
      return;
    }
    setStep(2);
    try {
      const res = await paymentApi.createIntent({
        orderId: form.orderId,
        amount: parseInt(form.amount),
        description: form.description,
      });

      setResult(res.data);

      // Si es MercadoPago, redirigir al checkout
      if (res.data.checkoutUrl) {
        toast.success('Redirigiendo a MercadoPago...');
        setTimeout(() => window.open(res.data.sandboxUrl || res.data.checkoutUrl, '_blank'), 1500);
      }

      // Actualizar estado del pedido a APPROVED (simulado para Stripe en sandbox)
      if (res.data.paymentId && form.orderId) {
        try {
          await ordersApi.confirmPayment(form.orderId, {
            paymentId: res.data.paymentId,
            paymentStatus: 'PAID',
          });
        } catch (_) { /* silencioso si el pedido no existe */ }
      }

      setStep(3);
    } catch (err) {
      toast.error(err.message);
      setStep(1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    setForm({
      orderNumber: '',
      orderId: '',
      customerName: '',
      customerEmail: '',
      amount: '',
      description: 'Pedido SmartLogix',
      provider: 'stripe',
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Pasarela de Pago</h2>
        <p>Integración con Stripe y MercadoPago</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Selector de proveedor */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>Proveedor de Pago</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[
              { id: 'stripe', name: '💳 Stripe', desc: 'PaymentIntent + Card Element' },
              { id: 'mercadopago', name: '🔵 MercadoPago', desc: 'Preference + Redirect' },
            ].map(p => (
              <div key={p.id}
                onClick={() => setForm({...form, provider: p.id})}
                style={{
                  flex: 1, padding: '1rem', borderRadius: 8, border: `2px solid ${form.provider === p.id ? '#2563eb' : '#e2e8f0'}`,
                  cursor: 'pointer', background: form.provider === p.id ? '#eff6ff' : 'white',
                  transition: 'all 0.2s',
                }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef9c3', borderRadius: 8, fontSize: '0.8rem', color: '#854d0e' }}>
            ⚠️ <strong>Modo sandbox:</strong> Configura las variables de entorno en <code>.env</code> para usar claves reales.
            Proveedor activo según <code>PAYMENT_PROVIDER</code> en el servidor.
          </div>
        </div>

        {/* Step 1: Formulario */}
        {step === 1 && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Datos del Pago</h3>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label>N° Pedido</label>
                <select value={form.orderNumber} onChange={e => selectOrder(e.target.value)} disabled={loadingOrders}>
                  <option value="">{loadingOrders ? 'Cargando pedidos...' : 'Seleccionar pedido...'}</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.orderNumber} — {o.customerName || 'Sin nombre'} — ${Math.round(Number(o.totalAmount || 0)).toLocaleString('es-CL')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ID del Pedido *</label>
                <input required value={form.orderId} onChange={e => setForm({...form, orderId: e.target.value})} placeholder="UUID del pedido (de la sección Pedidos)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Nombre del cliente</label>
                  <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Nombre completo" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="cliente@email.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Monto (CLP) *</label>
                <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="ej. 15990" />
                {form.amount && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>= ${parseInt(form.amount || 0).toLocaleString('es-CL')} CLP</span>}
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              {/* Resumen */}
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Subtotal</span>
                  <span>${parseInt(form.amount || 0).toLocaleString('es-CL')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
                  <span>IVA (19%)</span>
                  <span>${Math.round(parseInt(form.amount || 0) * 0.19).toLocaleString('es-CL')}</span>
                </div>
                <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span style={{ color: '#2563eb' }}>${Math.round(parseInt(form.amount || 0) * 1.19).toLocaleString('es-CL')}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
                🔒 Procesar Pago con {form.provider === 'stripe' ? 'Stripe' : 'MercadoPago'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Procesando */}
        {step === 2 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h3>Procesando pago...</h3>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Comunicándose con {form.provider === 'stripe' ? 'Stripe' : 'MercadoPago'}</p>
          </div>
        )}

        {/* Step 3: Resultado */}
        {step === 3 && result && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#16a34a' }}>¡Intención de pago creada!</h3>
            <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f0fdf4', borderRadius: 8, textAlign: 'left', fontSize: '0.85rem' }}>
              <div><strong>Proveedor:</strong> {result.provider}</div>
              <div><strong>Payment ID:</strong> <code>{result.paymentId}</code></div>
              <div><strong>Estado:</strong> {result.status}</div>
              {result.clientSecret && <div><strong>Client Secret:</strong> <code style={{ fontSize: '0.75rem' }}>{result.clientSecret?.slice(0, 30)}...</code></div>}
              {result.checkoutUrl && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a href={result.sandboxUrl || result.checkoutUrl} target="_blank" rel="noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    → Abrir checkout MercadoPago (sandbox)
                  </a>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleReset}>Nuevo Pago</button>
          </div>
        )}
      </div>
    </div>
  );
}

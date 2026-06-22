import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../services/api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '', capacity: 1000 });
  const [stockForm, setStockForm] = useState({ warehouseId: '', productId: '', quantity: '' });

  const load = () => {
    setLoading(true);
    Promise.all([inventoryApi.getWarehouses(), inventoryApi.getProducts()])
      .then(([wRes, pRes]) => {
        const ws = wRes.data || [];
        const ps = pRes.data || [];
        setWarehouses(ws);
        setProducts(ps);
        setStockForm((prev) => ({
          warehouseId: prev.warehouseId || ws[0]?.id || '',
          productId: prev.productId || ps[0]?.id || '',
          quantity: prev.quantity,
        }));
      })
      .catch((err) => toast.error(err.message || 'Error al cargar bodegas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const warehouseStats = useMemo(() => {
    return warehouses.map((w) => {
      let totalUnits = 0;
      let productsWithStock = 0;
      for (const p of products) {
        const qty = (p.stocks || [])
          .filter((s) => s.warehouseId === w.id)
          .reduce((acc, s) => acc + Number(s.quantity || 0), 0);
        if (qty > 0) productsWithStock += 1;
        totalUnits += qty;
      }
      return { ...w, totalUnits, productsWithStock };
    });
  }, [warehouses, products]);

  const selectedWarehouseProducts = useMemo(() => {
    if (!stockForm.warehouseId) return [];
    return products.map((p) => {
      const qty = (p.stocks || [])
        .filter((s) => s.warehouseId === stockForm.warehouseId)
        .reduce((acc, s) => acc + Number(s.quantity || 0), 0);
      return { id: p.id, name: p.name, sku: p.sku, unit: p.unit, quantity: qty };
    });
  }, [products, stockForm.warehouseId]);

  const createWarehouse = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.createWarehouse({
        name: warehouseForm.name,
        location: warehouseForm.location,
        capacity: Number(warehouseForm.capacity || 0),
      });
      toast.success('Bodega creada');
      setCreating(false);
      setWarehouseForm({ name: '', location: '', capacity: 1000 });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateStock = async (e) => {
    e.preventDefault();
    if (!stockForm.warehouseId || !stockForm.productId || stockForm.quantity === '') {
      toast.error('Debes seleccionar bodega, producto y cantidad');
      return;
    }

    try {
      await inventoryApi.updateStock(stockForm.productId, {
        warehouseId: stockForm.warehouseId,
        quantity: Number(stockForm.quantity),
      });
      toast.success('Stock actualizado');
      setStockForm((prev) => ({ ...prev, quantity: '' }));
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteWarehouse = async (warehouse) => {
    if (!confirm(`¿Eliminar bodega "${warehouse.name}"?`)) return;
    try {
      await inventoryApi.deleteWarehouse(warehouse.id);
      toast.success('Bodega eliminada');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Bodegas</h2>
          <p>Gestión de bodegas y stock por bodega</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nueva Bodega</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Ajustar Stock por Bodega</h3>
        <form onSubmit={updateStock}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Bodega</label>
              <select value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Producto</label>
              <select value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Cantidad</label>
              <input type="number" min="0" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Guardar</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Resumen de Bodegas</h3>
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Ubicación</th><th>Capacidad</th><th>Productos con stock</th><th>Unidades totales</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {warehouseStats.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin bodegas registradas</td></tr>
                ) : warehouseStats.map((w) => (
                  <tr key={w.id}>
                    <td><strong>{w.name}</strong></td>
                    <td>{w.location || '—'}</td>
                    <td>{w.capacity || 0}</td>
                    <td><span className="badge badge-blue">{w.productsWithStock}</span></td>
                    <td><span className="badge badge-green">{w.totalUnits}</span></td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteWarehouse(w)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Detalle de Stock por Bodega</h3>
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>SKU</th><th>Producto</th><th>Cantidad</th><th>Unidad</th></tr>
              </thead>
              <tbody>
                {selectedWarehouseProducts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Selecciona una bodega</td></tr>
                ) : selectedWarehouseProducts.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{p.unit || 'und'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Bodega</h3>
            <form onSubmit={createWarehouse}>
              <div className="form-group">
                <label>Nombre *</label>
                <input required value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input value={warehouseForm.location} onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Capacidad</label>
                <input type="number" min="0" value={warehouseForm.capacity} onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#f1f5f9' }} onClick={() => setCreating(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Bodega</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

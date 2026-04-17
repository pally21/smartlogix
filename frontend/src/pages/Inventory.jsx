import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../services/api';

const TYPES = ['physical', 'digital', 'perishable'];
const TYPE_LABELS = { physical: 'Físico', digital: 'Digital', perishable: 'Perecedero' };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', price: '', type: 'physical', minStock: 5, description: '',
    warehouseId: '', stockQuantity: '',
  });

  const resetForm = () => {
    setForm({
      name: '', sku: '', category: '', price: '', type: 'physical', minStock: 5, description: '',
      warehouseId: warehouses[0]?.id || '', stockQuantity: '',
    });
    setEditingProduct(null);
  };

  const load = () => {
    setLoading(true);
    Promise.all([inventoryApi.getProducts(), inventoryApi.getWarehouses()])
      .then(([productsRes, warehousesRes]) => {
        const wh = warehousesRes.data || [];
        setProducts(productsRes.data || []);
        setWarehouses(wh);
        setForm((prev) => ({ ...prev, warehouseId: prev.warehouseId || wh[0]?.id || '' }));
      })
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    const defaultWarehouseId = product.stocks?.[0]?.warehouseId || warehouses[0]?.id || '';
    const stockForWarehouse = product.stocks?.find((s) => s.warehouseId === defaultWarehouseId)?.quantity ?? '';
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      price: product.price || '',
      type: product.type || 'physical',
      minStock: product.minStock ?? 5,
      description: product.description || '',
      warehouseId: defaultWarehouseId,
      stockQuantity: stockForWarehouse,
    });
    setShowModal(true);
  };

  const handleWarehouseChange = (warehouseId) => {
    const stockForWarehouse = editingProduct?.stocks?.find((s) => s.warehouseId === warehouseId)?.quantity ?? '';
    setForm((prev) => ({ ...prev, warehouseId, stockQuantity: stockForWarehouse }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: form.price,
        type: form.type,
        minStock: form.minStock,
        description: form.description,
      };

      let productId = editingProduct?.id;
      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, payload);
      } else {
        const created = await inventoryApi.createProduct(payload);
        productId = created.data?.id;
      }

      if (productId && form.warehouseId && form.stockQuantity !== '') {
        await inventoryApi.updateStock(productId, {
          warehouseId: form.warehouseId,
          quantity: Number(form.stockQuantity),
        });
      }

      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado exitosamente');
      setShowModal(false);
      resetForm();
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await inventoryApi.deleteProduct(id);
      toast.success('Producto eliminado');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const getTotalStock = (product) =>
    (product.stocks || []).reduce((t, s) => t + (s.quantity || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Gestión de Inventario</h2>
          <p>Productos, stock y bodegas</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Nuevo Producto</button>
      </div>

      <div className="card">
        {loading ? <div className="loading">Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Tipo</th><th>Precio</th><th>Stock Total</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin productos. Agrega el primero.</td></tr>
                ) : products.map(p => {
                  const stock = getTotalStock(p);
                  const isLow = stock <= p.minStock;
                  return (
                    <tr key={p.id}>
                      <td><code style={{ fontSize: '0.8rem' }}>{p.sku}</code></td>
                      <td><strong>{p.name}</strong><br /><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.description?.slice(0,40)}</span></td>
                      <td>{p.category}</td>
                      <td><span className="badge badge-blue">{TYPE_LABELS[p.type] || p.type}</span></td>
                      <td>${Number(p.price).toLocaleString('es-CL')}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-red' : 'badge-green'}`}>{stock} {p.unit}</span>
                        {isLow && <span style={{ fontSize: '0.7rem', color: '#dc2626', display: 'block' }}>⚠ Stock bajo</span>}
                      </td>
                      <td><span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>{p.isActive ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1d4ed8', marginRight: 6 }} onClick={() => openEditModal(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombre del producto" />
                </div>
                <div className="form-group">
                  <label>SKU (opcional)</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Auto-generado si vacío" />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="ej. Electrónica" />
                </div>
                <div className="form-group">
                  <label>Precio (CLP) *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock mínimo</label>
                  <input type="number" min="0" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descripción opcional" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Bodega para stock</label>
                  <select value={form.warehouseId} onChange={e => handleWarehouseChange(e.target.value)}>
                    <option value="">Seleccionar bodega...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock en bodega</label>
                  <input type="number" min="0" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})} placeholder="ej. 20" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => { setShowModal(false); resetForm(); }} style={{ background: '#f1f5f9' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

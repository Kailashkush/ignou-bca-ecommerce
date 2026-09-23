/**
 * Catalogue maintenance: create, edit, restock and withdraw products.
 * The create/edit form is a modal over the table so the administrator keeps
 * their place in the list.
 */
import { useCallback, useEffect, useState } from 'react';
import { adminApi, catalogApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Pagination from '../../components/Pagination';
import { formatCurrency, onImageError } from '../../utils/format';

const EMPTY_FORM = {
  title: '', description: '', brand: '', price: '', mrp: '',
  category: '', stockCount: '', imageUrl: '',
};

export default function AdminProducts() {
  const toast = useToast();

  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | product object
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [formDetails, setFormDetails] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogApi.listProducts({ page, limit: 12, q: search || undefined });
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { catalogApi.listCategories().then(setCategories).catch(() => {}); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, category: categories[0]?._id || '' });
    setEditing('new');
    setFormError(null);
    setFormDetails([]);
  };

  const openEdit = (product) => {
    setForm({
      title: product.title,
      description: product.description || '',
      brand: product.brand || '',
      price: String(product.price),
      mrp: product.mrp ? String(product.mrp) : '',
      category: product.category?._id || product.category || '',
      stockCount: String(product.stockCount),
      imageUrl: product.imageUrl || '',
    });
    setEditing(product);
    setFormError(null);
    setFormDetails([]);
  };

  const closeForm = () => { setEditing(null); setForm(EMPTY_FORM); };

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFormDetails([]);

    try {
      // Numeric fields are converted before they leave the browser; sending a
      // string would fail the API's integer validation.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        brand: form.brand.trim() || undefined,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : null,
        category: form.category,
        stockCount: Number(form.stockCount),
        imageUrl: form.imageUrl.trim() || undefined,
      };

      if (editing === 'new') {
        await adminApi.createProduct(payload);
        toast.success('Product created.');
      } else {
        await adminApi.updateProduct(editing._id, payload);
        toast.success('Product updated.');
      }

      closeForm();
      await load();
    } catch (err) {
      setFormError(err.message);
      setFormDetails(err.details || []);
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (product) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Withdraw "${product.title}" from the catalogue?`)) return;
    try {
      await adminApi.deleteProduct(product._id);
      toast.success('Product withdrawn.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const restock = async (product) => {
    // eslint-disable-next-line no-alert
    const input = window.prompt(`New stock level for "${product.title}"`, String(product.stockCount));
    if (input === null) return;

    const value = Number(input);
    if (!Number.isInteger(value) || value < 0) {
      toast.error('Enter a whole number of zero or more.');
      return;
    }

    try {
      await adminApi.setStock(product._id, value);
      toast.success(`Stock set to ${value}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="toolbar">
        <div>
          <h2 style={{ marginBottom: 2 }}>Products</h2>
          <p className="muted small" style={{ margin: 0 }}>{result.pagination.total} active items</p>
        </div>

        <div className="row wrap">
          <input
            className="input"
            style={{ width: 230 }}
            placeholder="Search the catalogue"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search products"
          />
          <button type="button" className="btn" onClick={openCreate}>+ New product</button>
        </div>
      </div>

      <Alert message={error} onDismiss={() => setError(null)} />

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <img src={product.imageUrl || '/placeholder.svg'} alt="" onError={onImageError}
                          style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="cell-title">{product.title}</div>
                          <div className="small muted">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="small">{product.category?.name || '—'}</td>
                    <td className="nowrap">{formatCurrency(product.price)}</td>
                    <td>
                      <span className={`badge ${product.stockCount === 0 ? 'badge-danger'
                        : product.stockCount <= 5 ? 'badge-warning' : 'badge-success'}`}>
                        {product.stockCount}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 5 }}>
                        <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => restock(product)}>Stock</button>
                        <button type="button" className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(product)}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => withdraw(product)} style={{ color: 'var(--danger-600)' }}>
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages}
            onChange={setPage} />
        </>
      )}

      {/* --- Create / edit modal ------------------------------------------- */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editing === 'new' ? 'New product' : 'Edit product'}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
            display: 'grid', placeItems: 'center', padding: 16, zIndex: 80, overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="panel" style={{ width: '100%', maxWidth: 620, margin: 'auto' }}>
            <div className="row-between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{editing === 'new' ? 'New product' : 'Edit product'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}
                aria-label="Close">×</button>
            </div>

            <Alert message={formError} details={formDetails} onDismiss={() => setFormError(null)} />

            <form onSubmit={save}>
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="ftitle">Title</label>
                  <input id="ftitle" className="input" value={form.title} onChange={update('title')}
                    required minLength={3} maxLength={140} />
                </div>

                <div className="field full">
                  <label htmlFor="fdesc">Description</label>
                  <textarea id="fdesc" className="textarea" value={form.description}
                    onChange={update('description')} required minLength={10} maxLength={4000} />
                </div>

                <div className="field">
                  <label htmlFor="fbrand">Brand</label>
                  <input id="fbrand" className="input" value={form.brand} onChange={update('brand')} />
                </div>

                <div className="field">
                  <label htmlFor="fcat">Category</label>
                  <select id="fcat" className="select" value={form.category}
                    onChange={update('category')} required>
                    <option value="">Select a category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="fprice">Selling price (₹)</label>
                  <input id="fprice" type="number" className="input" value={form.price}
                    onChange={update('price')} min={1} step={1} required />
                </div>

                <div className="field">
                  <label htmlFor="fmrp">MRP (₹)</label>
                  <input id="fmrp" type="number" className="input" value={form.mrp}
                    onChange={update('mrp')} min={1} step={1} />
                  <div className="hint">Optional — used to show a discount.</div>
                </div>

                <div className="field">
                  <label htmlFor="fstock">Stock count</label>
                  <input id="fstock" type="number" className="input" value={form.stockCount}
                    onChange={update('stockCount')} min={0} step={1} required />
                </div>

                <div className="field">
                  <label htmlFor="fimg">Image URL</label>
                  <input id="fimg" type="url" className="input" value={form.imageUrl}
                    onChange={update('imageUrl')} placeholder="https://…" />
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Saving…' : editing === 'new' ? 'Create product' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

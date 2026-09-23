/** Category maintenance. */
import { useCallback, useEffect, useState } from 'react';
import { adminApi, catalogApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';

export default function AdminCategories() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await catalogApi.listCategories());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCategory({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      setForm({ name: '', description: '' });
      toast.success('Category created.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
    try {
      await adminApi.deleteCategory(category._id);
      toast.success('Category deleted.');
      await load();
    } catch (err) {
      // The server refuses while products still reference the category; the
      // message explains exactly how many, so it is surfaced verbatim.
      setError(err.message);
    }
  };

  return (
    <section>
      <h2>Categories</h2>
      <Alert message={error} onDismiss={() => setError(null)} />

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3 className="panel-title">Add a category</h3>
        <form onSubmit={create}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cname">Name</label>
              <input id="cname" className="input" value={form.name} required minLength={2} maxLength={60}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="cdesc">Description</label>
              <input id="cdesc" className="input" value={form.description} maxLength={300}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn" disabled={saving || !form.name.trim()}>
            {saving ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th><th>Slug</th><th>Description</th><th>Products</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td className="cell-title">{category.name}</td>
                  <td><code className="small">{category.slug}</code></td>
                  <td className="small muted">{category.description || '—'}</td>
                  <td><span className="badge">{category.productCount}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-ghost btn-sm"
                      onClick={() => remove(category)}
                      disabled={category.productCount > 0}
                      title={category.productCount > 0
                        ? 'Move or withdraw its products first'
                        : 'Delete this category'}
                      style={{ color: category.productCount > 0 ? undefined : 'var(--danger-600)' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

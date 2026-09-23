/** Customer account administration: search, review and activate/deactivate. */
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers({
        page, limit: 15, q: query || undefined, role: role || undefined,
      });
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, role]);

  useEffect(() => {
    // Debounce the search so a request is not fired on every keystroke.
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleStatus = async (account) => {
    try {
      await adminApi.setUserStatus(account.id, !account.isActive);
      toast.success(`Account ${account.isActive ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="toolbar">
        <div>
          <h2 style={{ marginBottom: 2 }}>Customers</h2>
          <p className="muted small" style={{ margin: 0 }}>{result.pagination.total} account(s)</p>
        </div>

        <div className="row wrap">
          <input
            className="input"
            style={{ width: 230 }}
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Search customers"
          />
          <select className="select" style={{ width: 'auto' }} value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <Alert message={error} onDismiss={() => setError(null)} />

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th><th>Registered</th><th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((account) => {
                  const isSelf = account.id === currentUser.id;
                  return (
                    <tr key={account.id}>
                      <td className="cell-title">
                        {account.name}
                        {isSelf && <span className="badge badge-brand" style={{ marginLeft: 7 }}>You</span>}
                      </td>
                      <td className="small">{account.email}</td>
                      <td>
                        <span className={`badge ${account.role === 'admin' ? 'badge-brand' : ''}`}>
                          {account.role}
                        </span>
                      </td>
                      <td className="small nowrap">{formatDate(account.createdAt)}</td>
                      <td>
                        <span className={`badge ${account.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {account.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(account)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot change your own account status' : undefined}
                        >
                          {account.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages}
            onChange={setPage} />
        </>
      )}
    </section>
  );
}

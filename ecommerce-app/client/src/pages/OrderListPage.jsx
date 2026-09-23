/** Order history for the signed-in customer. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/endpoints';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate, statusTone } from '../utils/format';

export default function OrderListPage() {
  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1 } });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    orderApi.listMine({ page, limit: 10 })
      .then((data) => { if (!cancelled) setResult(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page]);

  if (loading) return <div className="container"><Loader label="Loading your orders…" /></div>;

  return (
    <div className="container">
      <h1>My orders</h1>
      <Alert message={error} onDismiss={() => setError(null)} />

      {result.items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="You have not placed any orders yet"
          message="Once you buy something it will appear here."
          action={<Link to="/products" className="btn">Browse products</Link>}
        />
      ) : (
        <>
          <div className="stack">
            {result.items.map((order) => (
              <article className="panel" key={order._id}>
                <div className="row-between wrap" style={{ marginBottom: 14 }}>
                  <div>
                    <div className="small muted">Invoice</div>
                    <div className="strong" style={{ fontFamily: 'monospace' }}>{order.invoiceNo}</div>
                  </div>
                  <div>
                    <div className="small muted">Placed on</div>
                    <div className="strong">{formatDate(order.placedAt)}</div>
                  </div>
                  <div>
                    <div className="small muted">Total</div>
                    <div className="strong">{formatCurrency(order.totalPrice)}</div>
                  </div>
                  <span className={`badge ${statusTone(order.status)}`}>{order.status}</span>
                </div>

                <div className="small muted" style={{ marginBottom: 12 }}>
                  {order.items.length} item{order.items.length === 1 ? '' : 's'} —{' '}
                  {order.items.map((i) => i.title).join(', ').slice(0, 110)}
                  {order.items.map((i) => i.title).join(', ').length > 110 ? '…' : ''}
                </div>

                <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">
                  View details
                </Link>
              </article>
            ))}
          </div>

          <Pagination
            page={result.pagination.page}
            totalPages={result.pagination.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

/**
 * Fulfilment queue.
 *
 * The "next status" control is driven by the same state machine the server
 * enforces, so the administrator is only ever offered a move that will be
 * accepted rather than discovering the rule through an error message.
 */
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate, statusTone, paymentTone } from '../../utils/format';

/** Mirrors Order.ALLOWED_TRANSITIONS on the server. */
const NEXT_STATES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const toast = useToast();

  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listOrders({
        page, limit: 15, status: status === 'ALL' ? undefined : status,
      });
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const advance = async (order, nextStatus) => {
    if (nextStatus === 'CANCELLED') {
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Cancel order ${order.invoiceNo}? Stock will be returned to the catalogue.`)) {
        return;
      }
    }

    setBusyId(order._id);
    try {
      await adminApi.updateOrderStatus(order._id, nextStatus);
      toast.success(`Order ${order.invoiceNo} marked as ${nextStatus}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="toolbar">
        <div>
          <h2 style={{ marginBottom: 2 }}>Orders</h2>
          <p className="muted small" style={{ margin: 0 }}>{result.pagination.total} order(s)</p>
        </div>

        <div className="row wrap" style={{ gap: 5 }}>
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              className={`btn btn-sm ${status === option ? '' : 'btn-secondary'}`}
              onClick={() => { setStatus(option); setPage(1); }}
            >
              {option === 'ALL' ? 'All' : option}
            </button>
          ))}
        </div>
      </div>

      <Alert message={error} onDismiss={() => setError(null)} />

      {loading ? <Loader /> : result.items.length === 0 ? (
        <p className="muted">No orders match this filter.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Invoice</th><th>Customer</th><th>Placed</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th>
                  <th style={{ textAlign: 'right' }}>Move to</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((order) => (
                  <tr key={order._id}>
                    <td><code className="small">{order.invoiceNo}</code></td>
                    <td>
                      <div className="cell-title small">{order.user?.name || '—'}</div>
                      <div className="small muted">{order.user?.email}</div>
                    </td>
                    <td className="small nowrap">{formatDate(order.placedAt)}</td>
                    <td>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                    <td className="nowrap strong">{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <span className={`badge ${paymentTone(order.payment.status)}`}>
                        {order.payment.method} · {order.payment.status}
                      </span>
                    </td>
                    <td><span className={`badge ${statusTone(order.status)}`}>{order.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {NEXT_STATES[order.status].length === 0 ? (
                        <span className="small muted">—</span>
                      ) : (
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 5 }}>
                          {NEXT_STATES[order.status].map((next) => (
                            <button
                              key={next}
                              type="button"
                              className={`btn btn-sm ${next === 'CANCELLED' ? 'btn-ghost' : 'btn-secondary'}`}
                              disabled={busyId === order._id}
                              onClick={() => advance(order, next)}
                              style={next === 'CANCELLED' ? { color: 'var(--danger-600)' } : undefined}
                            >
                              {next}
                            </button>
                          ))}
                        </div>
                      )}
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
    </section>
  );
}

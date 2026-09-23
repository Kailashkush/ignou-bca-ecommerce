/** Shown for any URL that matches no route. */
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="container">
      <EmptyState
        icon="404"
        title="We could not find that page"
        message="The link may be out of date, or the page may have been moved."
        action={<Link to="/" className="btn">Go to the home page</Link>}
      />
    </div>
  );
}

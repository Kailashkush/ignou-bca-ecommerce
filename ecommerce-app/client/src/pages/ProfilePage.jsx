/** Account screen: personal details, default address and password change. */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/endpoints';
import Alert from '../components/Alert';
import { formatDate } from '../utils/format';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    line1: user?.address?.line1 || '',
    line2: user?.address?.line2 || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
    phone: user?.address?.phone || '',
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileError, setProfileError] = useState(null);
  const [profileDetails, setProfileDetails] = useState([]);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordDetails, setPasswordDetails] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const updateProfileField = (field) => (event) =>
    setProfile((current) => ({ ...current, [field]: event.target.value }));

  const updatePasswordField = (field) => (event) =>
    setPasswords((current) => ({ ...current, [field]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileDetails([]);

    try {
      // Only send the address when it has been filled in, so a partially
      // completed form does not fail the server's address validation.
      const hasAddress = profile.line1 && profile.city && profile.state
        && profile.pincode && profile.phone;

      await updateProfile({
        name: profile.name.trim(),
        ...(hasAddress ? {
          address: {
            line1: profile.line1, line2: profile.line2, city: profile.city,
            state: profile.state, pincode: profile.pincode, phone: profile.phone,
          },
        } : {}),
      });
      toast.success('Your profile has been updated.');
    } catch (err) {
      setProfileError(err.message);
      setProfileDetails(err.details || []);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirm) {
      setPasswordError('The two new passwords do not match.');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordDetails([]);

    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Your password has been changed.');
    } catch (err) {
      setPasswordError(err.message);
      setPasswordDetails(err.details || []);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>My account</h1>

      <div className="stack">
        <section className="panel">
          <h3 className="panel-title">Personal details</h3>
          <Alert message={profileError} details={profileDetails}
            onDismiss={() => setProfileError(null)} />

          <form onSubmit={saveProfile}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="pname">Full name</label>
                <input id="pname" className="input" value={profile.name}
                  onChange={updateProfileField('name')} required />
              </div>

              <div className="field">
                <label htmlFor="pemail">Email address</label>
                <input id="pemail" className="input" value={user.email} disabled />
                <div className="hint">Your email address cannot be changed.</div>
              </div>

              <div className="field full">
                <label htmlFor="pline1">Address line 1</label>
                <input id="pline1" className="input" value={profile.line1}
                  onChange={updateProfileField('line1')} placeholder="House number, street" />
              </div>

              <div className="field full">
                <label htmlFor="pline2">Address line 2</label>
                <input id="pline2" className="input" value={profile.line2}
                  onChange={updateProfileField('line2')} placeholder="Landmark, area" />
              </div>

              <div className="field">
                <label htmlFor="pcity">City</label>
                <input id="pcity" className="input" value={profile.city}
                  onChange={updateProfileField('city')} />
              </div>

              <div className="field">
                <label htmlFor="pstate">State</label>
                <input id="pstate" className="input" value={profile.state}
                  onChange={updateProfileField('state')} />
              </div>

              <div className="field">
                <label htmlFor="ppin">Pincode</label>
                <input id="ppin" className="input" value={profile.pincode}
                  onChange={updateProfileField('pincode')} inputMode="numeric" maxLength={6} />
              </div>

              <div className="field">
                <label htmlFor="pphone">Mobile number</label>
                <input id="pphone" className="input" value={profile.phone}
                  onChange={updateProfileField('phone')} inputMode="numeric" maxLength={10} />
              </div>
            </div>

            <button type="submit" className="btn" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Member since {formatDate(user.createdAt)} · Role: {user.role}
          </p>
        </section>

        <section className="panel">
          <h3 className="panel-title">Change password</h3>
          <Alert message={passwordError} details={passwordDetails}
            onDismiss={() => setPasswordError(null)} />

          <form onSubmit={savePassword}>
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="current">Current password</label>
                <input id="current" type="password" className="input"
                  value={passwords.currentPassword}
                  onChange={updatePasswordField('currentPassword')}
                  autoComplete="current-password" required />
              </div>

              <div className="field">
                <label htmlFor="newpw">New password</label>
                <input id="newpw" type="password" className="input" value={passwords.newPassword}
                  onChange={updatePasswordField('newPassword')}
                  autoComplete="new-password" required />
                <div className="hint">8+ characters with upper case, lower case and a digit.</div>
              </div>

              <div className="field">
                <label htmlFor="confirmpw">Confirm new password</label>
                <input id="confirmpw" type="password" className="input" value={passwords.confirm}
                  onChange={updatePasswordField('confirm')}
                  autoComplete="new-password" required />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

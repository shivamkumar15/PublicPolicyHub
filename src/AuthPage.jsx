import { useState } from 'react';
import LockKeyhole from 'lucide-react/dist/esm/icons/lock-keyhole.js';
import Phone from 'lucide-react/dist/esm/icons/phone.js';
import X from 'lucide-react/dist/esm/icons/x.js';

const INITIAL_FORM_STATE = {
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  otpCode: '',
};

function AuthPage({
  error,
  isSubmitting,
  logo,
  onEmailAuth,
  onGoogleAuth,
  onPhoneAuth,
}) {
  const [mode, setMode] = useState('signup');
  const [authMethod, setAuthMethod] = useState('email');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState('');
  const [localError, setLocalError] = useState('');
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [showModal, setShowModal] = useState(false);

  const isSignup = mode === 'signup';
  const combinedError = localError || error || '';

  const switchFlow = (nextMode, nextMethod) => {
    setMode(nextMode);
    setAuthMethod(nextMethod);
    setPhoneCodeSent(false);
    setPhoneStatus('');
    setLocalError('');
    setFormState((current) => ({
      ...current,
      otpCode: '',
    }));
  };

  const openModal = (type) => {
    if (type === 'signup-email') switchFlow('signup', 'email');
    else if (type === 'signup-phone') switchFlow('signup', 'phone');
    else if (type === 'login') switchFlow('login', 'email');
    setShowModal(true);
  };

  const handleDirectGoogleSignup = async () => {
    setLocalError('');
    setMode('signup');
    setAuthMethod('google');
    setPhoneCodeSent(false);
    setPhoneStatus('');
    setFormState((current) => ({
      ...current,
      otpCode: '',
    }));

    try {
      await onGoogleAuth({
        mode: 'signup',
      });
    } catch (authError) {
      setLocalError(authError.message || 'Unable to continue with Google.');
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setLocalError('');
    setPhoneCodeSent(false);
    setPhoneStatus('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLocalError('');

    if (name === 'username') {
      setFormState((current) => ({
        ...current,
        username: value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      }));
      return;
    }

    setFormState((current) => ({ ...current, [name]: value }));
  };

  const validateSignupForm = () => {
    if (authMethod !== 'google') {
      const username = normalizeUsername(formState.username);
      if (!username) return 'Choose a username.';
      if (!/^[a-z0-9_]{3,24}$/.test(username)) {
        return 'Username must be 3-24 characters (letters, numbers, underscores).';
      }
      if (!formState.displayName.trim()) return 'Enter a display name.';
    }

    if (authMethod === 'email') {
      if (!formState.email.trim()) return 'Enter your email address.';
      if (!/\S+@\S+\.\S+/.test(formState.email.trim())) return 'Enter a valid email address.';
      if (formState.password.length < 6) return 'Password must be at least 6 characters.';
      if (formState.password !== formState.confirmPassword) return 'Passwords do not match.';
    }

    if (authMethod === 'phone') {
      const phoneError = validatePhoneNumber(formState.phoneNumber);
      if (phoneError) return phoneError;
    }

    return '';
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    try {
      if (isSignup) {
        const validationError = validateSignupForm();
        if (validationError) {
          setLocalError(validationError);
          return;
        }

        await onEmailAuth({
          mode,
          username: normalizeUsername(formState.username),
          displayName: formState.displayName.trim(),
          email: formState.email.trim(),
          password: formState.password,
        });
        return;
      }

      if (!formState.email.trim()) {
        setLocalError('Enter your email address.');
        return;
      }
      if (!formState.password) {
        setLocalError('Enter your password.');
        return;
      }

      await onEmailAuth({
        mode,
        email: formState.email.trim(),
        password: formState.password,
      });
    } catch (authError) {
      setLocalError(authError.message || 'Unable to continue with email.');
    }
  };

  const handleGoogleContinue = async () => {
    setLocalError('');

    try {
      await onGoogleAuth({
        mode,
      });
    } catch (authError) {
      setLocalError(authError.message || 'Unable to continue with Google.');
    }
  };

  const handleSendPhoneCode = async () => {
    setLocalError('');

    try {
      if (isSignup) {
        const validationError = validateSignupForm();
        if (validationError) {
          setLocalError(validationError);
          return;
        }
      } else {
        const phoneError = validatePhoneNumber(formState.phoneNumber);
        if (phoneError) {
          setLocalError(phoneError);
          return;
        }
      }

      const result = await onPhoneAuth({
        action: 'send-code',
        mode,
        username: normalizeUsername(formState.username),
        displayName: formState.displayName.trim(),
        phoneNumber: formState.phoneNumber.trim(),
      });

      if (result?.otpSent) {
        setPhoneCodeSent(true);
        setPhoneStatus(`Code sent to ${formState.phoneNumber.trim()}`);
      }
    } catch (authError) {
      setLocalError(authError.message || 'Unable to send verification code.');
      setPhoneCodeSent(false);
      setPhoneStatus('');
    }
  };

  const handleVerifyPhoneCode = async () => {
    setLocalError('');

    if (!formState.otpCode.trim()) {
      setLocalError('Enter the verification code you received.');
      return;
    }

    try {
      await onPhoneAuth({
        action: 'verify-code',
        mode,
        username: normalizeUsername(formState.username),
        displayName: formState.displayName.trim(),
        phoneNumber: formState.phoneNumber.trim(),
        otpCode: formState.otpCode.trim(),
      });
      setPhoneCodeSent(false);
      setPhoneStatus('');
      setFormState((current) => ({ ...current, otpCode: '' }));
    } catch (authError) {
      setLocalError(authError.message || 'Unable to verify the code.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__grid">
        <section className="auth-page__left">
          <div className="auth-page__story motion-slide-in-left">
            <img src={logo} alt="Public Policy Hub" className="auth-page__story-logo" />
            <h2 className="auth-page__heading">India is our, we have the power.</h2>
            <h3 className="auth-page__lead">
              Join us to make India a better place and bring changes according to our comfort.
            </h3>
          </div>
        </section>

        <section className="auth-page__right">
          <div className="auth-page__right-inner auth-page__auth-card motion-slide-in-right" style={{ '--motion-delay': '120ms' }}>
            <div className="auth-page__panel-head">
              <img src={logo} alt="Public Policy Hub" className="auth-page__panel-logo" />
              <div>
                <p className="auth-page__panel-kicker">Access your civic profile</p>
                <h2 className="auth-page__subheading">
                  {isSignup ? 'Start with a verified account' : 'Welcome back'}
                </h2>
              </div>
            </div>

            <p className="auth-page__panel-text">
              Create an account to report issues, support causes, and keep your public activity connected in one place.
            </p>

            <div className="auth-page__actions">
              <ActionButton
                variant="white"
                onClick={handleDirectGoogleSignup}
                icon={<GoogleIcon />}
                text="Sign up with Google"
              />
              <ActionButton
                variant="white"
                onClick={() => openModal('signup-phone')}
                icon={<Phone className="auth-btn-icon" />}
                text="Sign up with phone"
              />

              <Divider />

              <ActionButton
                variant="primary"
                onClick={() => openModal('signup-email')}
                text="Create account"
              />
            </div>

            <div className="auth-page__signin-block">
              <h3 className="auth-page__signin-label">Account exists?</h3>
              <ActionButton
                variant="outline"
                onClick={() => openModal('login')}
                text="Log in"
              />
            </div>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="auth-overlay" onClick={closeModal}>
          <div className="auth-modal motion-pop" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__header">
              <button type="button" onClick={closeModal} className="auth-modal__close" aria-label="Close">
                <X className="auth-modal__close-icon" />
              </button>
              <img src={logo} alt="PPH" className="auth-modal__logo" />
              <div className="auth-modal__header-spacer" />
            </div>

            <div className="auth-modal__body">
              {isSignup && (
                <div className="auth-modal__brandmark">
                  <img src={logo} alt="Public Policy Hub" className="auth-modal__brandmark-logo" />
                  <span className="auth-modal__brandmark-label">Public Policy Hub</span>
                </div>
              )}

              <h2 className="auth-modal__title">
                {isSignup ? 'Create your account' : 'Sign in to PPH'}
              </h2>

              {combinedError && <Message tone="error">{combinedError}</Message>}
              {phoneStatus && <Message tone="success">{phoneStatus}</Message>}

              {authMethod === 'email' && (
                <form className="auth-modal__form" onSubmit={handleEmailSubmit}>
                  <AuthFields
                    authMethod={authMethod}
                    formState={formState}
                    handleChange={handleChange}
                    isSignup={isSignup}
                  />
                  <div className="auth-modal__actions">
                    <button type="submit" disabled={isSubmitting} className="auth-modal__btn auth-modal__btn--fill">
                      {isSubmitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
                    </button>
                  </div>
                  {!isSignup && (
                    <p className="auth-modal__switch">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        className="auth-modal__switch-link"
                        onClick={() => {
                          switchFlow('signup', 'email');
                        }}
                      >
                        Sign up
                      </button>
                    </p>
                  )}
                </form>
              )}

              {authMethod === 'google' && (
                <div className="auth-modal__form">
                  <AuthFields
                    authMethod={authMethod}
                    formState={formState}
                    handleChange={handleChange}
                    isSignup={isSignup}
                  />
                  <div className="auth-modal__actions">
                    <button type="button" onClick={handleGoogleContinue} disabled={isSubmitting} className="auth-modal__btn auth-modal__btn--fill">
                      {isSubmitting ? 'Please wait...' : isSignup ? 'Continue with Google' : 'Login with Google'}
                    </button>
                  </div>
                </div>
              )}

              {authMethod === 'phone' && (
                <div className="auth-modal__form">
                  <AuthFields
                    authMethod={authMethod}
                    formState={formState}
                    handleChange={handleChange}
                    isSignup={isSignup}
                  />
                  {phoneCodeSent && (
                    <label className="auth-field">
                      <span className="auth-field__label">Verification code</span>
                      <input
                        className="auth-field__input"
                        name="otpCode"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter OTP"
                        value={formState.otpCode}
                        onChange={handleChange}
                      />
                    </label>
                  )}
                  <div className="auth-modal__actions">
                    <button type="button" onClick={handleSendPhoneCode} disabled={isSubmitting} className="auth-modal__btn auth-modal__btn--fill">
                      {isSubmitting ? 'Please wait...' : phoneCodeSent ? 'Resend code' : 'Send code'}
                    </button>
                  </div>
                  {phoneCodeSent && (
                    <button type="button" onClick={handleVerifyPhoneCode} disabled={isSubmitting} className="auth-modal__btn auth-modal__btn--ghost auth-modal__btn--full">
                      <span className="auth-modal__btn-inner">
                        <LockKeyhole className="auth-btn-icon" />
                        {isSubmitting ? 'Verifying...' : 'Verify and enter'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="firebase-phone-recaptcha" />
    </div>
  );
}

function AuthFields({ authMethod, formState, handleChange, isSignup }) {
  return (
    <div className="auth-fields">
      {isSignup && authMethod !== 'google' && (
        <>
          <Field
            label="Username"
            name="username"
            placeholder="choose_username"
            value={formState.username}
            onChange={handleChange}
          />
          <Field
            label="Display name"
            name="displayName"
            placeholder="Your name"
            value={formState.displayName}
            onChange={handleChange}
          />
        </>
      )}

      {authMethod === 'email' && (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={formState.email}
            onChange={handleChange}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder={isSignup ? 'Create password' : 'Enter password'}
            value={formState.password}
            onChange={handleChange}
          />
          {isSignup && (
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat password"
              value={formState.confirmPassword}
              onChange={handleChange}
            />
          )}
        </>
      )}

      {authMethod === 'google' && (
        <p className="auth-modal__hint">
          {isSignup
            ? 'Continue with Google and we will use your Google name while generating a username automatically.'
            : 'Continue with the Google account linked to your profile.'}
        </p>
      )}

      {authMethod === 'phone' && (
        <Field
          label="Phone number"
          name="phoneNumber"
          type="tel"
          placeholder="+91 9876543210"
          value={formState.phoneNumber}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

function Field({ label, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>
      <input
        className="auth-field__input"
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function ActionButton({ icon = null, onClick, text, variant = 'white' }) {
  return (
    <button type="button" onClick={onClick} className={`auth-action-btn auth-action-btn--${variant} magnetic-item btn-interactive hover-lift`}>
      {icon}
      {text}
    </button>
  );
}

function Divider() {
  return (
    <div className="auth-divider">
      <div className="auth-divider__line" />
      <span className="auth-divider__label">or</span>
      <div className="auth-divider__line" />
    </div>
  );
}

function Message({ children, tone }) {
  return <div className={`auth-msg auth-msg--${tone}`}>{children}</div>;
}

function GoogleIcon() {
  return (
    <svg className="auth-btn-icon" viewBox="0 0 24 24" width="18" height="18">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function validatePhoneNumber(value) {
  const normalizedValue = `${value ?? ''}`.trim();
  if (!normalizedValue) return 'Enter your phone number.';
  if (!/^\+?[0-9\s-]{8,18}$/.test(normalizedValue)) {
    return 'Enter a valid phone number with country code.';
  }
  return '';
}

function normalizeUsername(value) {
  return `${value ?? ''}`.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
}

export default AuthPage;

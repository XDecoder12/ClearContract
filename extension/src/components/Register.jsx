
import { useState } from 'react';

function Register({ onRegistered, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setError('');
    setIsRegistering(true);

    try {
      const response = await fetch(
        'http://localhost:5001/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setPassword('');
      onRegistered();
    } catch (err) {
      console.error('Registration error:', err);
      setError('Cannot connect to the server. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div style={{
      width: '380px',
      padding: '16px',
      fontFamily: 'sans-serif'
    }}>
      <h2>Create Account</h2>

      <p>Register to save your ClearContract scans.</p>

      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px',
            marginBottom: '8px'
          }}
        />

        <input
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px',
            marginBottom: '12px'
          }}
        />

        <button
          type="submit"
          disabled={isRegistering}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          {isRegistering ? 'Registering...' : 'Register'}
        </button>
      </form>

      <button
        type="button"
        onClick={onBackToLogin}
        disabled={isRegistering}
        style={{
          marginTop: '12px',
          background: 'none',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer'
        }}
      >
        Already have an account? Log In
      </button>

      {error && (
        <p style={{ color: 'red', fontSize: '12px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Register;

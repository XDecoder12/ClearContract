function Login({
 email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  isLoggingIn,
  error,
  authMessage,
  onShowRegister
}) {
  return (
    <div style={{
      width: '380px',
      padding: '16px',
      fontFamily: 'sans-serif'
    }}>
      <h2>ClearContract AI</h2>

      <p>
        Log in to analyze contracts and save your scan history.
      </p>

      <form onSubmit={handleLogin}>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          disabled={isLoggingIn}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isLoggingIn ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <button
  type="button"
  onClick={onShowRegister}
  style={{
    marginTop: '12px',
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer'
  }}
>
  Don't have an account? Register
</button>

{authMessage && (
  <p style={{ color: 'green', fontSize: '12px' }}>
    {authMessage}
  </p>
)}
      {error && (
        <p style={{ color: 'red', fontSize: '12px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Login;

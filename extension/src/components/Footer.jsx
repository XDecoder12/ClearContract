function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-top">
        <span className="footer-version">ClearContract v1.0.0</span>

        <a
          className="footer-link"
          href="https://ai.google.dev/gemini-api"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Gemini API
        </a>
      </div>

      <div className="footer-copyright">
        © {new Date().getFullYear()} ClearContract. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        Contributions welcome on{" "}
        <a
          href="https://github.com/michaeldavie/cloudcheck-ca"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        !
      </p>
      <p>
        Disclaimer: This data is unofficial. Current assessment status should be
        confirmed with providers and{" "}
        <a
          href="https://cyber.gc.ca/"
          target="_blank"
          rel="noreferrer"
        >
          CCCS
        </a>
        .
      </p>
    </footer>
  );
}

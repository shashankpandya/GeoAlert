import Link from "next/link";

export default function Home() {
  return (
    <main
      role="main"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #010409 0%, #0d1117 50%, #010409 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#e6edf3",
        padding: "24px 16px",
      }}
    >
      {/* Globe animation */}
      <div
        aria-hidden="true"
        style={{
          fontSize: "6rem",
          lineHeight: 1,
          marginBottom: "24px",
          animation: "pulse 3s ease-in-out infinite",
          filter: "drop-shadow(0 0 24px rgba(0,212,255,0.4))",
        }}
      >
        🌍
      </div>

      <h1
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #00d4ff, #bc8cff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          marginBottom: "12px",
          letterSpacing: "-0.02em",
        }}
      >
        GeoAlert v2
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "#8b949e",
          textAlign: "center",
          maxWidth: "540px",
          lineHeight: 1.6,
          marginBottom: "40px",
        }}
      >
        Safety-first crisis response platform — real-time emergency alerts,
        offline resilience, and official source verification.
      </p>

      {/* Primary CTAs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "56px",
        }}
      >
        <Link
          href="/crisis"
          style={{
            padding: "14px 28px",
            background: "#dc2626",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
            transition: "opacity .15s",
          }}
          aria-label="Open Crisis Mode — text-only emergency view"
        >
          ⚠ Crisis Mode
        </Link>

        <Link
          href="/map"
          style={{
            padding: "14px 28px",
            background: "#1d4ed8",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
          }}
          aria-label="Open interactive alert map"
        >
          🗺 Live Map
        </Link>

        <Link
          href="/privacy"
          style={{
            padding: "14px 28px",
            background: "#161b22",
            color: "#8b949e",
            border: "1px solid #30363d",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
          }}
        >
          🔒 Privacy
        </Link>
      </div>

      {/* Feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          maxWidth: "720px",
          width: "100%",
          marginBottom: "48px",
        }}
      >
        {[
          { icon: "📡", title: "Official Sources", desc: "Verified government feeds with provenance badges" },
          { icon: "📴", title: "Works Offline", desc: "Service Worker + IndexedDB — alerts when connectivity fails" },
          { icon: "♿", title: "WCAG 2.2 AA", desc: "Keyboard nav, screen readers, 400% zoom support" },
          { icon: "🔒", title: "Privacy-first", desc: "No precise GPS stored — coarse location only" },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              background: "#161b22",
              border: "1px solid #21262d",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "4px" }}>{f.title}</div>
            <div style={{ fontSize: "0.8rem", color: "#8b949e", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Classic version link */}
      <div
        style={{
          borderTop: "1px solid #21262d",
          paddingTop: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "0.85rem", color: "#6e7681", marginBottom: "10px" }}>
          Looking for the original Earth Pulse platform?
        </p>
        <a
          href="/classic/"
          style={{
            color: "#58a6ff",
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            border: "1px solid #30363d",
            borderRadius: "6px",
            transition: "border-color .15s",
          }}
          aria-label="View the classic Earth Pulse version of GeoAlert"
        >
          🌐 View Classic Version (Earth Pulse v4)
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </main>
  );
}

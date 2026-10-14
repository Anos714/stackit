import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social preview: volt-on-black brand card with the stack mark,
 * wordmark, supported stacks and the install command.
 */
export default function OgImage() {
  return new ImageResponse(
    (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px 80px",
        backgroundColor: "#09090b",
        backgroundImage:
          "radial-gradient(600px 320px at 15% 0%, rgba(190,242,100,0.16), transparent), radial-gradient(500px 300px at 95% 100%, rgba(34,211,238,0.12), transparent)",
        color: "#f4f4f5",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width="88" height="88" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="v" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0" stopColor="#e9ffb8" />
              <stop offset="0.55" stopColor="#bef264" />
              <stop offset="1" stopColor="#84cc16" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#v)" />
          <g fill="#0b0b0d">
            <path d="M16 7 24.5 11 16 15 7.5 11Z" />
            <path d="M7.5 13.6 16 17.6 24.5 13.6 24.5 15.7 16 19.7 7.5 15.7Z" />
            <path d="M7.5 18.3 16 22.3 24.5 18.3 24.5 20.4 16 24.4 7.5 20.4Z" />
          </g>
        </svg>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>stackit</div>
      </div>

      <div style={{ marginTop: 20, fontSize: 34, color: "#bef264", fontWeight: 600 }}>
        Full-stack apps, scaffolded right.
      </div>
      <div style={{ marginTop: 12, fontSize: 24, color: "#a1a1aa" }}>
        MERN · PERN · Hono + Postgres · Go + Fiber
      </div>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#0c0c0e",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: "20px 28px",
          fontSize: 25,
          fontFamily: "monospace",
          color: "#e4e4e7",
        }}
      >
        <span style={{ color: "#bef264", marginRight: 12 }}>$</span>
        bunx create-stackit-app@latest create my-app --stack mern -y
      </div>
    </div>
    ),
    { ...size },
  );
}

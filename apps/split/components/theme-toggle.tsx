"use client";

/** Flips the theme and writes the portfolio's shared "theme" cookie. */
export function ThemeToggle() {
  const toggle = () => {
    const light = document.documentElement.classList.toggle("light");
    const domain = location.hostname.endsWith("harrychang.me")
      ? "; domain=.harrychang.me"
      : "";
    document.cookie = `theme=${light ? "light" : "dark"}; path=/${domain}; max-age=31536000`;
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-8 w-8 place-items-center rounded-full text-secondary transition-colors hover:text-primary"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M8 2a6 6 0 0 1 0 12Z" fill="currentColor" />
      </svg>
    </button>
  );
}

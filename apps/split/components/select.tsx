/**
 * A native select styled as a .field, with a quiet chevron in place of the OS
 * one. `inline` sizes it to its value, for use as a trailing unit in .field-row.
 */
export function Select({
  className = "",
  inline = false,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { inline?: boolean }) {
  return (
    <span
      className={`relative ${inline ? "block shrink-0 border-b-0" : "block"}`}
    >
      <select
        {...props}
        className={`field cursor-pointer pr-5 ${inline ? "w-auto border-b-0 text-secondary transition-colors hover:text-primary focus:text-primary" : ""} ${className}`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-0.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-secondary"
        aria-hidden
      >
        <path
          d="M1 1l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}

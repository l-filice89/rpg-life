export function AuthMotif() {
  return (
    <>
      <div className="stars pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
      <svg
        className="constellation pointer-events-none absolute top-[10%] right-[10%] h-20 w-[120px] opacity-35"
        viewBox="0 0 120 80"
        aria-hidden="true"
      >
        <line x1="20" y1="60" x2="50" y2="30" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="30" x2="85" y2="45" stroke="currentColor" strokeWidth="1" />
        <line x1="85" y1="45" x2="100" y2="15" stroke="currentColor" strokeWidth="1" />
        <circle cx="20" cy="60" r="3" fill="currentColor" />
        <circle cx="50" cy="30" r="4" className="text-accent" fill="currentColor" />
        <circle cx="85" cy="45" r="3" fill="currentColor" />
        <circle cx="100" cy="15" r="3" className="text-accent" fill="currentColor" />
      </svg>
    </>
  );
}

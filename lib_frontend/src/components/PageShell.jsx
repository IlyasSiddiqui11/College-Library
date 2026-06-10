export function PageShell({
  children,
  maxWidth = 1280,
  className = '',
}) {
  return (
    <div
      className={`mx-auto min-h-screen w-full overflow-x-auto bg-[#faf8ff] ${className}`}
      style={{ maxWidth }}
    >
      <div className="relative min-h-screen w-full">{children}</div>
    </div>
  )
}

// Centers section content and applies the shared horizontal padding/max-width.
export function Container({ className = "", children }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

const paths = {
  ocean: (
    <>
      <path d="M4 14h16l-2 4H6l-2-4Z" />
      <path d="M8 14V7h8v7" />
      <path d="M6 18c1.3 1 2.7 1 4 0 1.3-1 2.7-1 4 0 1.3 1 2.7 1 4 0" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
      <path d="M8 11h8" />
    </>
  ),
  inland: (
    <>
      <path d="M4 16V8h10l3 4h3v4" />
      <path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M14 8v4h3" />
    </>
  ),
  ground: (
    <>
      <path d="M3 15h12l2-5h4v5" />
      <path d="M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M7 9h7" />
    </>
  ),
  air: (
    <>
      <path d="M3 12h18" />
      <path d="M12 3l5 18" />
      <path d="M12 3 7 21" />
      <path d="M6 12l-2 4" />
      <path d="M18 12l2 4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  support: (
    <>
      <path d="M12 4a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1v-6H5" />
      <path d="M12 4a8 8 0 0 1 8 8v3a2 2 0 0 1-2 2h-1v-6h2" />
      <path d="M9 20h3a4 4 0 0 0 4-4" />
    </>
  )
};

export default function LogisticsIcon({ name = "support", className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-6 w-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name] ?? paths.support}
    </svg>
  );
}

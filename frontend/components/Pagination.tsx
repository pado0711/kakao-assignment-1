import Link from "next/link";

export default function Pagination({ date, filter, currentPage, totalPages }: {
  date: string; filter: string; currentPage: number; totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-6 flex justify-center gap-2" aria-label="페이지네이션">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <Link key={page} className={page === currentPage ? "page-active" : "page"} href={`/todos?date=${date}&filter=${filter}&page=${page}`}>{page}</Link>
      ))}
    </nav>
  );
}

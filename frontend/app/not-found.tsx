import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-4"><section className="card max-w-md text-center"><h1 className="text-2xl font-black">일정을 찾을 수 없어요</h1><Link className="btn-primary mt-5 inline-block" href="/todos">목록으로</Link></section></main>;
}

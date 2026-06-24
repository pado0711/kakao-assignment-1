"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card max-w-md text-center"><h1 className="text-2xl font-black">잠시 문제가 생겼어요</h1><p className="my-4 text-sm text-slate-500">할 일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><button className="btn-primary" type="button" onClick={reset}>다시 시도</button></section>
    </main>
  );
}

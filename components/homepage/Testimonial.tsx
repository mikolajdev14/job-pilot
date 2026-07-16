import Image from "next/image";

export function Testimonial() {
  return (
    <section className="mx-auto max-w-7xl border-x border-border bg-surface px-6 py-20 text-center sm:px-10 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Success stories
      </p>
      <blockquote className="mx-auto mt-6 max-w-3xl text-2xl font-semibold leading-tight text-text-dark sm:text-3xl">
        “I used to spend my evenings copy-pasting resumes. Now I open my
        dashboard to see interviews waiting. It feels like cheating. Had 3
        offers on the table simultaneously.”
      </blockquote>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Image
          src="/images/user-icon.png"
          alt="Tom Wilson"
          width={192}
          height={192}
          className="h-10 w-10 rounded-full"
        />
        <div className="text-left">
          <p className="text-sm font-semibold text-text-primary">Tom Wilson</p>
          <p className="text-xs font-normal text-text-muted">Junior Developer</p>
        </div>
      </div>
    </section>
  );
}

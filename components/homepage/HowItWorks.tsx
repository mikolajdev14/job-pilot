import Image from "next/image";

const features = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
    active: true,
  },
  {
    title: "Know the Company Before You Apply",
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
    active: false,
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear overview of every job you've found, tailored. Your activity and progress stay in one simple place.",
    active: false,
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:px-10 lg:py-12">
      <div className="app-panel flex flex-col justify-center rounded-xl p-6 sm:p-10 lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Built for focus</p>
        <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-4xl">
          Manage Your Job Search With Ease
        </h2>
        <ul className="mt-8 space-y-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className={`rounded-lg border px-4 py-5 ${feature.active ? "border-border-muted bg-surface-tertiary" : "border-transparent bg-surface-secondary"}`}
            >
              <h3 className="text-base font-semibold leading-6 text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 max-w-lg text-base font-normal leading-6 text-text-secondary">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="app-panel flex items-center justify-center overflow-hidden rounded-xl p-4 sm:p-6 lg:p-8">
        <Image
          src="/images/jobs-lists.png"
          alt="Job list showing companies, match scores, salary estimates, and sources"
          width={2364}
          height={1778}
          className="dashboard-image h-auto w-full max-w-xl rounded-lg"
        />
      </div>
    </section>
  );
}

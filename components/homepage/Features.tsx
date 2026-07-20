import Image from "next/image";

const features = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what's missing and what fits.",
    active: false,
  },
  {
    title: "AI-Powered Job Matching",
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
    active: true,
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sifting and more time applying.",
    active: false,
  },
];

export function Features() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:px-10 lg:py-12">
      <div className="app-panel flex items-center justify-center overflow-hidden rounded-xl p-4 sm:order-first sm:p-6 lg:p-8">
        <Image
          src="/images/agnet-log.png"
          alt="JobPilot agent log showing job matching and resume preparation steps"
          width={2144}
          height={1656}
          className="dashboard-image h-auto w-full max-w-xl rounded-lg"
        />
      </div>
      <div className="app-panel flex flex-col justify-center rounded-xl p-6 sm:p-10 lg:p-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Smarter decisions</p>
        <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-4xl">
          Apply With More Confidence, Every Time
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
    </section>
  );
}

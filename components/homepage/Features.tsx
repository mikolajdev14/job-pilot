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
    <section className="mx-auto grid max-w-7xl border-x border-border bg-surface sm:grid-cols-2">
      <div className="flex items-center justify-center border-t border-border bg-background p-8 sm:order-first sm:border-r sm:p-12 lg:p-16">
        <Image
          src="/images/agnet-log.png"
          alt="JobPilot agent log showing job matching and resume preparation steps"
          width={2144}
          height={1656}
          className="h-auto w-full max-w-xl"
        />
      </div>
      <div className="flex flex-col justify-center border-t border-border p-8 sm:p-12 lg:p-16">
        <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-4xl">
          Apply With More Confidence, Every Time
        </h2>
        <ul className="mt-10">
          {features.map((feature) => (
            <li
              key={feature.title}
              className={`border-t border-border py-6 ${feature.active ? "border-l-2 border-l-success pl-5" : "pl-0"}`}
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

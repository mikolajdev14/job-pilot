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
    <section className="mx-auto grid max-w-7xl border-x border-border bg-surface sm:grid-cols-2">
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
        <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-text-black sm:text-4xl">
          Manage Your Job Search With Ease
        </h2>
        <ul className="mt-10">
          {features.map((feature) => (
            <li
              key={feature.title}
              className={`border-t border-border py-6 ${feature.active ? "border-l-2 border-l-accent pl-5" : "pl-0"}`}
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
      <div className="flex items-center justify-center border-t border-border bg-background p-8 sm:border-l sm:p-12 lg:p-16">
        <Image
          src="/images/jobs-lists.png"
          alt="Job list showing companies, match scores, salary estimates, and sources"
          width={2364}
          height={1778}
          className="h-auto w-full max-w-xl"
        />
      </div>
    </section>
  );
}

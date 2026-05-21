import Link from "next/link";
import {
  AirplaneTiltIcon,
  ArrowRightIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ConfettiIcon,
  CurrencyCircleDollarIcon,
  GithubLogoIcon,
  HeartIcon,
  HouseIcon,
  LockKeyIcon,
  MoonStarsIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ReceiptIcon,
    title: "Log expenses in seconds",
    body: "Record who paid, who added it, the amount, and a short note. Done.",
  },
  {
    icon: UsersThreeIcon,
    title: "Groups for every crew",
    body: "Trips, roommates, families — make as many groups as you need and keep them separate.",
  },
  {
    icon: CalculatorIcon,
    title: "Smart settle-up",
    body: "A greedy algorithm computes the fewest possible transfers to square the group.",
  },
  {
    icon: CurrencyCircleDollarIcon,
    title: "Multi-currency",
    body: "Pick the right currency per group. Amounts render with the proper symbol — ₹, $, €, £.",
  },
  {
    icon: LockKeyIcon,
    title: "Lock when the trip ends",
    body: "Owners can lock a group as read-only so nobody fiddles with closed books.",
  },
  {
    icon: MoonStarsIcon,
    title: "Light & dark theme",
    body: "Looks great at the bar, at the cafe, or at 2 a.m. on the couch.",
  },
];

const USE_CASES = [
  {
    icon: AirplaneTiltIcon,
    title: "Trips & holidays",
    body: "Someone books the hotel, another covers dinner, a third rents the car. Splitty keeps the running tab.",
  },
  {
    icon: HouseIcon,
    title: "Flatmates & roommates",
    body: "Groceries, utilities, that one big delivery, the new vacuum cleaner — without spreadsheets.",
  },
  {
    icon: ConfettiIcon,
    title: "Friends & meetups",
    body: "One person tabs out at the bar; everyone settles up the next morning instead of \"sort it out later.\"",
  },
  {
    icon: HeartIcon,
    title: "Couples & families",
    body: "Keep a running tab on who paid for what without awkward conversations or screenshots of Notes apps.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Make a group",
    body: "Spin up a new group for your trip, flat, or friend circle. Pick the currency.",
  },
  {
    num: "02",
    title: "Invite people",
    body: "Add members by email. Anyone already on Splitty hops right in.",
  },
  {
    num: "03",
    title: "Log expenses",
    body: "As life happens, drop in who paid, the amount, and a note. Edit anytime.",
  },
  {
    num: "04",
    title: "Settle up",
    body: "Open Settle Up and Splitty shows the smallest set of transfers that zeroes everyone out.",
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Features />
        <UseCases />
        <HowItWorks />
        <FinalCTA />
      </main>
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="Splitty home"
          className="hover:opacity-80"
        >
          <Logo markClassName="size-6" wordmarkClassName="text-sm" />
        </Link>
        <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#use-cases" className="hover:text-foreground">
            Use cases
          </a>
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/auth/sign-in" />}
          >
            Sign in
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/auth/sign-up" />}
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
      >
        <div className="absolute -top-32 left-1/2 size-144 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-72 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20 md:py-28">
        <span className="inline-flex items-center gap-1.5 border border-border bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <SparkleIcon weight="fill" className="size-3 text-primary" />
          Self-hostable & open source
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Split your expenses,
          <span className="block text-primary">not your friendships.</span>
        </h1>
        <p className="max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
          Splitty is a lightweight, no-frills web app for tracking shared
          expenses in a group and figuring out the simplest way to settle up.
          Made for trips, flatmates, friend groups, and families who&apos;d
          rather spend less time on math and more time together.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button
            className="h-11 px-5 text-sm"
            nativeButton={false}
            render={<Link href="/auth/sign-up" />}
          >
            Get started — it&apos;s free
            <ArrowRightIcon weight="bold" />
          </Button>
          <Button
            variant="outline"
            className="h-11 px-5 text-sm"
            nativeButton={false}
            render={<Link href="/auth/sign-in" />}
          >
            I already have an account
          </Button>
        </div>
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon weight="fill" className="size-3 text-primary" />
            No credit card
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon weight="fill" className="size-3 text-primary" />
            Free forever
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon weight="fill" className="size-3 text-primary" />
            Open source (AGPL v3)
          </span>
        </p>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  const people = [
    { name: "Aanya", paid: 1850, balance: 720, owed: true },
    { name: "Rohan", paid: 1200, balance: 70, owed: true },
    { name: "Maya", paid: 400, balance: -350, owed: false },
    { name: "Kabir", paid: 100, balance: -440, owed: false },
  ];

  return (
    <div className="mt-6 grid w-full max-w-4xl gap-4 sm:mt-10 md:grid-cols-5">
      <div className="md:col-span-3 bg-card text-card-foreground ring-1 ring-foreground/10">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5" />
            <span className="font-heading text-xs font-semibold">
              Goa Trip · April
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            ₹ INR
          </span>
        </div>
        <ul className="divide-y divide-border/60 text-left">
          {[
            { who: "Aanya", what: "Hotel — 2 nights", amount: 1800 },
            { who: "Rohan", what: "Dinner @ Curlies", amount: 1200 },
            { who: "Aanya", what: "Cab from airport", amount: 50 },
            { who: "Maya", what: "Snacks & water", amount: 400 },
            { who: "Kabir", what: "Beach umbrella", amount: 100 },
          ].map((row) => (
            <li
              key={`${row.who}-${row.what}`}
              className="flex items-center justify-between px-4 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.what}</p>
                <p className="text-[11px] text-muted-foreground">
                  Paid by {row.who}
                </p>
              </div>
              <span className="font-mono tabular-nums">
                ₹{row.amount.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card text-card-foreground ring-1 ring-foreground/10 md:col-span-2">
        <div className="border-b border-border/60 px-4 py-3 text-left">
          <p className="font-heading text-xs font-semibold">Settle up</p>
          <p className="text-[11px] text-muted-foreground">
            3 transfers settle the group
          </p>
        </div>
        <ul className="divide-y divide-border/60 text-left">
          {[
            { from: "Kabir", to: "Aanya", amount: 440 },
            { from: "Maya", to: "Aanya", amount: 280 },
            { from: "Maya", to: "Rohan", amount: 70 },
          ].map((t) => (
            <li
              key={`${t.from}-${t.to}`}
              className="flex items-center justify-between px-4 py-2.5 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{t.from}</span>
                <ArrowRightIcon weight="bold" className="size-3 text-muted-foreground" />
                <span className="font-medium">{t.to}</span>
              </div>
              <span className="font-mono tabular-nums text-primary">
                ₹{t.amount}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 px-4 py-2.5 text-left">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Balances
          </p>
          <ul className="mt-1 space-y-0.5 text-[11px]">
            {people.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between"
              >
                <span>{p.name}</span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    p.owed ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {p.owed ? "+" : ""}₹{Math.abs(p.balance)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
      <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </span>
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="border-b border-border/60 bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="What it does"
          title="Just enough to settle up, nothing more"
          description="No social feed, no chat, no subscription. Just the bits you actually use when money gets messy."
        />
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-2 bg-background p-5 sm:p-6"
            >
              <Icon
                weight="duotone"
                className="size-7 text-primary"
                aria-hidden
              />
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section
      id="use-cases"
      className="border-b border-border/60 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Who it's for"
          title="Built for the small, recurring money moments"
          description="If you've ever ended a trip with a screenshot of a Notes-app tally and a vague promise to sort it out later — yeah, that's the problem we solve."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {USE_CASES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group flex items-start gap-4 bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40 sm:p-6"
            >
              <div className="grid size-10 shrink-0 place-items-center bg-primary/10 text-primary">
                <Icon weight="duotone" className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how"
      className="border-b border-border/60 bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps from chaos to square"
          description="Splitty handles the math so the group doesn't have to."
        />
        <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.num}
              className="relative flex flex-col gap-3 bg-background p-5 ring-1 ring-foreground/10 sm:p-6"
            >
              <span className="font-heading text-3xl font-bold text-primary/30">
                {step.num}
              </span>
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {step.body}
              </p>
              {i < STEPS.length - 1 ? (
                <ArrowRightIcon
                  weight="bold"
                  aria-hidden
                  className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-border lg:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-10 max-w-3xl bg-background p-5 ring-1 ring-foreground/10 sm:p-6">
          <div className="flex items-center gap-2">
            <CalculatorIcon
              weight="duotone"
              className="size-5 text-primary"
              aria-hidden
            />
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              The math, in plain English
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Splitty sums every expense, divides equally to find each
            person&apos;s fair share, computes{" "}
            <span className="font-mono text-foreground">paid − share</span> per
            member, then greedily pairs the largest creditor with the largest
            debtor until everyone is within half a cent of zero. The result is
            typically O(n) transfers instead of the naive O(n²).
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden bg-card p-8 text-center ring-1 ring-foreground/10 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <ShieldCheckIcon
            weight="duotone"
            aria-hidden
            className="mx-auto size-10 text-primary"
          />
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Stop owing each other vibes.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Make your first group in under a minute. Bring the rest of the
            crew when you&apos;re ready.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              className="h-11 px-5 text-sm"
              nativeButton={false}
              render={<Link href="/auth/sign-up" />}
            >
              Create your account
              <ArrowRightIcon weight="bold" />
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-5 text-sm"
              nativeButton={false}
              render={
                <a
                  href="https://github.com/Arkapravo-Ghosh/splitty"
                  target="_blank"
                  rel="noreferrer noopener"
                />
              }
            >
              <GithubLogoIcon weight="bold" />
              Star on GitHub
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CalendarCheck, CheckCircle2, Linkedin, PiggyBank, Sparkles, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClarioBrand } from "./clario-brand";
import { ProductPreview } from "./product-preview";
import { MetricsChapter, OrganizationChapter, WorkflowChapter } from "./cinematic-chapters";
import { audiences, trustItems } from "./sample-data";

export function LandingPageContent() {
  const { scrollYProgress } = useScroll();
  return <div className="min-h-screen overflow-x-hidden bg-background text-foreground"><motion.div style={{ scaleX: scrollYProgress }} className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-primary" /><LandingNav /><CinematicHero /><TrustStrip /><AudienceStrip /><OrganizationChapter /><WorkflowChapter /><MetricsChapter /><FeatureBand /><FounderStory /><FinalCallToAction /><LandingFooter /></div>;
}

function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", y => setScrolled(y > 40));
  return <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled ? "border-navy-foreground/10 bg-navy/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}><nav aria-label="Primary navigation" className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6"><Link to="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ClarioBrand dark /></Link><div className="flex items-center gap-1 sm:gap-2"><Button asChild variant="ghost" size="sm" className="text-navy-foreground/70 hover:bg-navy-foreground/10 hover:text-navy-foreground"><Link to="/auth">Sign in</Link></Button><Button asChild size="sm" className="shadow-lhana"><Link to="/auth">Start free</Link></Button></div></nav></header>;
}

function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const rotateX = useTransform(scrollYProgress, [0, .8], reduce ? [0, 0] : [12, 0]);
  const rotateY = useTransform(scrollYProgress, [0, .8], reduce ? [0, 0] : [-7, 0]);
  const scale = useTransform(scrollYProgress, [0, .8], reduce ? [1, 1] : [.82, 1]);
  const y = useTransform(scrollYProgress, [0, .8], reduce ? [0, 0] : [70, 0]);
  return <section ref={sectionRef} className="relative min-h-[920px] overflow-hidden bg-navy text-navy-foreground lg:min-h-[145vh]"><div aria-hidden="true" className="pointer-events-none absolute inset-0"><div className="absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-primary/18 blur-3xl" /><div className="absolute -right-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-lhana-soft/8 blur-3xl" /><div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-navy to-transparent" /></div><div className="mx-auto flex min-h-[920px] max-w-6xl flex-col items-center px-4 pb-16 pt-32 text-center lg:sticky lg:top-0 lg:h-screen lg:min-h-[760px] lg:justify-center lg:pt-24"><motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Money and your day, finally connected</motion.p><h1 className="relative z-10 font-display text-5xl font-bold leading-[.95] sm:text-7xl lg:text-8xl"><span className="block text-navy-foreground">Your money.</span><span className="block text-navy-foreground/55">Your day.</span><span className="block text-primary">Sorted.</span></h1><p className="relative z-10 mx-auto mt-6 max-w-2xl text-sm leading-7 text-navy-foreground/60 sm:text-lg">The AI-powered app that connects your finances and daily planning in one place.</p><div className="relative z-20 mt-7 flex flex-col items-center gap-3 sm:flex-row"><Button asChild size="lg" className="min-w-44 shadow-lhana"><Link to="/auth">Start for free <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="min-w-44 border-navy-foreground/15 bg-navy-foreground/5 text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"><a href="#story">See how it works</a></Button></div><motion.div style={{ rotateX, rotateY, scale, y, transformPerspective: 1300 }} className="relative z-10 mt-12 w-full max-w-4xl origin-top lg:mt-10"><ProductPreview /></motion.div><p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-navy-foreground/30">Illustrative sample data</p></div></section>;
}

function TrustStrip() {
  return <section className="border-b border-border bg-background py-6" aria-label="Clario product highlights"><div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-5 gap-y-2 px-4">{trustItems.map((item, i) => <span key={item} className="flex items-center gap-4 text-xs text-muted-foreground sm:text-sm"><span>{item}</span>{i < trustItems.length - 1 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary/40" />}</span>)}</div></section>;
}

function AudienceStrip() {
  const loop = [...audiences, ...audiences];
  return <section id="story" className="overflow-hidden border-b border-border bg-background py-5" aria-label="Who Clario is for"><motion.div className="flex w-max whitespace-nowrap motion-reduce:translate-x-0" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }}>{loop.map((word, i) => <span key={`${word}-${i}`} className="mx-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{word}<span className="ml-6 text-primary/50">·</span></span>)}</motion.div></section>;
}

const features = [
  { icon: Wallet, title: "Expense Tracking", copy: "Log income and expenses in seconds. Every rupee accounted for." },
  { icon: PiggyBank, title: "Budget Management", copy: "Set limits, track progress, get alerted before you overspend." },
  { icon: CalendarCheck, title: "Daily Planner", copy: "Plan your day with a built-in calendar. Tasks that connect to your goals." },
  { icon: Sparkles, title: "AI Insights", copy: "Clario reads your month and tells you exactly what to do next." },
] as const;

function FeatureBand() {
  return <section className="bg-primary-soft px-5 py-24 sm:py-32"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Simple by design</p><h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Everything you need, nothing you don't</h2></div><div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, copy }) => <article key={title} className="bg-background p-6"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div></div></section>;
}

function FounderStory() {
  return <section className="bg-background px-5 py-24 sm:py-32"><div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1fr_.8fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Why Clario exists</p><h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">Built to make the everyday feel clear.</h2><blockquote className="mt-6 text-base leading-8 text-muted-foreground">“I got tired of switching between to-do apps and banking tools just to keep my finances and my day straight. So I built Clario — one app that connects your money and your tasks, with AI that ties it all together.”</blockquote></div><div className="border-l-2 border-primary pl-6"><img src="/arun.jpg" alt="Arun Sundhar N" className="h-48 w-36 rounded-2xl object-cover shadow-elevated" /><p className="mt-5 font-display text-xl font-semibold">Arun Sundhar N</p><p className="mt-1 text-sm text-muted-foreground">Founder & Creator of Clario</p><a href="https://linkedin.com/in/arun-sundhar-n-6aba50249" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Linkedin className="h-4 w-4" /> Connect on LinkedIn</a></div></div></section>;
}

function FinalCallToAction() {
  return <section className="bg-background px-4 pb-24"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-navy px-6 py-20 text-center text-navy-foreground shadow-cinematic sm:px-10"><div aria-hidden="true" className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-primary/25 blur-3xl" /><div className="relative"><h2 className="font-display text-4xl font-bold sm:text-6xl">Take control of your money and your day.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-navy-foreground/60 sm:text-base">Join thousands organizing their money and time with Clario.</p><Button asChild size="lg" className="mt-8 shadow-lhana"><Link to="/auth">Start for free <ArrowRight /></Link></Button><p className="mt-6 flex items-center justify-center gap-2 text-xs text-navy-foreground/45"><CheckCircle2 className="h-4 w-4 text-primary" /> Free forever · No credit card</p></div></div></section>;
}

function LandingFooter() {
  return <footer className="border-t border-border bg-background px-4 py-10"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row"><ClarioBrand /><nav aria-label="Legal" className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground"><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link><Link to="/terms" className="hover:text-foreground">Terms</Link><a href="mailto:myclario.help@gmail.com" className="hover:text-foreground">myclario.help@gmail.com</a></nav><p className="text-xs text-muted-foreground">© 2026 Clario. All rights reserved.</p></div></footer>;
}
import { Cta } from "../components/Cta";
import { Faq } from "../components/Faq";
import { Features } from "../components/Features";
import { Hero } from "../components/Hero";
import { StackTabs } from "../components/StackTabs";
import { Workflow } from "../components/Workflow";

export default function Home() {
  return (
    <>
      <Hero />
      <StackTabs />
      <Features />
      <Workflow />
      <Faq />
      <Cta />
    </>
  );
}

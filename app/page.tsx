import { Hero } from "./_components/hero";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { UniversesShelf } from "./_components/universes-shelf";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <UniversesShelf />
      </main>
      <SiteFooter />
    </div>
  );
}

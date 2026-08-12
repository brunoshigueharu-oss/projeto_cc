import { Hero } from "./_components/hero";
import { UniversesShelf } from "./_components/universes-shelf";
import { getHeroBanners } from "./_data-access/get-hero-banners";

export default async function Home() {
  const banners = await getHeroBanners();

  return (
    <>
      <Hero banners={banners} />
      <UniversesShelf />
    </>
  );
}

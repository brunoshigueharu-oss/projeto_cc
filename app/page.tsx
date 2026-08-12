import { FeaturedBooksShelf } from "./_components/featured-books-shelf";
import { Hero } from "./_components/hero";
import { getHeroBanners } from "./_data-access/get-hero-banners";

export default async function Home() {
  const banners = await getHeroBanners();

  return (
    <>
      <Hero banners={banners} />
      <FeaturedBooksShelf />
    </>
  );
}

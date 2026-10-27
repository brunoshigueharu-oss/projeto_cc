import { FeaturedBooksShelf } from "./_components/featured-books-shelf";
import { Hero } from "./_components/hero";
import { getHeroBanners } from "./_data-access/get-hero-banners";

export default async function Home() {
  const banners = await getHeroBanners();

  return (
    <>
      {/* O hero é só vídeo; o H1 existe para leitor de tela e buscadores. */}
      <h1 className="sr-only">Hocus Pocus — editora de livros ilustrados</h1>
      <Hero banners={banners} />
      <FeaturedBooksShelf />
    </>
  );
}

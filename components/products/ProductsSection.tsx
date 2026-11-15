import ProductsExplorer from "./ProductsExplorer";

// The section shares the page's white canvas — card separation comes from the
// card's own border and shadow, not from a tinted band behind the grid.
export default function ProductsSection({ limit }: { limit?: number }) {
  return (
    <section
      id="selection"
      className="mt-10 scroll-mt-24 py-12 lg:mt-14 lg:scroll-mt-28 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ProductsExplorer limit={limit} />
      </div>
    </section>
  );
}

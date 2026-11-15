import ProductSheet from "@/components/products/ProductSheet";
import { productById, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = productById(id);
  // A stale link must not blank the shop: the sheet simply does not open and
  // the standalone route answers with the real 404.
  if (!product) return null;
  return <ProductSheet product={product} />;
}

import { permanentRedirect } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

export default function ProductsSlugRedirect({ params }: Props) {
  permanentRedirect(`/product/${params.slug}`);
}

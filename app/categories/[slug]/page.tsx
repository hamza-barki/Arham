import { permanentRedirect } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

export default function CategoriesSlugRedirect({ params }: Props) {
  permanentRedirect(`/category/${params.slug}`);
}

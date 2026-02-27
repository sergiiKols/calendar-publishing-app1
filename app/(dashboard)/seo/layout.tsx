/**
 * Layout для SEO страницы
 * Отключает static generation на уровне layout
 */

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function SeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

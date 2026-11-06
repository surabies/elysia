import { MenuPage } from "@/components/layout/index"

export default async function ProgresMenuPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const { path } = await params
  const href = path?.length ? `/progres/${path.join("/")}` : "/progres"

  return <MenuPage href={href} />
}

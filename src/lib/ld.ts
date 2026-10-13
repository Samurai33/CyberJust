// Ajudantes de JSON-LD.
export function trilhaLd(site: URL | undefined, itens: { nome: string; href: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.nome, item: new URL(i.href, site).href })),
  };
}

// Comportamentos pequenos do site, por delegação no documento (o documento persiste com o ClientRouter,
// então cada ouvinte é registrado uma única vez).
import './contador';

// Menu do celular (<details>): fecha ao tocar fora, ao apertar Esc e ao navegar.
const fecharMenus = (exceto?: Element | null) => {
  for (const m of document.querySelectorAll<HTMLDetailsElement>('details[data-menu][open]')) {
    if (m !== exceto) m.open = false;
  }
};
document.addEventListener('click', (ev) => fecharMenus((ev.target as Element).closest('details[data-menu]')));
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  const aberto = document.querySelector<HTMLDetailsElement>('details[data-menu][open]');
  if (!aberto) return;
  aberto.open = false;
  aberto.querySelector('summary')?.focus();
});
document.addEventListener('astro:after-swap', () => fecharMenus());

// Compartilhar: folha nativa do sistema (iPhone, iPad, Android, Mac) ou copia o link.
document.addEventListener('click', async (ev) => {
  const botao = (ev.target as Element).closest<HTMLButtonElement>('[data-compartilhar]');
  if (!botao) return;
  const dados = { title: botao.dataset['titulo'] ?? document.title, url: new URL(botao.dataset['url'] ?? location.pathname, location.origin).href };
  const texto = botao.querySelector('[data-texto]');
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(dados))) {
      await navigator.share(dados);
      return;
    }
    await navigator.clipboard.writeText(dados.url);
    if (texto) {
      const antes = texto.textContent;
      texto.textContent = 'Link copiado';
      setTimeout(() => (texto.textContent = antes), 2000);
    }
  } catch (e) {
    // AbortError = a pessoa fechou a folha de compartilhar.
    if (!(e instanceof DOMException && e.name === 'AbortError') && texto) texto.textContent = 'Não foi possível compartilhar';
  }
});

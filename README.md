# 🧠 CyberJustiça Brasil

Plataforma experimental de visualização de dados jurídicos com foco em transparência, acessibilidade e cibergovernança.

![CyberJustiça Preview](https://github.com/Samurai33/v0-cyberjustica/assets/banner-preview.png)

---

## 🔧 Tecnologias Utilizadas

[![Next.js](https://img.shields.io/badge/-Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PNPM](https://img.shields.io/badge/-PNPM-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

---

## 📦 Instalação Rápida

```bash
git clone https://github.com/Samurai33/v0-cyberjustica.git
cd v0-cyberjustica
pnpm install
cp .env.example .env
pnpm dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## 📁 Estrutura

```
├── app/               # Rotas (Next App Router)
├── components/        # Componentes reutilizáveis (UI moderna)
├── public/            # Assets estáticos
├── tailwind.config.ts # Estilização utilitária
├── next.config.mjs    # Configuração Next.js
└── ...
```

---

## 🚀 Scripts Disponíveis

| Comando        | Descrição                             |
|----------------|-----------------------------------------|
| `pnpm dev`     | Inicia o ambiente de desenvolvimento   |
| `pnpm build`   | Compila para produção                  |
| `pnpm start`   | Inicia o servidor em modo produção     |
| `pnpm lint`    | Executa o linter                       |
| `pnpm preview` | Visualiza o build localmente (porta 4000) |

---

## 🛠️ Contribuindo

Pull requests são bem-vindos! Para grandes mudanças, por favor abra uma issue antes para discutir o que deseja modificar.

1. Fork este repositório
2. Crie uma branch com sua feature (`git checkout -b feature/nome`)
3. Commit suas alterações (`git commit -m 'feat: nova feature'`)
4. Push para o branch (`git push origin feature/nome`)
5. Abra um Pull Request

---

## ✅ TODO

- [x] Estrutura com App Router
- [ ] Autenticação segura
- [ ] Dashboard administrativo
- [ ] API pública documentada
- [ ] Testes automatizados

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

Feito com ❤️ por [@Samurai33](https://github.com/Samurai33)

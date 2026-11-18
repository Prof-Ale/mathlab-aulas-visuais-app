# MathLab v2.0, Fase 4: catálogo de avatares do Prof. Alê Chocolate

Base de comparação: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase4` (hashes em `MANIFESTO_HASHES_pre_v2_fase4.txt`).
Dados persistidos (`data/projects.json`) não foram tocados. Pré-requisito: Fases 1 a 3.
Fonte das regras: Manual Visual 4.0 (família 01, personagem pedagógico).

## Novo
- `public/avatars/`: 7 PNGs com fundo transparente verificado (canal alfa), até 1100 px.
- `src/avatars/avatarCatalog.js`: catálogo (família, pose, usos, `approved`, `transparent`, `qaPending`), regra de sugestão e leitura para exportação, que confere assinatura PNG e canal alfa.
- `tests/avatarCatalog.test.js`: 6 testes.
- Rotas: `GET /api/avatars`, `POST /api/avatars/suggest`; `/api/export` aceita `avatarId`.
- Exportação: o avatar entra na capa de HTML (imagem embutida) e de DOCX (imagem real, com texto alternativo). PPTX, Markdown e SVG ainda não recebem avatar.
- Interface (aba Exportação): caixa para incluir o avatar, sugestão com o motivo e escolha da pose.

## Recorte dos 3 PNGs com quadriculado desenhado
Comemorador (troféu), Comemorador (conquista) e Pensador tinham o xadrez de transparência desenhado na imagem. O recorte removeu só regiões neutras conectadas à borda ou bolsões de xadrez fechados (vãos das alças do troféu), protegeu linhas finas e conferiu 0% de transparência dentro do logotipo da camiseta. Rosto, camiseta e logotipo não foram modificados. Os originais continuam com você.

## Regra de sugestão (do manual)
Capa: Confiante. Demais finalidades: tipo de documento primeiro (lista de exercícios: Comemorador; ensaio, estudo e artigo: Pensador; recuperação e formação: Acolhedor; apresentação: tablet), depois área (Filosofia, Psicologia, Psicanálise e Neurociências: Pensador; AEE, Educação e Terapia Ocupacional: Acolhedor; Matemática, Física, Química e Biologia: Descobridor), depois padrão.

## Pendências suas
- A pose "Com tablet e caneta" não está entre as seis oficiais do manual. Está aprovada no catálogo; mude `approved` se preferir segurar.
- `qaPending` lista o que só você confere a olho: rosto reconhecível, logotipo sem deformação, mãos.
- Poses do Explicador (quadro) e demais retratos das famílias 02 e 03 não foram incluídos, porque os arquivos finais não foram enviados.

## Testes
83 de 83. Auditoria de acessibilidade (axe) da aba Exportação: 0 violações, desktop e celular.

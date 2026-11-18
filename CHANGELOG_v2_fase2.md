# MathLab v2.0, Fase 2: gerador multidisciplinar e perfis de produção

Base de comparação: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase2` (hashes em `MANIFESTO_HASHES_pre_v2_fase2.txt`).
Dados persistidos (`data/projects.json`) não foram tocados.
Pré-requisito: Fase 1 aplicada (`CHANGELOG_v2_fase1.md`).

## Arquivos novos
- `src/core/productionProfiles.js`: 9 perfis estruturais (estudo comparativo, ensaio teórico, revisão bibliográfica, artigo científico, guia de estudo, guia de formação, relatório técnico, dossiê científico, parecer de auditoria) mais estrutura mínima para tipos sem perfil. Decide entre roteiro de aula e perfil (`selectProductionPath`).
- `tests/productionProfiles.test.js`: 16 testes.

## Arquivos alterados
- `src/core/workflowOrchestrator.js`: `produceMaterial()` escolhe o caminho. M03 vira "NAO_APLICAVEL" quando o tipo não é didático (`didactic = null`). A reelaboração corretiva da etapa 6 não descarta mais rascunho de IA num perfil.
- `src/core/qualityEngine.js`: completude própria para materiais com perfil (exige as seções do perfil e conteúdo real; não exige SVG, exemplos, gabarito nem DUA). Rascunho de IA gera aviso de revisão.
- `src/services/aiProviderService.js`: o prompt inclui o contexto disciplinar e os cuidados da área, e pede as seções do perfil em vez de "exemplo resolvido" quando o tipo não é aula. M03 não é imposto a tipos não didáticos.

O roteiro de aula de 11 blocos (editorialEngine) não foi alterado e continua sendo usado por apostilas, listas, avaliações etc.

## Decisão de projeto que você pode reverter
O motor local não escreve conteúdo substantivo de áreas que dependem de fontes. Ele gera estrutura, perguntas orientadoras, cuidados epistemológicos e fontes registradas, e marca o restante com `[ESQUELETO]`. Seções em esqueleto são Hard Fail na auditoria e bloqueiam a exportação, como já ocorria com material incompleto. A alternativa (preencher com texto genérico) contradiz as regras 5 e 7 do prompt mestre.

## Resultado dos testes
45 de 45 (12 originais + 17 da Fase 1 + 16 da Fase 2), offline, sem chamadas externas. O fluxo de IA externa foi testado só com provedor simulado; nenhuma chamada real ao Gemini foi feita.

## Limitações conhecidas (Fases 3 e 4)
- `doNotRequire` dos adaptadores ainda não alimenta o M05; a regra de Humanidades continua em regex.
- A interface (`public/app.js`) não mostra o contexto disciplinar nem permite corrigi-lo; a correção hoje é via `overrides` na API.
- A exportação trata o esqueleto como texto comum; não há marca visual própria para seções a desenvolver, e as exportações dos novos perfis não foram revisadas visualmente.
- O perfil de cada tipo é uma proposta inicial (versão 0.1.0), sem revisão de especialista da área.
- Pedidos de Matemática ainda usam os objetivos padrão do interpretador (`algébrica, gráfica e verbal`), inclusive para outros temas.

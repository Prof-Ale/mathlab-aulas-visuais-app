# MathLab v2.0, Fase 3: auditoria contextual e interface

Base de comparação: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase3` (hashes em `MANIFESTO_HASHES_pre_v2_fase3.txt`).
Dados persistidos (`data/projects.json`) não foram tocados. Pré-requisito: Fases 1 e 2 e ponte manual.

## Auditoria contextual (M05)
- `src/adapters/disciplineAdapters.js`: regras de auditoria por adaptador (`auditRules`), com severidade, evidência e fonte quando há. Exemplo verificado: citar o Decreto 10.502/2020 como vigente é Hard Fail, pois o Decreto 11.370/2023 (art. 1º) o revogou.
- `src/core/qualityEngine.js`: política por área e tipo de documento (figura obrigatória, recomendada ou não se aplica), lista do que não foi exigido e por quê, progresso de seções, achados com trecho de evidência. Quando a área não é identificada, a auditoria não herda mais as regras de Matemática.
- Reconhecimento de Kierkegaard, Nietzsche, Hegel, Sartre, Heidegger e correntes afins como Filosofia.

## Interface
- Painel "Como o sistema entendeu seu pedido": área, subárea, tipo, natureza, com a origem de cada campo (automático, palpite, corrigido por você). Formulário para corrigir e reaplicar; gera um material novo e preserva o anterior, com confirmação.
- Auditoria: veredito em linguagem simples, critérios usados, pendências agrupadas por regra com evidência, filtro grave/advertência, barra de progresso.
- Editor: selo por seção (esqueleto, rascunho de IA, desenvolvida), progresso, rótulos acessíveis.
- Exportação: faixa de prontidão e motivo da recusa visível na própria página.
- Criar Material: projeto novo como padrão, mensagem honesta de resultado, etapas com nomes claros, opções avançadas recolhidas.
- Acessibilidade: link de pular, foco visível, aria-current, rótulos, alvos de toque, menu rolável no celular.
- Servidor: `GET /api/knowledge/catalog`; materiais salvos passam a guardar `interpreted` e a auditoria atualizada.

## Auditoria objetiva da interface (axe-core WCAG 2.1 A/AA, Playwright)
Antes: violações críticas e sérias em Pesquisa, rótulos ausentes, sem aria-current, sem pular conteúdo.
Depois: 0 violações axe nas 8 telas, desktop e celular, sem rolagem horizontal e sem erros de JS. Restam como alvo menor que 36 px apenas as caixas de seleção (24 px, com área clicável de 40 px pelo rótulo).

## Testes
Suíte completa passando (ver execução). Materiais salvos antes da Fase 3 não têm contexto guardado; o app avisa e pede para gerar de novo.

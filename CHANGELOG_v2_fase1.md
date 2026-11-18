# MathLab v2.0, Fase 1: contexto disciplinar e classificação epistemológica

Base de comparação: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase1` (hashes em `MANIFESTO_HASHES_pre_v2_fase1.txt`).
Dados persistidos (`data/projects.json`) não foram tocados: SHA-256 idêntico ao do backup.

## Arquivos novos
- `src/adapters/disciplineAdapters.js`: registro de adaptadores (12 nativos), naturezas epistemológicas, `registerAdapter`, `validateAdapter`.
- `src/core/knowledgeContext.js`: classificação de área, subárea, natureza, finalidade, tipo documental, público e necessidade de pesquisa.
- `tests/knowledgeContext.test.js`: 17 testes (cenários A a H do prompt mestre, correção do usuário, área desconhecida, extensibilidade, regressão).

## Arquivos alterados (mudanças pequenas e aditivas)
- `src/core/requestInterpreter.js`: usa os adaptadores antes das regras legadas; devolve `knowledgeContext`. Campos legados inalterados.
- `src/core/scientificEngine.js`: a BNCC de Ciências da Natureza só é associada a Física, Química, Biologia e Ciências da Natureza. Outras áreas não recebem referência padrão e registram a limitação.
- `src/core/qualityEngine.js`: a disciplina agora é repassada a `validateMaterialCompleteness` (antes era ignorada).
- `src/core/workflowOrchestrator.js`: o log da etapa 1 inclui área, naturezas e tipo documental.

## Resultado dos testes
29 de 29 (12 originais + 17 novos), offline, sem chamadas externas.

## Limitações conhecidas, deixadas para a Fase 2 e a Fase 3
- O gerador editorial ainda monta o mesmo roteiro de 11 blocos (exemplos resolvidos, gabarito, DUA) para qualquer área.
- Os objetivos padrão do interpretador ainda falam em "representações algébrica, gráfica e verbal".
- O M05 ainda não usa `adapterGuidance.doNotRequire` nem `requiresDidacticEngineering`; hoje aprova o roteiro matemático aplicado a Filosofia.
- Os adaptadores são pontos de partida (versão 0.1.0). `keyAuthors` são pistas de busca, não referências.
- Nenhum módulo intelectual (M01 a M05) e nenhuma candidata foi alterado ou promovido.

# MathLab v2.0: ponte manual de LLM (copiar e colar)

Para uso sem API. O app monta o prompt, o professor cola na ferramenta de LLM que preferir e traz a resposta de volta.
Nenhuma chamada externa é feita. Base de comparação: `MathLab_Aulas_Visuais_App_backup_pre_v2_ponte_manual`.
Pré-requisito: Fases 1 e 2 (o pacote acumulado já as inclui).

## Como usar (aba Editor de Materiais)
1. Gere o material normalmente. Abra o painel "Usar minha ferramenta de LLM (copiar e colar)".
2. "Gerar prompt para copiar", "Copiar prompt" e cole na sua ferramenta de LLM.
3. Copie a resposta inteira da LLM, cole em "Resposta da LLM" e clique em "Importar resposta como rascunho".

## Regras de segurança da importação
- A resposta entra como rascunho a revisar (`contentOrigin`), nunca como fonte. A auditoria gera aviso de revisão.
- Só preenche seções ainda em esqueleto (perfis) ou o bloco de Desenvolvimento Conceitual (roteiro de aula).
- Texto que o professor já escreveu no editor nunca é sobrescrito nos perfis.
- O que a resposta não cobrir continua em esqueleto e é relatado. Resposta que não casa com nenhum título não altera nada.
- A importação fica no histórico das etapas (`IMPORTACAO_MANUAL_LLM`), com o nome da ferramenta, se informado.

## Arquivos
Novos: `src/core/manualLlmBridge.js`, `tests/manualLlmBridge.test.js`.
Alterados: `server.js` (rotas `/api/manual/prompt` e `/api/manual/import`), `public/app.js` (painel no editor),
`src/services/aiProviderService.js` (o prompt de documento não didático deixa de levar etapa e objetivos padrão de aula de Matemática).

## Testes
55 de 55, offline. Também percorri o fluxo no navegador (servidor numa cópia): gerar, copiar prompt, importar, ver auditoria, sem erros de página.

## Limitações
- No roteiro de aula, a resposta substitui o texto de Desenvolvimento Conceitual (inclusive se você o editou); os outros blocos não mudam.
- Para aulas de outras áreas que não Matemática, os objetivos padrão do interpretador ainda têm formato matemático.
- A importação casa seções pelo título. Se a LLM mudar o nome da seção, ela não é importada e o relatório avisa.

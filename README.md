# MathLab Aulas Visuais (app local)

Ambiente de autoria docente para qualquer disciplina: pesquisa, planejamento, material didático e exportação em DOCX, PPTX, HTML, Markdown e SVG. Roda no computador do professor, sem depender de internet para o fluxo principal.

## Como rodar

```bash
npm start      # servidor local
npm test       # 103 testes
```

Requer Node 20 ou mais novo. Copie `.env.example` para `.env` se for usar serviços externos.

## Versão

O `package.json` marca `2.0.0-fase.6`: a linha 2.0 em desenvolvimento, na fase 6. Cada fase tem seu `CHANGELOG_v2_faseN.md`. Esta versão é independente da versão das instruções (Skill, Gem e GPT) e do sistema editorial Direção AB.

## Um teste depende de documentos externos

O teste "Fase Zero" confere o inventário dos módulos M01 a M05, que ficam na pasta de documentos do professor e não neste repositório. Sem eles, o teste é pulado e avisa. Para rodá-lo, aponte a pasta:

```bash
MATHLAB_DOCS_ROOT=/caminho/da/pasta npm test
```

## Limites conhecidos

A acessibilidade foi auditada com axe-core, que cobre só parte da WCAG. Leitor de tela, teclado completo e zoom ainda não foram testados à mão. Veja `CHANGELOG_v2_fase3.md`.

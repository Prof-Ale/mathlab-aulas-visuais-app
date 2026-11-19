# MathLab Aulas Visuais v2.0, fase 5

Backup antes das mudanças: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase5`.

## Avatar no PPTX
- O avatar aprovado (PNG transparente) entra na capa do PPTX como imagem real, com texto alternativo. Título e subtítulo ficam mais estreitos para não encavalar na imagem.
- Sem avatar, o PPTX sai exatamente como antes (sem pasta de mídia, sem relação de imagem).
- A interface passou a oferecer o avatar também para PPTX. Markdown e SVG continuam sem avatar.
- Verificado: pacote lido por um leitor de ZIP nos testes e capa renderizada no LibreOffice.

## Novos adaptadores disciplinares
- **História**: natureza histórica; cautelas de anacronismo, fontes e multicausalidade. Regras (todas advertências): causa única, expressão "descobrimento do Brasil", termo "escravos", datas da Lei Áurea (1888) e da Proclamação da República (1889).
- **Teologia e Ciências da Religião**: nova natureza epistemológica "teológica e hermenêutica"; cautelas de distinção entre texto sagrado, tradição e posição confessional, e de Ensino Religioso não proselitista. Regras: doutrina apresentada como consenso ou resultado científico; citação bíblica sem referência.
- **Teoria Musical**: novo grupo "Artes e Linguagens"; cautelas de convenção versus fenômeno acústico e de sistema tonal como construção cultural. Regras: relação tom/semitom incorreta (bloqueia, por ser erro afirmado), valor de figura sem compasso, "música é linguagem universal".
- **Biologia** (já existia): palavras-chave e subáreas ampliadas (evolução, fisiologia, mitose e meiose) e duas regras de advertência: teleologia evolutiva e herança de características adquiridas sem contexto.
- Nenhum adaptador declara autor ou obra: `keyAuthors` fica vazio até haver fonte verificada.
- Avatar sugerido por área: História e Teologia usam o Pensador; Teoria Musical usa o Descobridor.

## Limites conhecidos
- As regras são heurísticas de texto, não substituem revisão por especialista. A ressalva de cada regra é procurada no texto inteiro do material, então uma palavra de ressalva em qualquer seção suprime o aviso.
- Teologia: o motor não avalia verdade de fé nem substitui a orientação da tradição do autor.
- Teoria Musical: o motor não ouve nem lê partitura; exemplos precisam ser conferidos ao instrumento.

## Testes
96 passando (83 anteriores, 2 de PPTX com avatar, 11 dos novos adaptadores).

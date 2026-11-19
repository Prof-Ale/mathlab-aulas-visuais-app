# MathLab Aulas Visuais v2.0, fase 6

Backup antes das mudanças: `MathLab_Aulas_Visuais_App_backup_pre_v2_fase6`.

## Novos adaptadores
- **Geografia** (Ciências Humanas e Sociais): natureza empírica; subáreas Cartografia, Geografia física e Geografia humana e econômica. Cautelas: todo dado com fonte e ano, mapa com projeção e escala, tempo atmosférico versus clima, atenção às escalas.
  - Regra que bloqueia: capital do Brasil atribuída a outra cidade (Brasília é capital desde 1960); a ressalva histórica ("já foi", "até 1960") libera.
  - Advertências: confusão entre tempo e clima; projeção de Mercator sem discutir distorção de áreas; "Terceiro Mundo" sem contextualização.
- **Língua Portuguesa** (novo grupo "Linguagens e Códigos"): nova natureza epistemológica "linguística e descritiva"; subáreas Gramática e análise linguística, Leitura e produção de texto e Variação linguística. Cautelas: partir do uso real, distinguir norma-padrão e variação, citar a edição de gramáticas e dicionários.
  - Advertências: "falar errado" sem discutir adequação à situação comunicativa; "haviam" com sentido de existir ("haviam muitos alunos"). "Haviam chegado", tempo composto, não dispara.
- Nenhum adaptador declara autor ou obra (`keyAuthors` vazio).
- Avatar sugerido: Geografia usa o Descobridor; Língua Portuguesa usa o Acolhedor.

## Correções de regras (descobertas nos testes)
- A ressalva de "falar errado" era ampla demais e casava com texto gerado pelo app; foi estreitada.
- A de "haviam" casava com a palavra "erro" de "erros comuns"; foi estreitada.
- O padrão de "falar errado" não pegava "fala errado"; corrigido.

## Observações
- Pedido genérico de Matemática sem palavra de domínio (por exemplo "proporcionalidade e regra de três") continua sem área detectada, como antes da fase 6; cai no fluxo de Matemática legado. Não alterei isso.
- As regras são heurísticas de texto e não substituem a conferência do professor. Dados geográficos e grafia de exemplos precisam ser conferidos na fonte.

## Testes
103 passando (96 anteriores + 7 da fase 6, incluindo regressão de Biologia, História, Matemática, Física e Filosofia).

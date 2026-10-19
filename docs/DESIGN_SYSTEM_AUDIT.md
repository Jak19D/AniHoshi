# AniHoshi — Design System e vistoria heurística

## Escopo e método

Inspeção estática das telas e fluxos presentes em `src/screens` e `src/routes`, com referência às 10 heurísticas de Nielsen e a critérios WCAG 2.0 AA aplicáveis como orientação de acessibilidade. Não houve sessões Think Aloud nem recrutamento de participantes; este documento não representa teste com usuários nem declaração de conformidade formal. WCAG 2.0 é uma referência de conteúdo web, então os critérios aqui foram usados como guia para a interface mobile, não como certificação do app nativo.

O app já contém mais que cinco fluxos de tela interativos: login, cadastro, redefinição, splash, início, busca, mangás, favoritos, perfil, detalhe de anime, detalhe de mangá e categoria. A navegação entre eles é definida em `src/routes/AppNavigator.tsx`.

## Heurísticas de Nielsen

| Heurística | Avaliação observada | Oportunidade |
| --- | --- | --- |
| 1. Visibilidade do estado | Login, cadastro e redefinição têm validação inline; operações também usam alertas. | Exibir retorno visível quando salvar nome/foto/capa falhar ou terminar. |
| 2. Correspondência com o mundo real | Rótulos como “Favoritos”, “Explorar” e “Redefinir senha” usam termos familiares. | Corrigir textos com caracteres acentuados corrompidos se aparecerem assim no dispositivo. |
| 3. Controle e liberdade | Há retorno entre formulários, tabs e ação de sair. Favoritos podem ser alternados novamente. | Oferecer confirmação/recuperação para ações destrutivas futuras e permitir cancelar a edição do nome. |
| 4. Consistência e padrões | A navegação inferior e os botões principais são reconhecíveis. | Unificar rótulos, alturas de controles, tratamento de voltar e tokens de erro entre telas. |
| 5. Prevenção de erros | Cadastro e redefinição validam e-mail, senha e confirmação; ações inválidas ficam desativadas. | Aplicar os mesmos estados visuais e semânticos de erro em todo campo, não só autenticação. |
| 6. Reconhecimento em vez de memorização | As tabs mantêm destinos visíveis e formulários mostram regras de senha. O perfil agora expõe rótulos acessíveis para seus campos. | Manter instruções visíveis perto de campos e validar a experiência com leitor de tela. |
| 7. Flexibilidade e eficiência | Tabs dão acesso direto às áreas frequentes; busca e categorias reduzem navegação. | Manter busca e ações de favoritos com alvos confortáveis em telas menores. |
| 8. Estética e design minimalista | Tema escuro e cor amarela criam hierarquia visual consistente. | Cards usam metadados de 9–12 sp; aumentar para melhorar leitura e reduzir competição visual. |
| 9. Reconhecer, diagnosticar e recuperar de erros | Formulários de autenticação têm mensagens junto aos campos. | Vários `catch` do perfil só escrevem no console; comunicar causa e próxima ação na interface. |
| 10. Ajuda e documentação | O novo Design System documenta cores, padrões e fluxos dentro do app. | Adicionar ajuda contextual para ações de conta e para a recuperação local de senha. |

## Matriz de achados e prioridade

| Prioridade | Achado | Heurística / referência | Correção sugerida |
| --- | --- | --- | --- |
| Alta | Alguns alvos de ação pequenos nos cards e links de seção podem ficar abaixo de 44 × 44 px. | Operabilidade / alvo tátil (recomendação mobile; WCAG 2.0 não fixa dimensão mínima) | Busca, voltar e ações do perfil foram ampliados/rotulados; ampliar os alvos restantes de favoritos e “Ver tudo” para pelo menos 44 dp. |
| Alta | Mensagens de erro de formulário nem sempre são anunciadas programaticamente junto ao campo. | WCAG 3.3.1 e 4.1.2 como referências | A amostra do Design System anuncia erro; aplicar padrão equivalente aos formulários de cadastro e redefinição. |
| Alta | Texto de metadados de cards chega a 9 sp. | Legibilidade; WCAG 1.4.4 como referência | Usar pelo menos 12–14 sp quando o layout permitir e validar ampliação de fonte no aparelho. |
| Média | Erros ao salvar nome, foto ou capa podem não ter feedback visível. | Nielsen 1 e 9; WCAG 3.3.1 | Mostrar erro próximo à ação e instrução simples para tentar novamente. |
| Média | Paletas de categorias mudam por gênero e nem todas foram medidas contra texto branco. | WCAG 1.4.3 | Evitar texto sobre cor não medida ou calcular contraste para cada combinação antes de reutilizar. |
| Média | Fluxo de recuperação redefine senha local por e-mail informado e não prova posse desse e-mail. | Prevenção de erro / expectativa de segurança | Manter explícito que é uma conta local; para contas remotas, implementar verificação por backend/e-mail. |
| Média | Não há preferências de contraste/movimento ou teste documentado com leitor de tela. | WCAG 1.1.1, 2.1.1 e 4.1.2 como referências | Testar VoiceOver/TalkBack, teclado quando aplicável e escala de fonte em aparelhos reais. |

## Tokens atuais

| Token | HEX |
| --- | --- |
| Fundo principal | `#0A0F1D` |
| Fundo secundário | `#12182B` |
| Superfície principal | `#1E1B4B` |
| Superfície secundária | `#2A2550` |
| Primária / sucesso | `#FBC02D` |
| Primária em destaque | `#FFC107` |
| Acento | `#00BCD4` |
| Texto principal | `#FFFFFF` |
| Texto secundário | `#A0AEC0` |
| Link | `#E5E7EB` |
| Erro | `#FF5252` |
| Erro crítico | `#E53935` |

As categorias de busca também usam: `#455A64`, `#689F38`, `#D84315`, `#283593`, `#E65100`, `#1565C0`, `#AD1457`, `#C2185B`, `#7B1FA2`, `#37474F` e `#4E342E`.

Sobreposições presentes no app usam `rgba`; em notação HEX `RRGGBBAA`, aparecem também: `#00000000`, `#0000004D`, `#00000066`, `#00000080`, `#000000B3`, `#000000E6`, `#000000EB`, `#000000F2`, `#0A0F1DCC`, `#0A0F1DE6`, `#0A0F1DFF`, `#FFFFFF0D`, `#FFFFFF1A` e `#FFFFFF4D`.

Contraste calculado pela fórmula de luminância relativa WCAG: `#FFFFFF`/`#0A0F1D` = 19,11:1; `#A0AEC0`/`#0A0F1D` = 8,47:1; `#FBC02D`/`#0A0F1D` = 11,54:1; `#FF5252`/`#1E1B4B` = 5,01:1. Já `#FF5252`/`#2A2550` fica em aproximadamente 4,45:1 e não deve ser usado para texto normal nessa superfície.

## Biblioteca de componentes

A tela `Design System` dentro do Perfil apresenta os tokens, escala tipográfica observada (9–32 sp), espaçamentos/radios recorrentes, botão primário em estados padrão/pressionado/desabilitado e campo de e-mail editável com estados padrão/foco/erro. Os alvos interativos novos usam mínimo de 48 dp. `disabled` reduz opacidade como estado não interativo; para outras situações, não comunicar estado somente pela cor.

### Referências

- [W3C — Web Content Accessibility Guidelines 2.0](https://www.w3.org/TR/WCAG20/)
- [Nielsen Norman Group — 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Nielsen Norman Group — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)

# Configuração local do ambiente

O arquivo de ambiente local fica em `.env`, na raiz do repositório, ao lado de
`package.json`. O Expo carrega esse arquivo durante o desenvolvimento e a
compilação.

Para configurar uma nova cópia do projeto:

1. Copie `.env.example` para `.env`.
2. Preencha `EXPO_PUBLIC_SUPABASE_URL` e
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do projeto Supabase.
3. Reinicie o servidor Expo depois de alterar as variáveis.

`.env` e outros arquivos de ambiente locais são ignorados pelo Git. Mantenha
`.env.example` versionado como lista dos nomes de variáveis necessárias, sem
valores reais.

## Segurança

O prefixo `EXPO_PUBLIC_` significa que o valor será incluído no bundle do app e
poderá ser lido por qualquer pessoa que o instale. A URL do Supabase e a chave
publishable (antiga anon key) são identificadores/chaves públicas; a segurança
dos dados depende das políticas RLS e das permissões configuradas no Supabase.
Nunca coloque `service_role`, chaves privadas ou credenciais do Backblaze em
variáveis `EXPO_PUBLIC_` ou no app. Segredos usados por Edge Functions devem ser
configurados no ambiente do Supabase, no servidor.

# Teste isolado de vídeo Backblaze B2

Este teste usa uma Supabase Edge Function protegida por JWT para criar uma URL GET pré-assinada por 5 minutos para o objeto de teste fixo. O bucket continua privado. A URL é uma credencial temporária de leitura: não a publique, não a registre em issue/log e não a reutilize após o teste.

## Credenciais B2 necessárias

No console Backblaze, crie uma **Application Key** restrita ao bucket `anihosi-videos` e com capacidade somente `readFiles`. Não habilite `writeFiles`, `deleteFiles` ou listagem para este teste. Guarde o Key ID e o Application Key em um gerenciador seguro.

Após autorização específica para deploy, cadastre estes nomes em **Supabase Dashboard → Edge Functions → Secrets** do projeto correto:

- `B2_KEY_ID`
- `B2_APPLICATION_KEY`

Os valores não devem ser colocados no aplicativo Expo, em variáveis `EXPO_PUBLIC_`, neste documento ou em arquivos versionados. O endpoint (`https://s3.us-east-005.backblazeb2.com`), região, bucket e objeto são fixos no código desta função de teste.

## Deploy e emissão da URL

O deploy não foi executado. Após autorização explícita, publicar somente `b2-video-test-url` no projeto Supabase correto, sem migrations. A configuração local exige JWT (`verify_jwt = true`); a função também valida a sessão chamando `auth.getUser`.

Com as secrets configuradas e a função publicada, invoque `b2-video-test-url` com uma sessão autenticada do AniHosi. Ela retorna `url`, `expiresIn`, `expiresAt` e o identificador do objeto. A função não recebe bucket nem caminho do cliente, impedindo que a chamada seja usada para assinar objetos arbitrários.

## Testar requisição parcial (Range)

No PowerShell, a partir da raiz do repositório:

```powershell
.\scripts\test-b2-range.ps1
```

Cole a URL no prompt seguro. O script envia `GET` com `Range: bytes=0-1048575`, imprime apenas status e cabeçalhos de resposta, e não salva o corpo em disco. O resultado esperado é HTTP `206 PartialContent`, `Content-Range` em bytes e tipo de conteúdo de vídeo. `200 OK`, `403`, `SignatureDoesNotMatch` ou ausência de `Content-Range` indicam falha ou configuração incompatível. Gere uma URL nova para cada tentativa, pois ela expira em 5 minutos.

## Teste de reprodução no navegador

Gere outra URL autenticada e abra-a diretamente no navegador antes da expiração. O navegador pode exibir controles ou iniciar o download conforme seus recursos e os metadados do objeto; isso sozinho não valida seek. Verifique avanço e retrocesso durante reprodução. Não compartilhe a URL: qualquer pessoa que a obtenha poderá ler o objeto até expirar.

Depois da validação HTTP, o teste no Android ainda exige a integração do app e será uma etapa separada. Esta função isolada não altera `mediaRepository`, `AnimePlayerScreen`, banco, migrations, buckets ou player.

## Limites do resultado

`206` e `Content-Range` comprovam que o endpoint atendeu uma leitura parcial. A confirmação real de seek depende também da reprodução do objeto no navegador e, posteriormente, no Android. A assinatura não transcodifica nem comprime: os bytes entregues são do objeto original. A compatibilidade de reprodução depende do codec/container suportado pelo dispositivo.

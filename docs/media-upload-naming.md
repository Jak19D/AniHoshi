# Padrão de nomes para uploads de mídia

Os arquivos continuam sendo enviados pelo painel do Supabase para a raiz do
bucket correspondente. O registro do capítulo ou episódio é criado
automaticamente quando o objeto é salvo no Storage, desde que o nome siga o
padrão abaixo.

## Episódios

Bucket: `anime-episodes`  
Nome: `<anime-em-kebab-case>--s<temporada-2-dígitos>-e<episódio-3-dígitos>.mp4`

Exemplos:

- `demon-slayer--s01-e001.mp4`
- `jujutsu-kaisen--s02-e008.mp4`

## Capítulos

Bucket: `manga-chapters`  
Nome: `<manga-em-kebab-case>--c<capítulo-3-ou-4-dígitos>.pdf`

Exemplos:

- `demon-slayer--c001.pdf`
- `one-piece--c0105.pdf`

Use o título que aparece no app, sem acentos, em minúsculas e com hífens entre
palavras. Não acrescente pastas nem texto depois do número. O formato atual
aceita vídeos MP4 e capítulos em PDF. A extensão deve aparecer uma única vez.

## Ativação

Execute a migração
`supabase/migrations/20261123000103_auto_register_media_uploads.sql` uma vez no
SQL Editor do projeto Supabase. Ela adiciona gatilhos que observam os metadados
de `storage.objects`; os gatilhos criam ou atualizam as linhas de catálogo que o
app consulta e limpam a referência quando um arquivo é removido.

O Supabase recomenda tratar o esquema `storage` como gerenciado e evitar
alterações nele. Este gatilho não altera os objetos enviados, mas depende da
tabela de metadados do Storage; revise essa integração se o Supabase mudar o
esquema interno.

Uploads já existentes com o nome `kimetsu-no-yaiba-capitulo-01-crueldade.pdf.pdf`
também são associados ao mangá Demon Slayer pela migração
`20261124000105_register_legacy_manga_names.sql`. Novos uploads devem seguir o
padrão recomendado acima, usando o título que aparece no app (`demon-slayer`),
para que mangás e capítulos novos sejam identificados sem ambiguidade.

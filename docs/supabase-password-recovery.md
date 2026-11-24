# Configurar codigo de recuperacao por e-mail

O app usa o fluxo de recuperacao do Supabase Auth: pede a recuperacao, valida o OTP com `type: 'recovery'` e so entao permite chamar `updateUser({ password })`. O projeto esta configurado para codigos de 8 digitos (`otp_length = 8`).

O template de Reset Password esta em `supabase/templates/recovery.html` e referenciado em `supabase/config.toml`. Ele envia `{{ .Token }}` (OTP de 8 digitos) em vez do link padrao — necessario enquanto o app roda em localhost.

## Bloqueio do free tier

Projetos free novos **nao podem editar templates** enquanto usam o SMTP padrao do Supabase. Para liberar o codigo no e-mail:

1. Configure um SMTP proprio em **Authentication > SMTP Settings** (Resend, Brevo, SendGrid, etc.).
2. Aplique o template:

```bash
npx supabase config push --yes
```

Ou no Dashboard: **Authentication > Email Templates > Reset Password**, cole o HTML de `supabase/templates/recovery.html`.

Sem SMTP customizado, o e-mail continua com o link "Reset password". Enquanto isso, o app tambem aceita colar o link completo do e-mail no campo de codigo (extrai o `token` e valida com `verifyOtp`).

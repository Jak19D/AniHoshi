import AsyncStorage from '@react-native-async-storage/async-storage';
import { FunctionsHttpError, Session } from '@supabase/supabase-js';
import { supabase } from './mediaRepository';
import { deleteLocalAccountData } from '../utils/accountData';

function getClient() {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    return supabase;
}

export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await getClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    if (data.user.email) await AsyncStorage.setItem('currentUser', data.user.email.toLowerCase());
    return data;
}

export async function registerWithEmail(email: string, password: string) {
    const { data, error } = await getClient().auth.signUp({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    if (data.session && data.user?.email) await AsyncStorage.setItem('currentUser', data.user.email.toLowerCase());
    return data;
}

export async function signOut(scope: 'global' | 'local' = 'global') {
    const { error } = await getClient().auth.signOut({ scope });
    if (error) throw error;
    await AsyncStorage.removeItem('currentUser');
}

export async function requestPasswordReset(email: string) {
    const { error } = await getClient().auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
}

function extractRecoveryCredential(raw: string): { token?: string; tokenHash?: string } {
    const value = raw.trim();
    if (/^\d{6,8}$/.test(value)) return { token: value };

    try {
        const url = new URL(value);
        const tokenHash = url.searchParams.get('token') ?? undefined;
        if (tokenHash) return { tokenHash };
    } catch { /* not a URL */ }

    if (/^[A-Za-z0-9_-]{20,}$/.test(value)) return { tokenHash: value };
    return {};
}

export async function verifyPasswordRecoveryCode(email: string, credential: string) {
    const { token, tokenHash } = extractRecoveryCredential(credential);
    const client = getClient();

    if (token) {
        const { data, error } = await client.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token,
            type: 'recovery',
        });
        if (error) throw error;
        return data;
    }

    if (tokenHash) {
        const { data, error } = await client.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
        });
        if (error) throw error;
        return data;
    }

    throw new Error('INVALID_RECOVERY_CREDENTIAL');
}

export async function exchangePasswordRecoveryCode(code: string) {
    const { data, error } = await getClient().auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
}

export async function updatePassword(password: string) {
    const { data, error } = await getClient().auth.updateUser({ password });
    if (error) throw error;
    if (data.user.email) await AsyncStorage.setItem('currentUser', data.user.email.toLowerCase());
    return data;
}

export async function deleteAuthenticatedAccount(password: string): Promise<void> {
    const client = getClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user?.email) throw new Error('NO_ACTIVE_SESSION');

    const { data, error } = await client.functions.invoke<{ deleted: boolean }>('delete-account', {
        body: { password },
    });
    if (error) {
        let code = '';
        if (error instanceof FunctionsHttpError) {
            const body = await error.context.clone().json().catch(() => null) as { error?: string; message?: string } | null;
            code = body?.error ?? body?.message ?? '';
        }
        if (/not[_\s-]?found|404/i.test(`${code} ${error.message}`)) code = 'ACCOUNT_DELETION_NOT_DEPLOYED';
        throw new Error(code || 'ACCOUNT_DELETION_FAILED');
    }
    if (!data?.deleted) throw new Error('ACCOUNT_DELETION_FAILED');

    await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
    await deleteLocalAccountData(user.email).catch((error) => {
        console.warn('A conta foi excluída remotamente, mas alguns dados locais não foram removidos:', error);
    });
    await AsyncStorage.removeItem('currentUser');
}

export function getAuthErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SUPABASE_NOT_CONFIGURED') return 'A conexão com o Supabase não está configurada neste ambiente.';
    if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
    if (/user already registered/i.test(message)) return 'Este e-mail já possui uma conta.';
    if (message === 'INVALID_RECOVERY_CREDENTIAL') return 'Digite o codigo de 8 digitos do e-mail ou cole o link de recuperacao.';
    if (/token has expired|otp.*invalid|invalid.*otp/i.test(message)) return 'Codigo invalido ou expirado. Solicite outro e tente novamente.';
    if (/password should be|weak password/i.test(message)) return 'A senha não atende aos requisitos do Supabase.';
    if (/rate limit|over_email_send_rate_limit/i.test(message)) {
        return 'Limite de e-mails do Supabase atingido (SMTP padrao: ~2 por hora). Aguarde cerca de 1 hora ou configure um SMTP proprio.';
    }
    if (/network|fetch/i.test(message)) return 'Não foi possível conectar ao Supabase. Verifique sua conexão.';
    return message || 'Não foi possível concluir a operação. Tente novamente.';
}

export async function getPersistedSession(): Promise<Session | null> {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
}

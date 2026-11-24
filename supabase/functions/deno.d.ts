/** Ambient typings so the Expo/Node TypeScript service can open Deno Edge Functions without false errors. */

declare namespace Deno {
    function serve(handler: (request: Request) => Response | Promise<Response>): void;
    namespace env {
        function get(key: string): string | undefined;
    }
}

declare module 'npm:@supabase/supabase-js@2' {
    export { createClient, type SupabaseClient } from '@supabase/supabase-js';
}

declare module 'npm:@aws-sdk/client-s3' {
    export class S3Client {
        constructor(config: Record<string, unknown>);
    }
    export class GetObjectCommand {
        constructor(input: { Bucket: string; Key: string });
    }
}

declare module 'npm:@aws-sdk/s3-request-presigner' {
    export function getSignedUrl(
        client: unknown,
        command: unknown,
        options?: { expiresIn?: number },
    ): Promise<string>;
}

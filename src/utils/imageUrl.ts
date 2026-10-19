export function getOriginalImageUrl(uri: string): string {
    return uri
        .replace(/-\d+x\d+\.webp(?=(?:\?.*)?$)/i, '')
        .replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp|avif)(?:\?.*)?$)/i, '');
}

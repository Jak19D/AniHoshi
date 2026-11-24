$ErrorActionPreference = 'Stop'

Write-Host 'Paste the presigned URL into the secure prompt. It remains in memory and is not printed.'
$secureUrl = Read-Host 'Presigned URL' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
$request = $null
$client = $null
$response = $null

try {
    $url = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $url)
    $request.Headers.Range = [System.Net.Http.Headers.RangeHeaderValue]::new(0, 1048575)
    $client = [System.Net.Http.HttpClient]::new()

    try {
        try {
            $response = $client.SendAsync(
                $request,
                [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
            ).GetAwaiter().GetResult()
        } catch {
            throw 'Range request failed. Check that the URL is valid and has not expired.'
        }

        $range = $response.Content.Headers.ContentRange
        $contentRange = if ($range) {
            $range.ToString()
        } else {
            '(ausente)'
        }
        $contentType = if ($response.Content.Headers.ContentType) {
            $response.Content.Headers.ContentType.ToString()
        } else {
            '(ausente)'
        }

        Write-Host "HTTP: $([int]$response.StatusCode) $($response.StatusCode)"
        Write-Host "Content-Range: $contentRange"
        Write-Host "Content-Type: $contentType"
        Write-Host "Accept-Ranges: $($response.Headers.AcceptRanges -join ', ')"

        if ($response.StatusCode -ne [System.Net.HttpStatusCode]::PartialContent) {
            throw 'The server did not return HTTP 206 for the Range request.'
        }
        if (-not $range) {
            throw 'The response does not contain a Content-Range header.'
        }
        if ($range.Unit -ne 'bytes') {
            throw 'The response does not contain a valid byte Content-Range.'
        }
        if ($range.From -ne 0) {
            throw 'Content-Range does not start at byte 0.'
        }
        if (-not $range.Length -or $range.Length -le 0) {
            throw 'Content-Range does not include a valid object size.'
        }

        $expectedEnd = [Math]::Min([long]1048575, [long]$range.Length - 1)
        if ($range.To -ne $expectedEnd) {
            throw "Content-Range ends at byte $($range.To); expected byte $expectedEnd based on object size $($range.Length)."
        }
        if (-not $response.Content.Headers.ContentType -or $response.Content.Headers.ContentType.MediaType -ne 'video/mp4') {
            throw 'The response Content-Type is not video/mp4.'
        }

        Write-Host "Range verified: bytes 0-$expectedEnd of $($range.Length) total bytes; Content-Type video/mp4." -ForegroundColor Green
        Write-Host 'Response body was not read or saved to disk.'
    } finally {
        if ($response) { $response.Dispose() }
        if ($client) { $client.Dispose() }
        if ($request) { $request.Dispose() }
    }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $secureUrl.Dispose()
    $secureUrl = $null
    $url = $null
}

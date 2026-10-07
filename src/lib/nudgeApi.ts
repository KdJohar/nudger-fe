import { requestApiResponse } from './api'
import { resolveApiUrl } from './apiUrl'
import type { ApiNudgeDraft, ApiNudgeRequest, ApiNudgeResult, NudgeExampleLanguage } from '../types/nudgeApi'

export const NUDGE_SEND_PATH = '/v1/app-nudger/nudge/send'
export const API_MESSAGE_LIMIT = 4096
export const NUDGE_EXAMPLE_LANGUAGES: { value: NudgeExampleLanguage; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'javascript', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
]

export function validateApiNudge(draft: ApiNudgeDraft): { message?: string; recipientId?: string } {
  const errors: { message?: string; recipientId?: string } = {}
  if (!draft.message.trim()) errors.message = 'Write a message to send.'
  else if (Array.from(draft.message).length > API_MESSAGE_LIMIT) errors.message = 'Use 4,096 characters or fewer.'
  if (draft.nudgeType === 'transactional' && !/^[1-9]\d{5}$/.test(draft.recipientId.trim())) {
    errors.recipientId = 'Enter a six-digit Nudge ID (100000–999999).'
  }
  return errors
}

export function buildApiNudgeRequest(draft: ApiNudgeDraft): ApiNudgeRequest {
  const message = draft.message.trim()
  return draft.nudgeType === 'broadcast'
    ? { message, nudge_type: 'broadcast' }
    : { message, nudge_type: 'transactional', nudge_user_id: Number(draft.recipientId.trim()) }
}

// Shell single-quote escaping keeps user-written messages literal in copied cURL examples.
function shellQuote(value: string): string {
  return "'" + value.replaceAll("'", "'\"'\"'") + "'"
}

export function buildNudgeExample(payload: ApiNudgeRequest, language: NudgeExampleLanguage, token: string | null): string {
  if (!token) return 'Create or load your API token above to see a ready-to-use request example.'
  const url = resolveApiUrl(NUDGE_SEND_PATH)
  const body = JSON.stringify(payload, null, 2)
  if (language === 'python') {
    return `# Python 3 — standard library only. Run on your server.
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen

NUDGE_API_TOKEN = ${JSON.stringify(token)}
payload = ${body}

request = Request(
    ${JSON.stringify(url)},
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": "Bearer " + NUDGE_API_TOKEN,
        "Content-Type": "application/json",
    },
    method="POST",
)

try:
    with urlopen(request, timeout=20) as response:
        print(response.status, response.read().decode("utf-8"))
except HTTPError as error:
    print(error.code, error.read().decode("utf-8"))`
  }
  if (language === 'go') {
    return `// Go — standard library only. Run on your server.
package main

import (
    "fmt"
    "io"
    "log"
    "net/http"
    "strings"
    "time"
)

func main() {
    NUDGE_API_TOKEN := ${JSON.stringify(token)}
    payload := strings.NewReader(${JSON.stringify(body)})
    request, err := http.NewRequest(http.MethodPost, ${JSON.stringify(url)}, payload)
    if err != nil { log.Fatal(err) }
    request.Header.Set("Authorization", "Bearer " + NUDGE_API_TOKEN)
    request.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 20 * time.Second}
    response, err := client.Do(request)
    if err != nil { log.Fatal(err) }
    defer response.Body.Close()
    body, err := io.ReadAll(response.Body)
    if err != nil { log.Fatal(err) }
    fmt.Println(response.Status, string(body))
}`
  }
  if (language === 'java') {
    return `// Java 11+ — standard library only. Run on your server.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class SendNudge {
    public static void main(String[] args) throws Exception {
        String NUDGE_API_TOKEN = ${JSON.stringify(token)};
        String payload = ${JSON.stringify(body)};
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(${JSON.stringify(url)}))
            .timeout(Duration.ofSeconds(20))
            .header("Authorization", "Bearer " + NUDGE_API_TOKEN)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}`
  }
  if (language === 'javascript') {
    return `// Run on your server.\nconst NUDGE_API_TOKEN = ${JSON.stringify(token)};\n\nconst response = await fetch(${JSON.stringify(url)}, {\n  method: 'POST',\n  headers: {\n    Authorization: \`Bearer \${NUDGE_API_TOKEN}\`,\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${body.replaceAll('\n', '\n  ')}),\n});\n\nconsole.log(response.status, await response.json());`
  }
  return `NUDGE_API_TOKEN=${shellQuote(token)}\n\ncurl --request POST ${shellQuote(url)} \\\n  --header "Authorization: Bearer $NUDGE_API_TOKEN" \\\n  --header 'Content-Type: application/json' \\\n  --data ${shellQuote(body)}`
}

export async function sendApiNudge(token: string, payload: ApiNudgeRequest, signal: AbortSignal): Promise<ApiNudgeResult> {
  // Merchant credentials are separate from sign-in. Never refresh the session or retry a send here.
  return requestApiResponse(NUDGE_SEND_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  }, token)
}

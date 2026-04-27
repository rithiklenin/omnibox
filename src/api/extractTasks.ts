const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export interface ExtractedTask {
  id: string;
  title: string;
  description: string;
  severity: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string | null;
  sourceEmailId: string;
  sourceSubject: string;
  sourceSender: string;
  done: boolean;
  order: number;
}

interface EmailForExtraction {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  receivedAt: string;
}

export async function extractTasksFromEmails(
  emails: EmailForExtraction[]
): Promise<ExtractedTask[]> {
  if (emails.length === 0) return [];

  if (!ANTHROPIC_API_KEY) {
    return [];
  }

  const emailList = emails
    .map(
      (e, i) =>
        `Email ${i + 1}:\nFrom: ${e.sender}\nSubject: ${e.subject}\nDate: ${e.receivedAt}\nContent: ${e.snippet}`
    )
    .join('\n\n---\n\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a task extraction assistant. Analyze the provided emails and extract actionable tasks.

For each task, provide:
- title: A short task title (max 80 chars)
- description: Brief context about what needs to be done
- severity: One of "urgent", "high", "medium", "low" based on deadline proximity and importance
- dueDate: ISO 8601 date string if a deadline is mentioned or can be reasonably inferred, otherwise null
- sourceEmailIndex: The email number (1-based) this task came from

Rules:
- Only extract genuine actionable tasks (things the user needs to DO)
- Skip newsletters, marketing emails, notifications with no action needed
- If an email asks for a reply, that IS a task
- If an email mentions a deadline, set severity accordingly
- Today's date is ${new Date().toISOString().split('T')[0]}

Respond ONLY with a JSON array. No explanation. Example:
[{"title":"Review Q2 budget proposal","description":"Sarah needs feedback on budget allocation","severity":"high","dueDate":"2026-04-28","sourceEmailIndex":1}]

If no tasks found, return an empty array: []`,
      messages: [
        {
          role: 'user',
          content: emailList,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error('Task extraction failed:', response.status);
    return [];
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.map(
      (
        t: {
          title: string;
          description: string;
          severity: string;
          dueDate: string | null;
          sourceEmailIndex: number;
        },
        i: number
      ) => {
        const sourceEmail = emails[t.sourceEmailIndex - 1];
        return {
          id: `task-${Date.now()}-${i}`,
          title: t.title,
          description: t.description,
          severity: (['urgent', 'high', 'medium', 'low'].includes(t.severity)
            ? t.severity
            : 'medium') as ExtractedTask['severity'],
          dueDate: t.dueDate,
          sourceEmailId: sourceEmail?.id || '',
          sourceSubject: sourceEmail?.subject || '',
          sourceSender: sourceEmail?.sender || '',
          done: false,
          order: i,
        };
      }
    );
  } catch (err) {
    console.error('Failed to parse task extraction response:', err);
    return [];
  }
}

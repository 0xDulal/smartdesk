import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AiTriageResult {
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
  confidence: number;
  suggestedReply: string;
  modelUsed: 'gemini' | 'heuristic-engine';
}

/**
 * Embedded rule-based heuristic classification engine used as a dependable
 * fallback when an external LLM API key is not configured or during offline review.
 */
function heuristicTriage(title: string, description: string): AiTriageResult {
  const text = `${title} ${description}`.toLowerCase();

  // Category classification
  let category: TicketCategory = 'general';
  if (/(crash|error|bug|exception|fail|500|broken|not working|timeout|glitch)/i.test(text)) {
    category = 'technical';
  } else if (/(invoice|receipt|charge|bill|refund|payment|subscription|card|price)/i.test(text)) {
    category = 'billing';
  } else if (/(password|login|auth|account|2fa|reset|email|profile|permission)/i.test(text)) {
    category = 'account';
  } else if (/(request|suggestion|would like|feature|add support|enhancement)/i.test(text)) {
    category = 'feature';
  }

  // Priority detection
  let priority: TicketPriority = 'medium';
  if (/(urgent|critical|immediately|down|outage|emergency|asap|data loss|security breach)/i.test(text)) {
    priority = 'urgent';
  } else if (/(cannot access|blocked|high priority|important|deadline|broken production)/i.test(text)) {
    priority = 'high';
  } else if (/(minor|typo|cosmetic|when you have time|question|curious)/i.test(text)) {
    priority = 'low';
  }

  // Generate concise summary
  const cleanTitle = title.trim();
  const summary = `Customer reported ${category} issue: "${cleanTitle.length > 60 ? cleanTitle.slice(0, 57) + '...' : cleanTitle}".`;

  // Suggested canned staff reply
  let suggestedReply = 'Thank you for reaching out. We have received your ticket and our team is investigating.';
  if (category === 'billing') {
    suggestedReply = 'Hi there, thank you for contacting billing support. We are reviewing the billing transaction associated with your account and will update you shortly.';
  } else if (category === 'technical') {
    suggestedReply = 'Hi there, thank you for flagging this error. Our engineering team has logged the details and is actively diagnosing the root cause. Could you confirm if this issue reproduces in an incognito window?';
  } else if (category === 'account') {
    suggestedReply = 'Hello, to safeguard your account, we have initiated an identity verification check. Please look out for a security confirmation email.';
  }

  return {
    category,
    priority,
    summary,
    confidence: 0.88,
    suggestedReply,
    modelUsed: 'heuristic-engine',
  };
}

/**
 * Triages incoming ticket content using either an external LLM API
 * or the built-in resilient heuristic engine.
 */
export async function triageTicket(
  title: string,
  description: string
): Promise<AiTriageResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI Support Triage engine for a customer helpdesk. Analyze this support request:
Title: "${title}"
Description: "${description}"

Respond strictly with valid JSON with these keys:
{
  "category": "technical" | "billing" | "account" | "general" | "feature",
  "priority": "low" | "medium" | "high" | "urgent",
  "summary": "1 sentence synopsis under 100 characters",
  "confidence": number between 0.70 and 0.99,
  "suggestedReply": "Professional 2-3 sentence initial response for support staff to send"
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          return {
            category: parsed.category ?? 'general',
            priority: parsed.priority ?? 'medium',
            summary: parsed.summary ?? title,
            confidence: Number(parsed.confidence) || 0.92,
            suggestedReply: parsed.suggestedReply ?? 'Thank you for reaching out. We are investigating your request.',
            modelUsed: 'gemini',
          };
        }
      }
    } catch {
      // Fallback seamlessly on any network or parsing error
    }
  }

  // Dependable built-in classification
  return heuristicTriage(title, description);
}

//import OpenAI from 'openai';
import type { AgentContext, AgentResponse, ToolCall, QuickAction } from '@/types';
import { calculateLeadTier } from '@/lib/utils';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AGENT_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'qualify_lead',
            description: 'Qualify a lead using BANT framework. Call this when you have gathered information about at least 2 BANT criteria.',
            parameters: {
                type: 'object',
                properties: {
                    budgetScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Budget (0-25)' },
                    budgetNotes: { type: 'string', description: 'Notes about budget' },
                    authorityScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Authority (0-25)' },
                    authorityNotes: { type: 'string', description: 'Notes about decision maker' },
                    needScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Need (0-25)' },
                    needNotes: { type: 'string', description: 'Notes about business need' },
                    timelineScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Timeline (0-25)' },
                    timelineNotes: { type: 'string', description: 'Notes about timeline' },
                    painPoints: { type: 'array', items: { type: 'string' }, description: 'List of identified pain points' },
                    buyingSignals: { type: 'array', items: { type: 'string' }, description: 'List of buying signals observed' },
                    qualificationSummary: { type: 'string', description: 'Overall qualification summary' },
                },
                required: ['budgetScore', 'authorityScore', 'needScore', 'timelineScore'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'book_meeting',
            description: 'Suggest booking a meeting when the lead is qualified and shows strong interest.',
            parameters: {
                type: 'object',
                properties: {
                    reason: { type: 'string', description: 'Why a meeting is recommended' },
                    suggestedTime: { type: 'string', description: 'Suggested meeting time or timeframe' },
                },
                required: ['reason'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'escalate_to_human',
            description: 'Escalate to a human sales rep when the lead requests it or the situation is too complex.',
            parameters: {
                type: 'object',
                properties: {
                    reason: { type: 'string', description: 'Why escalation is needed' },
                },
                required: ['reason'],
            },
        },
    },
];

export async function processAgentMessage(
    message: string,
    context: AgentContext
): Promise<AgentResponse> {
    const { agent, lead, conversationHistory, channel } = context;

    // Build a rich system prompt
    const systemPrompt = `You are ${agent.name}, an expert AI Hospital AI Assistant.

YOUR ROLE: ${agent.role}
${(agent as any).systemPrompt ? `\nSPECIAL INSTRUCTIONS: ${(agent as any).systemPrompt}` : ''}

YOUR GOAL: Qualify leads using the BANT framework (Budget, Authority, Need, Timeline) and book meetings with qualified prospects.

GUIDELINES:
- Be conversational, warm, and professional
- Ask one question at a time — never overwhelm the lead
- Listen carefully and acknowledge what they say before asking the next question
- Keep responses concise — 2 to 3 sentences maximum
- Naturally gather BANT information through conversation
- When you have enough info (2+ BANT criteria), call the qualify_lead tool
- When a lead shows strong buying intent, suggest booking a meeting
- If asked to speak to a human, use the escalate_to_human tool

CHANNEL: ${channel}

${lead
            ? `LEAD CONTEXT:
- Name: ${lead.firstName ?? 'Unknown'} ${lead.lastName ?? ''}
- Email: ${lead.email}
- Company: ${lead.company ?? 'Unknown'}
- Current Score: ${lead.score}/100
- Status: ${lead.status}
${(lead as any).qualificationNotes ? `- Previous Notes: ${(lead as any).qualificationNotes}` : ''}
${lead.painPoints?.length ? `- Known Pain Points: ${lead.painPoints.join(', ')}` : ''}`
            : 'NEW VISITOR: You do not know their name yet. Start by introducing yourself warmly and ask how you can help.'
        }`;

    // Build message history for context
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        // Include last 10 messages for context window efficiency
        ...conversationHistory.slice(-10).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        { role: 'user', content: message },
    ];

    // Call OpenAI
    //   const response = await openai.chat.completions.create({
    //     model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    //     messages,
    //     tools: AGENT_TOOLS,
    //     tool_choice: 'auto',
    //     max_tokens: 300,
    //     temperature: 0.7,
    //   });

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',  // free, fast, excellent for sales
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 300,
        temperature: 0.7,
    });

    const choice = response.choices[0];
    const toolCalls: ToolCall[] = [];
    const quickActions: QuickAction[] = [];
    let shouldQualify = false;
    let shouldBookMeeting = false;
    let shouldEscalate = false;
    let leadUpdates: Record<string, unknown> = {};

    // Process tool calls if any
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        for (const tc of choice.message.tool_calls) {
            const args = JSON.parse(tc.function.arguments);
            toolCalls.push({ id: tc.id, name: tc.function.name, arguments: args });

            if (tc.function.name === 'qualify_lead') {
                shouldQualify = true;
                const score =
                    (args.budgetScore ?? 0) +
                    (args.authorityScore ?? 0) +
                    (args.needScore ?? 0) +
                    (args.timelineScore ?? 0);

                leadUpdates = {
                    score,
                    tier: calculateLeadTier(score),
                    qualificationNotes: args.qualificationSummary ?? '',
                    painPoints: args.painPoints ?? [],
                    buyingSignals: args.buyingSignals ?? [],
                    status: score >= 60 ? 'QUALIFIED' : 'ENGAGED',
                };

                quickActions.push({
                    id: 'qualify',
                    label: `✅ Lead Scored ${score}/100`,
                    action: 'qualify',
                });
            }

            if (tc.function.name === 'book_meeting') {
                shouldBookMeeting = true;
                quickActions.push({
                    id: 'meeting',
                    label: '📅 Book a Meeting',
                    action: 'book_meeting',
                });
            }

            if (tc.function.name === 'escalate_to_human') {
                shouldEscalate = true;
                quickActions.push({
                    id: 'escalate',
                    label: '👤 Connect with Human',
                    action: 'escalate',
                });
            }
        }
    }

    // Get the text response
    const responseMessage =
        choice.message.content ??
        "I'm here to help! Could you tell me a bit more about what you're looking for?";

    return {
        message: responseMessage,
        shouldQualify,
        shouldBookMeeting,
        shouldEscalate,
        toolCalls,
        leadUpdates,
        quickActions,
    };
}
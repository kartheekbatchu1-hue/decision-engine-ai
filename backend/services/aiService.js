import { groq } from '../config/groq.js';

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    recommended_option_name: { type: 'string' },
    confidence_score: { type: 'number' },
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          alternative_name: { type: 'string' },
          total_weighted_score: { type: 'number' },
          criteria_breakdown: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                criterion_name: { type: 'string' },
                score_out_of_10: { type: 'number' },
                reasoning: { type: 'string' },
              },
              required: ['criterion_name', 'score_out_of_10', 'reasoning'],
            },
          },
        },
        required: ['alternative_name', 'total_weighted_score', 'criteria_breakdown'],
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          alternative_name: { type: 'string' },
          risk_factor: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          mitigation_strategy: { type: 'string' },
        },
        required: ['alternative_name', 'risk_factor', 'severity', 'mitigation_strategy'],
      },
    },
    executive_summary: { type: 'string' },
    trade_off_analysis: { type: 'string' },
    failure_modes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          alternative_name: { type: 'string' },
          failure_scenario: { type: 'string' },
          probability: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          impact: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
        required: ['alternative_name', 'failure_scenario', 'probability', 'impact'],
      },
    },
    action_plan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step_number: { type: 'number' },
          action: { type: 'string' },
          timeline: { type: 'string' },
          owner: { type: 'string' },
        },
        required: ['step_number', 'action', 'timeline', 'owner'],
      },
    },
  },
  required: [
    'recommended_option_name',
    'confidence_score',
    'scores',
    'risks',
    'executive_summary',
    'trade_off_analysis',
  ],
};

const SYSTEM_PROMPT = `You are DecisionEngine-Core, an elite AI Decision Scientist and Operations Research Architect.
Conduct rigorous Multi-Criteria Decision Analysis (MCDA), quantitative risk modeling, and trade-off evaluation.

Principles:
1. Objectivity — base scores strictly on provided data and objective industry standards.
2. Trade-Off Clarity — explicitly highlight what each alternative sacrifices.
3. Actionability — provide step-by-step mitigation for top risks.
4. Structured Response — return ONLY valid JSON matching the exact schema. No markdown wrapping, no extra prose outside the JSON object.`;

export async function analyzeDecisionModel(decisionData) {
  const userPrompt = `Analyze the following decision scenario with comprehensive MCDA:

**Problem Statement:** ${decisionData.problem_statement}
**Domain:** ${decisionData.domain}
**Urgency Level:** ${decisionData.urgency}

**Alternatives:**
${JSON.stringify(decisionData.alternatives, null, 2)}

**Decision Criteria & Weights (1–10, higher = more important):**
${JSON.stringify(decisionData.criteria, null, 2)}

Instructions:
1. Score each alternative against each criterion (0–10) with clear reasoning.
2. Calculate total_weighted_score = Σ(score × weight) / Σ(weights) for each alternative.
3. Identify 2–3 key risks per alternative with severity (LOW, MEDIUM, HIGH, CRITICAL) and actionable mitigation.
4. Provide a confidence_score (0–100) for your top recommendation.
5. Write an executive_summary (3–5 sentences) and a detailed trade_off_analysis.
6. Provide failure_modes (alternative_name, failure_scenario, probability [LOW, MEDIUM, HIGH], impact [LOW, MEDIUM, HIGH, CRITICAL]).
7. Provide a 5-step action_plan (step_number, action, timeline, owner).

You MUST return a JSON object with this exact structure:
{
  "recommended_option_name": "string",
  "confidence_score": 85,
  "scores": [
    {
      "alternative_name": "string",
      "total_weighted_score": 8.5,
      "criteria_breakdown": [
        { "criterion_name": "string", "score_out_of_10": 8, "reasoning": "string" }
      ]
    }
  ],
  "risks": [
    { "alternative_name": "string", "risk_factor": "string", "severity": "MEDIUM", "mitigation_strategy": "string" }
  ],
  "executive_summary": "string",
  "trade_off_analysis": "string",
  "failure_modes": [
    { "alternative_name": "string", "failure_scenario": "string", "probability": "LOW", "impact": "HIGH" }
  ],
  "action_plan": [
    { "step_number": 1, "action": "string", "timeline": "Week 1", "owner": "string" }
  ]
}`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq API');
  return JSON.parse(text);
}

export function simulateWeightedScores(scores, newWeights) {
  const weightMap = {};
  newWeights.forEach(w => { weightMap[w.name] = w.weight; });

  return scores.map(alt => {
    let totalWeighted = 0;
    let totalWeight = 0;

    alt.criteria_breakdown.forEach(cb => {
      const weight = weightMap[cb.criterion_name] ?? 5;
      totalWeighted += cb.score_out_of_10 * weight;
      totalWeight += weight;
    });

    return {
      alternative_name: alt.alternative_name,
      total_weighted_score: totalWeight > 0
        ? parseFloat((totalWeighted / totalWeight).toFixed(2))
        : 0,
      criteria_breakdown: alt.criteria_breakdown,
    };
  });
}

import { query, getClient } from '../config/db.js';
import { analyzeDecisionModel, simulateWeightedScores } from '../services/aiService.js';
// Groq SDK powers AI analysis — see services/aiService.js

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getUserId(req) {
  return req.headers['x-user-id'] || DEMO_USER_ID;
}

// POST /api/decisions
export async function createDecision(req, res) {
  const client = await getClient();
  try {
    const userId = getUserId(req);
    const { title, domain, urgency, problem_statement, alternatives, criteria } = req.validatedData;

    await client.query('BEGIN');

    const decisionResult = await client.query(
      `INSERT INTO decision_models (user_id, title, domain, urgency, problem_statement, status)
       VALUES ($1, $2, $3, $4, $5, 'DRAFT') RETURNING *`,
      [userId, title, domain, urgency, problem_statement]
    );

    const decision = decisionResult.rows[0];
    const decisionId = decision.id;

    const insertedAlternatives = [];
    for (const alt of alternatives) {
      const r = await client.query(
        `INSERT INTO decision_alternatives (decision_id, name, description, estimated_cost, time_to_implement_weeks)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [decisionId, alt.name, alt.description || null, alt.estimated_cost ?? null, alt.time_to_implement_weeks ?? null]
      );
      insertedAlternatives.push(r.rows[0]);
    }

    const insertedCriteria = [];
    for (const crit of criteria) {
      const r = await client.query(
        `INSERT INTO decision_criteria (decision_id, name, weight, is_maximize)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [decisionId, crit.name, crit.weight, crit.is_maximize !== false]
      );
      insertedCriteria.push(r.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { ...decision, alternatives: insertedAlternatives, criteria: insertedCriteria },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createDecision error:', err);
    res.status(500).json({ error: 'Failed to create decision', details: err.message });
  } finally {
    client.release();
  }
}

// GET /api/decisions
export async function getDecisions(req, res) {
  try {
    const userId = getUserId(req);
    const result = await query(
      `SELECT dm.*,
        COUNT(DISTINCT da.id)::int AS alternative_count,
        COUNT(DISTINCT dc.id)::int AS criteria_count,
        (SELECT id FROM decision_analyses WHERE decision_id = dm.id ORDER BY created_at DESC LIMIT 1) AS latest_analysis_id
       FROM decision_models dm
       LEFT JOIN decision_alternatives da ON da.decision_id = dm.id
       LEFT JOIN decision_criteria dc ON dc.decision_id = dm.id
       WHERE dm.user_id = $1
       GROUP BY dm.id
       ORDER BY dm.updated_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getDecisions error:', err);
    res.status(500).json({ error: 'Failed to fetch decisions', details: err.message });
  }
}

// GET /api/decisions/:id
export async function getDecisionById(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const decisionResult = await query(
      `SELECT * FROM decision_models WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!decisionResult.rows.length) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const decision = decisionResult.rows[0];
    const [alts, crits, analyses] = await Promise.all([
      query(`SELECT * FROM decision_alternatives WHERE decision_id = $1 ORDER BY created_at`, [id]),
      query(`SELECT * FROM decision_criteria WHERE decision_id = $1 ORDER BY created_at`, [id]),
      query(`SELECT * FROM decision_analyses WHERE decision_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]),
    ]);

    res.json({
      success: true,
      data: {
        ...decision,
        alternatives: alts.rows,
        criteria: crits.rows,
        analysis: analyses.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('getDecisionById error:', err);
    res.status(500).json({ error: 'Failed to fetch decision', details: err.message });
  }
}

// POST /api/decisions/:id/analyze
export async function analyzeDecision(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const decisionResult = await query(
      `SELECT * FROM decision_models WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (!decisionResult.rows.length) return res.status(404).json({ error: 'Decision not found' });

    const decision = decisionResult.rows[0];
    const [alts, crits] = await Promise.all([
      query(`SELECT * FROM decision_alternatives WHERE decision_id = $1`, [id]),
      query(`SELECT * FROM decision_criteria WHERE decision_id = $1`, [id]),
    ]);

    if (alts.rows.length < 2) {
      return res.status(400).json({ error: 'At least 2 alternatives are required for analysis' });
    }

    const aiResult = await analyzeDecisionModel({
      problem_statement: decision.problem_statement,
      domain: decision.domain,
      urgency: decision.urgency,
      alternatives: alts.rows,
      criteria: crits.rows,
    });

    const recommendedAlt = alts.rows.find(
      a => a.name.toLowerCase() === aiResult.recommended_option_name.toLowerCase()
    );

    const analysisResult = await query(
      `INSERT INTO decision_analyses
        (decision_id, recommended_option_id, overall_confidence_score, mcda_scores, risk_assessment, explainable_recommendation, raw_ai_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        recommendedAlt?.id || null,
        aiResult.confidence_score,
        JSON.stringify(aiResult.scores),
        JSON.stringify(aiResult.risks),
        JSON.stringify({
          executive_summary: aiResult.executive_summary,
          trade_off_analysis: aiResult.trade_off_analysis,
          failure_modes: aiResult.failure_modes || [],
          action_plan: aiResult.action_plan || [],
        }),
        JSON.stringify(aiResult),
      ]
    );

    await query(
      `UPDATE decision_models SET status = 'ANALYZED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, data: { analysis: analysisResult.rows[0], aiResult } });
  } catch (err) {
    console.error('analyzeDecision error:', err);
    if (err.message?.includes('API_KEY') || err.message?.includes('credentials') || err.message?.includes('API key')) {
      return res.status(503).json({ error: 'AI service unavailable. Please configure a valid GEMINI_API_KEY.' });
    }
    res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
}

// POST /api/decisions/:id/simulate
export async function simulateDecision(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { criteria_weights, scores } = req.body;

    const decisionResult = await query(
      `SELECT * FROM decision_models WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (!decisionResult.rows.length) return res.status(404).json({ error: 'Decision not found' });

    if (!criteria_weights || !scores) {
      return res.status(400).json({ error: 'criteria_weights and scores are required' });
    }

    const simulated = simulateWeightedScores(scores, criteria_weights);
    const sorted = [...simulated].sort((a, b) => b.total_weighted_score - a.total_weighted_score);

    res.json({
      success: true,
      data: {
        simulated_scores: sorted,
        recommended_option: sorted[0]?.alternative_name,
        criteria_weights,
      },
    });
  } catch (err) {
    console.error('simulateDecision error:', err);
    res.status(500).json({ error: 'Simulation failed', details: err.message });
  }
}

// DELETE /api/decisions/:id
export async function deleteDecision(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await query(
      `DELETE FROM decision_models WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Decision not found' });
    res.json({ success: true, message: 'Decision deleted successfully' });
  } catch (err) {
    console.error('deleteDecision error:', err);
    res.status(500).json({ error: 'Failed to delete decision', details: err.message });
  }
}

// PATCH /api/decisions/:id/status
export async function updateDecisionStatus(req, res) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'ANALYZED', 'EXECUTED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }
    const result = await query(
      `UPDATE decision_models SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Decision not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateDecisionStatus error:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
}


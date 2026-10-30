import { supabase } from '../config/db.js';
import { analyzeDecisionModel, simulateWeightedScores } from '../services/aiService.js';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

function getUserId(req) {
  return req.headers['x-user-id'] || DEMO_USER_ID;
}

// POST /api/decisions
export async function createDecision(req, res) {
  try {
    const userId = getUserId(req);
    const { title, domain, urgency, problem_statement, alternatives, criteria } = req.validatedData;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    // 1. Insert decision model
    const { data: decision, error: dmError } = await supabase
      .from('decision_models')
      .insert({
        user_id: userId,
        title,
        domain,
        urgency,
        problem_statement,
        status: 'DRAFT',
      })
      .select()
      .single();

    if (dmError) throw dmError;

    const decisionId = decision.id;

    // 2. Insert alternatives
    const altsToInsert = alternatives.map(alt => ({
      decision_id: decisionId,
      name: alt.name,
      description: alt.description || null,
      estimated_cost: alt.estimated_cost ?? null,
      time_to_implement_weeks: alt.time_to_implement_weeks ?? null,
    }));

    const { data: insertedAlternatives, error: altError } = await supabase
      .from('decision_alternatives')
      .insert(altsToInsert)
      .select();

    if (altError) throw altError;

    // 3. Insert criteria
    const critsToInsert = criteria.map(crit => ({
      decision_id: decisionId,
      name: crit.name,
      weight: crit.weight,
      is_maximize: crit.is_maximize !== false,
    }));

    const { data: insertedCriteria, error: critError } = await supabase
      .from('decision_criteria')
      .insert(critsToInsert)
      .select();

    if (critError) throw critError;

    res.status(201).json({
      success: true,
      data: {
        ...decision,
        alternatives: insertedAlternatives || [],
        criteria: insertedCriteria || [],
      },
    });
  } catch (err) {
    console.error('createDecision error:', err);
    res.status(500).json({ error: 'Failed to create decision', details: err.message });
  }
}

// GET /api/decisions
export async function getDecisions(req, res) {
  try {
    const userId = getUserId(req);

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const { data: decisions, error } = await supabase
      .from('decision_models')
      .select(`
        *,
        decision_alternatives(id),
        decision_criteria(id),
        decision_analyses(id, created_at)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const formatted = (decisions || []).map(dm => {
      const analyses = dm.decision_analyses || [];
      analyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return {
        ...dm,
        alternative_count: dm.decision_alternatives?.length || 0,
        criteria_count: dm.decision_criteria?.length || 0,
        latest_analysis_id: analyses[0]?.id || null,
      };
    });

    res.json({ success: true, data: formatted });
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

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const { data: decision, error: dmError } = await supabase
      .from('decision_models')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (dmError || !decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const [
      { data: alternatives, error: altErr },
      { data: criteria, error: critErr },
      { data: analyses, error: anErr },
    ] = await Promise.all([
      supabase.from('decision_alternatives').select('*').eq('decision_id', id).order('created_at'),
      supabase.from('decision_criteria').select('*').eq('decision_id', id).order('created_at'),
      supabase.from('decision_analyses').select('*').eq('decision_id', id).order('created_at', { ascending: false }).limit(1),
    ]);

    if (altErr) throw altErr;
    if (critErr) throw critErr;

    res.json({
      success: true,
      data: {
        ...decision,
        alternatives: alternatives || [],
        criteria: criteria || [],
        analysis: analyses?.[0] || null,
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

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const { data: decision, error: dmError } = await supabase
      .from('decision_models')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (dmError || !decision) return res.status(404).json({ error: 'Decision not found' });

    const [
      { data: alternatives },
      { data: criteria },
    ] = await Promise.all([
      supabase.from('decision_alternatives').select('*').eq('decision_id', id),
      supabase.from('decision_criteria').select('*').eq('decision_id', id),
    ]);

    const alts = alternatives || [];
    const crits = criteria || [];

    if (alts.length < 2) {
      return res.status(400).json({ error: 'At least 2 alternatives are required for analysis' });
    }

    const aiResult = await analyzeDecisionModel({
      problem_statement: decision.problem_statement,
      domain: decision.domain,
      urgency: decision.urgency,
      alternatives: alts,
      criteria: crits,
    });

    const recommendedAlt = alts.find(
      a => a.name.toLowerCase() === aiResult.recommended_option_name.toLowerCase()
    );

    const { data: analysis, error: anError } = await supabase
      .from('decision_analyses')
      .insert({
        decision_id: id,
        recommended_option_id: recommendedAlt?.id || null,
        overall_confidence_score: aiResult.confidence_score,
        mcda_scores: aiResult.scores,
        risk_assessment: aiResult.risks,
        explainable_recommendation: {
          executive_summary: aiResult.executive_summary,
          trade_off_analysis: aiResult.trade_off_analysis,
          failure_modes: aiResult.failure_modes || [],
          action_plan: aiResult.action_plan || [],
        },
        raw_ai_response: aiResult,
      })
      .select()
      .single();

    if (anError) throw anError;

    await supabase
      .from('decision_models')
      .update({ status: 'ANALYZED', updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, data: { analysis, aiResult } });
  } catch (err) {
    console.error('analyzeDecision error:', err);
    if (err.message?.includes('API_KEY') || err.message?.includes('credentials') || err.message?.includes('API key')) {
      return res.status(503).json({ error: 'AI service unavailable. Please check your GROQ_API_KEY in backend/.env' });
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

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const { data: decision, error } = await supabase
      .from('decision_models')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !decision) return res.status(404).json({ error: 'Decision not found' });

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

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const { data, error } = await supabase
      .from('decision_models')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Decision not found' });

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

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured' });
    }

    const validStatuses = ['DRAFT', 'ANALYZED', 'EXECUTED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const { data, error } = await supabase
      .from('decision_models')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Decision not found' });

    res.json({ success: true, data });
  } catch (err) {
    console.error('updateDecisionStatus error:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
}

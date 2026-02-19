// ─── CRM Types ───────────────────────────────────────────

export type Market = string;

export type ProspectCategory = string;

export type PipelineStage =
    | "new_lead"
    | "contacted"
    | "follow_up"
    | "responded"
    | "discovery"
    | "proposal_sent"
    | "negotiation"
    | "won"
    | "project_started"
    | "lost"
    | "nurture";

export type LeadSource = "Manual" | "CSV Import" | "Referral" | "Website";

export type ProspectStatus =
    | "not_contacted"
    | "contacted"
    | "responded"
    | "no_response"
    | "deal_closed"
    | "project_started"
    | "lost";

export type LossReason =
    | "budget"
    | "timing"
    | "competitor"
    | "no_response"
    | "not_interested";

export type CrmActivityType =
    | "email_sent"
    | "call_made"
    | "call_received"
    | "email_received"
    | "note_added"
    | "meeting"
    | "follow_up_sent"
    | "auto_follow_up"
    | "auto_thank_you"
    | "stage_changed"
    | "other";

export type ActivityOutcome =
    | "positive"
    | "neutral"
    | "negative"
    | "no_response"
    | "voicemail"
    | "scheduled_follow_up";

export type TemplateCategory =
    | "Cold Intro"
    | "Follow-Up"
    | "Value Add"
    | "Case Study"
    | "Re-Engagement"
    | "Thank You"
    | "Welcome"
    | "Kickoff"
    | "Custom";

export type SendStatus = "sent" | "opened" | "replied" | "bounced";

export type ReplySentiment = "positive" | "neutral" | "negative" | "not_applicable";

// ─── Serialized types (for client-side use) ──────────────

export interface Prospect {
    _id: string;
    business_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    market: Market;
    category: ProspectCategory;
    weakness_score: number;
    weakness_notes?: string;
    google_rating?: number;
    review_count?: number;
    social_facebook?: string;
    social_instagram?: string;
    social_linkedin?: string;
    est_revenue?: string;
    est_employees?: string;
    lead_source: LeadSource;
    referral_source?: string;
    pipeline_stage: PipelineStage;
    contacted: boolean;
    contacted_at?: string;
    responded: boolean;
    responded_at?: string;
    deal_closed: boolean;
    deal_closed_at?: string;
    project_started: boolean;
    project_started_at?: string;
    inputted_by: { _id: string; name: string; image?: string } | string;
    assigned_to: { _id: string; name: string; image?: string } | string;
    tags: string[];
    notes?: string;
    loss_reason?: LossReason;
    nurture_date?: string;
    follow_up_paused: boolean;
    last_auto_email_at?: string;
    follow_up_step: number;
    createdAt: string;
    updatedAt: string;
}

export interface PipelineHistoryEntry {
    _id: string;
    prospect_id: string;
    from_stage: PipelineStage;
    to_stage: PipelineStage;
    changed_by: { _id: string; name: string } | string;
    notes?: string;
    createdAt: string;
}

export interface CrmActivity {
    _id: string;
    prospect_id: string;
    performed_by: { _id: string; name: string; image?: string } | string;
    activity_type: CrmActivityType;
    subject: string;
    details?: string;
    template_id?: string;
    outcome?: ActivityOutcome;
    follow_up_date?: string;
    is_automated: boolean;
    createdAt: string;
}

export interface Template {
    _id: string;
    name: string;
    subject_line: string;
    body: string;
    category: TemplateCategory;
    target_industry?: string;
    is_auto_template: boolean;
    auto_trigger?: string;
    tags: string[];
    created_by: { _id: string; name: string } | string;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateSend {
    _id: string;
    template_id: string;
    prospect_id: string;
    sent_by: { _id: string; name: string } | string;
    sent_at: string;
    is_automated: boolean;
    status: SendStatus;
    replied_at?: string;
    reply_sentiment?: ReplySentiment;
    notes?: string;
}

export interface AutomationConfig {
    _id: string;
    trigger_name: string;
    enabled: boolean;
    template_id?: string;
    delay_days?: number;
    target_category?: ProspectCategory;
    createdAt: string;
}

// ─── Filter / Query types ────────────────────────────────

export interface ProspectFilters {
    market: string | "all";
    category: string | "all";
    pipeline_stage: PipelineStage | "all";
    weakness_score_min: number;
    weakness_score_max: number;
    contacted: "all" | "yes" | "no";
    responded: "all" | "yes" | "no";
    deal_closed: "all" | "yes" | "no";
    assigned_to: string | "all" | "mine";
    lead_source: LeadSource | "all";
    search: string;
}

export interface ProspectSort {
    field: "weakness_score" | "business_name" | "createdAt" | "pipeline_stage" | "contacted_at";
    direction: "asc" | "desc";
}

export type ProspectViewMode = "list" | "card";

// ─── Pipeline column helper ──────────────────────────────

export interface PipelineColumn {
    stage: PipelineStage;
    label: string;
    prospects: Prospect[];
    count: number;
}

// ─── Template performance stats ──────────────────────────

export interface TemplateStats {
    templateId: string;
    name: string;
    totalSends: number;
    manualSends: number;
    autoSends: number;
    replyCount: number;
    replyRate: number;
    positiveReplyRate: number;
    bestIndustry?: string;
    lastUsed?: string;
}

export interface OutreachStats {
    totalSentThisWeek: number;
    totalSentThisMonth: number;
    manualSends: number;
    autoSends: number;
    overallReplyRate: number;
    topTemplates: TemplateStats[];
    bottomTemplates: TemplateStats[];
}

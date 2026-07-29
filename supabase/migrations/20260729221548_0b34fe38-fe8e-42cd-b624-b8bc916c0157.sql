
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT,
  bio TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 5000,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    split_part(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  creator TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  accent TEXT NOT NULL DEFAULT 'blue',
  version TEXT NOT NULL DEFAULT 'v1.0.0',
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  launches INTEGER NOT NULL DEFAULT 0,
  runtime TEXT NOT NULL DEFAULT '< 5s',
  token_cost INTEGER NOT NULL DEFAULT 100,
  success_rate NUMERIC(4,1) NOT NULL DEFAULT 99.0,
  tier TEXT NOT NULL DEFAULT 'free',
  featured BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automations TO anon;
GRANT SELECT ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_public_read" ON public.automations FOR SELECT USING (true);

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, automation_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'success',
  tokens_used INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.executions TO authenticated;
GRANT ALL ON public.executions TO service_role;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "executions_select_own" ON public.executions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "executions_insert_own" ON public.executions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO public.automations (slug, name, tagline, description, category, creator, icon, accent, rating, launches, runtime, token_cost, success_rate, tier, featured, trending) VALUES
('predictive-analytics-v2','Predictive Analytics V2','LLM orchestration engine for real-time market forecasting.','A highly optimized LLM orchestration engine for real-time market forecasting. Utilizes low-latency vector embeddings for millisecond-precise decision making in high-throughput environments. Feed it a market, a time horizon and a set of signals, and it returns a structured forecast with confidence intervals and the reasoning trail behind every call.','Data Analysis','Nexus Labs','line-chart','blue',4.9,24800,'< 12s',820,99.6,'pro',true,true),
('lead-generation-scraper','Lead Generation Scraper','Extract enriched B2B leads from any target domain.','Crawls a target domain and returns enriched contact records: name, title, company, location and verified email. Filter by seniority, industry and headcount, then push results straight into your CRM.','Lead Generation','GrowthOps','users','emerald',4.7,12482,'< 4s',450,99.4,'pro',false,true),
('email-sentiment-classifier','Email Sentiment Classifier','Score inbound email tone and urgency in real time.','Classifies inbound support and sales email by sentiment, urgency and intent so routing rules can escalate the right conversations first.','Customer Support','Nexus Labs','mail','indigo',4.8,42100,'< 900ms',60,99.9,'free',false,true),
('postgres-vector-sync','PostgreSQL Vector Sync','Keep your Postgres tables embedded and searchable.','Watches selected Postgres tables, generates embeddings on change and keeps a vector index perfectly in sync for retrieval-augmented workflows.','Development','DataNexus','database','violet',4.6,8900,'< 30s',300,99.2,'pro',false,false),
('competitor-price-tracker','Competitor Price Tracker','Daily price intelligence across competitor catalogs.','Monitors competitor product pages on a schedule, normalises currencies and alerts you the moment a tracked SKU moves outside your guardrails.','Marketing','TrackWise','activity','amber',4.5,6400,'< 20s',260,98.8,'pro',false,false),
('legal-document-summarizer','Legal Document Summarizer','Contract summaries with clause-level risk flags.','Ingests contracts and long-form legal PDFs and returns an executive summary, obligations table and clause-level risk flags with page citations.','Documents','LexFlow','file-text','slate',4.8,15200,'< 15s',540,99.1,'pro',false,true),
('seo-content-brief','SEO Content Brief Generator','Rank-ready briefs from a single keyword.','Analyses the live SERP for a keyword, extracts entity coverage and outputs a full content brief: outline, questions to answer, internal links and target word count.','SEO','RankForge','search','blue',4.7,19800,'< 8s',320,99.3,'free',false,true),
('social-post-studio','Social Post Studio','One idea, twelve platform-native posts.','Turns a single idea, link or transcript into platform-native posts for LinkedIn, X, Instagram and TikTok, with hooks and hashtag sets tuned per channel.','Social Media','Creator Cloud','share-2','pink',4.6,31500,'< 6s',180,99.5,'free',false,true),
('invoice-data-extractor','Invoice Data Extractor','Structured JSON from any invoice PDF or photo.','OCR plus schema-guided extraction that turns messy invoices into clean, validated JSON ready for your accounting ledger.','Finance','LedgerAI','receipt','emerald',4.9,27400,'< 5s',140,99.7,'pro',false,false),
('image-upscaler-pro','Image Upscaler Pro','4x upscaling with detail reconstruction.','Upscales product and marketing imagery up to 4x, reconstructing fine detail and cleaning compression artefacts without the plastic look.','Image Generation','PixelForge','image','violet',4.7,52300,'< 10s',220,99.4,'pro',false,true),
('video-clip-cutter','Video Clip Cutter','Auto-cut long video into short-form clips.','Transcribes long-form video, finds the highest-retention moments and exports vertical clips with burned-in captions.','Video','ReelWorks','video','pink',4.5,11800,'< 90s',960,98.4,'pro',false,false),
('meeting-notes-agent','Meeting Notes Agent','Decisions, owners and follow-ups from any recording.','Takes a meeting recording or transcript and returns a clean summary, decision log and assigned action items pushed to your task tracker.','Productivity','Nexus Labs','notebook-pen','indigo',4.8,38700,'< 25s',380,99.6,'free',false,true),
('cold-outreach-writer','Cold Outreach Writer','Personalised sequences from a lead record.','Researches a prospect from a lead record and writes a four-touch outreach sequence grounded in real, verifiable context.','Sales','GrowthOps','send','amber',4.4,16900,'< 7s',210,98.9,'pro',false,false),
('blog-article-engine','Blog Article Engine','Long-form drafts with sources and structure.','Generates structured long-form drafts from a brief, with cited sources, internal link suggestions and an editable outline.','Content','Creator Cloud','pen-tool','blue',4.6,44200,'< 40s',700,99.0,'pro',false,true),
('churn-risk-scorer','Churn Risk Scorer','Rank accounts by likelihood to churn.','Blends product usage, support tone and billing signals to score every account for churn risk with the top contributing factors.','Data Analysis','TrackWise','trending-down','slate',4.7,7300,'< 18s',410,99.2,'enterprise',false,false),
('ticket-auto-responder','Ticket Auto Responder','Draft grounded replies to support tickets.','Drafts replies to inbound support tickets grounded in your help centre, with a confidence score and a human-approval gate.','Customer Support','Helpdesk AI','life-buoy','emerald',4.5,29600,'< 3s',120,99.5,'free',false,false),
('newsletter-digest','Newsletter Digest','Weekly digest assembled from your sources.','Pulls from your feeds, newsletters and saved links, then assembles a ready-to-send weekly digest in your own editorial voice.','Email','Creator Cloud','newspaper','indigo',4.4,9100,'< 22s',290,99.1,'free',false,false),
('workflow-orchestrator','Workflow Orchestrator','Chain automations into one reliable pipeline.','Chains multiple automations into a single pipeline with branching, retries, and per-step observability across every run.','Automation','Nexus Labs','workflow','violet',4.8,13400,'< 60s',640,99.3,'enterprise',false,true);

-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS tokens bigint NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS monthly_tokens_used bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens_used bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

UPDATE public.profiles p
SET email = COALESCE(p.email, u.email),
    display_name = COALESCE(p.display_name, p.full_name, split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.id = p.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_subscription_idx ON public.profiles (subscription);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, display_name, full_name, username, avatar_url, provider,
    tokens, subscription, role, status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    split_part(NEW.email, '@', 1),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    100000, 'free', 'user', 'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Protect privileged columns from user updates
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('app.privileged', true) = 'on' THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.tokens := OLD.tokens;
  NEW.subscription := OLD.subscription;
  NEW.status := OLD.status;
  NEW.total_tokens_used := OLD.total_tokens_used;
  NEW.monthly_tokens_used := OLD.monthly_tokens_used;
  NEW.email := OLD.email;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_profile_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 4. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_auth ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 5. Token operations (privileged, server-side only)
CREATE OR REPLACE FUNCTION public.add_tokens(_user_id uuid, _amount bigint)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r public.profiles;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.profiles SET tokens = tokens + _amount WHERE id = _user_id RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'profile not found'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.remove_tokens(_user_id uuid, _amount bigint)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r public.profiles;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.profiles SET tokens = tokens - _amount
  WHERE id = _user_id AND tokens >= _amount RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'insufficient tokens'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _amount bigint)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r public.profiles;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.profiles
  SET tokens = tokens - _amount,
      monthly_tokens_used = monthly_tokens_used + _amount,
      total_tokens_used = total_tokens_used + _amount
  WHERE id = _user_id AND tokens >= _amount RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'insufficient tokens'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage(_user_id uuid)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r public.profiles;
BEGIN
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.profiles SET monthly_tokens_used = 0 WHERE id = _user_id RETURNING * INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'profile not found'; END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.touch_last_login(_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.profiles SET last_login_at = now() WHERE id = _user_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.add_tokens(uuid, bigint) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_tokens(uuid, bigint) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, bigint) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_usage(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_last_login(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_tokens(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_tokens(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_monthly_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_last_login(uuid) TO service_role;
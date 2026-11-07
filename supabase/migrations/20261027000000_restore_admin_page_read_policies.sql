-- Repair admin data pages after RLS has been enabled without read policies.
-- Only allowlisted admin tables with RLS enabled and no SELECT/ALL policy
-- are changed. Existing policies, RLS settings, and write access are preserved.
-- Run in the teaching project's SQL Editor. No service-role key is needed.

BEGIN;

DO $admin_reads$
DECLARE
  table_name text;
  table_oid regclass;
BEGIN
  IF to_regprocedure('public.is_superadmin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'The restored public.is_superadmin(uuid) function is missing. Complete the schema restore first.';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'communities',
    'community_contexts',
    'community_context_tags',
    'community_context_tag_mappings',
    'humor_flavors',
    'humor_flavor_steps',
    'humor_flavor_step_types',
    'humor_flavor_theme_mappings',
    'humor_flavor_mix',
    'humor_themes',
    'image_humor_potential_prompts',
    'llm_models',
    'llm_providers',
    'llm_input_types',
    'llm_output_types',
    'llm_prompt_chains',
    'llm_model_responses',
    'studies',
    'study_image_sets',
    'study_image_set_image_mappings',
    'study_caption_mappings',
    'experiments',
    'experiment_scorecards',
    'experiment_findings'
  ]
  LOOP
    table_oid := to_regclass(format('public.%I', table_name));
    IF table_oid IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = table_oid) THEN
      CONTINUE;
    END IF;

    -- Do not override tables that already have an explicit read policy.
    IF EXISTS (
      SELECT 1 FROM pg_policy
      WHERE polrelid = table_oid AND polcmd IN ('r', '*')
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format(
      'CREATE POLICY "Superadmins can read admin page data" ON public.%I
       FOR SELECT TO authenticated
       USING (
         (SELECT public.is_superadmin(auth.uid()))
         AND coalesce(((SELECT auth.jwt()) ->> ''is_anonymous'')::boolean, false) IS FALSE
       )',
      table_name
    );
  END LOOP;
END;
$admin_reads$;

COMMIT;

-- Display the policies created by this repair. Refresh the admin pages after it.
SELECT tablename AS table_name, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname = 'Superadmins can read admin page data'
ORDER BY tablename;

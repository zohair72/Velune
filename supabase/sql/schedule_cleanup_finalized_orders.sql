create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'velune-cleanup-finalized-orders'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end
$$;

select cron.schedule(
  'velune-cleanup-finalized-orders',
  '17 3 * * *',
  $$
  select
    net.http_post(
      url := 'https://xznobgytijzhqcceotqy.supabase.co/functions/v1/cleanup-finalized-orders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'velune_cleanup_service_role_key'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $$
);

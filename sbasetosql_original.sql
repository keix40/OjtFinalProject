-- MySQL Compatible SQL Schema
-- Converted from PostgreSQL to MySQL
-- Removed PostgreSQL-specific syntax and converted data types

-- Create the main Ecommerce database
CREATE DATABASE IF NOT EXISTS `Ecommerce`;
USE `Ecommerce`;



--
-- SQLINES DEMO ***  SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `auth`;
USE `auth`;



--
-- SQLINES DEMO ***  Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE DATABASE IF NOT EXISTS `extensions`;
USE `extensions`;



--
-- SQLINES DEMO *** pe: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `graphql`;
USE `graphql`;



--
-- SQLINES DEMO *** lic; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `graphql_public`;
USE `graphql_public`;



--
-- SQLINES DEMO *** Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE DATABASE IF NOT EXISTS `pgbouncer`;
USE `pgbouncer`;



--
-- SQLINES DEMO *** ype: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `realtime`;
USE `realtime`;



--
-- SQLINES DEMO *** pe: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `storage`;
USE `storage`;



--
-- SQLINES DEMO *** : SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE DATABASE IF NOT EXISTS `vault`;
USE `vault`;



--
-- SQLINES DEMO ***  Type: EXTENSION; Schema: -; Owner: -
--



--
-- SQLINES DEMO *** g_graphql; Type: COMMENT; Schema: -; Owner: 
--



--
-- SQLINES DEMO *** tements; Type: EXTENSION; Schema: -; Owner: -
--



--
-- SQLINES DEMO *** g_stat_statements; Type: COMMENT; Schema: -; Owner: 
--



--
-- SQLINES DEMO *** ype: EXTENSION; Schema: -; Owner: -
--



--
-- SQLINES DEMO *** gcrypto; Type: COMMENT; Schema: -; Owner: 
--



--
-- SQLINES DEMO *** ult; Type: EXTENSION; Schema: -; Owner: -
--



--
-- SQLINES DEMO *** upabase_vault; Type: COMMENT; Schema: -; Owner: 
--



--
-- SQLINES DEMO *** Type: EXTENSION; Schema: -; Owner: -
--



--
-- SQLINES DEMO *** uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--



-- Note: MySQL doesn't support CREATE TYPE for ENUMs
-- These ENUM values will be used directly in table definitions:
-- auth_aal_level: ENUM('aal1', 'aal2', 'aal3')

-- auth_code_challenge_method: ENUM('s256', 'plain')

-- auth_factor_status: ENUM('unverified', 'verified')

-- auth_factor_type: ENUM('totp', 'webauthn', 'phone')

-- auth_one_time_token_type: ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token')

-- realtime_action: ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR')

-- realtime_equality_op: ENUM('eq', 'neq', 'lt', 'lte', 'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

-- realtime_user_defined_filter: This will be handled as separate columns in table definitions
-- column_name: TEXT
-- op: ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in')
-- value: TEXT

-- realtime_wal_column: This will be handled as separate columns in table definitions
-- name: TEXT
-- type_name: TEXT
-- type_oid: INT
-- value: JSON
-- is_pkey: BOOLEAN
-- is_selectable: BOOLEAN

-- realtime_wal_rls: This will be handled as separate columns in table definitions
-- wal: JSON
-- is_rls_enabled: BOOLEAN
-- subscription_ids: TEXT (comma-separated values)
-- errors: TEXT (comma-separated values)

--
-- SQLINES DEMO *** pe: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql
 begin STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    JSON_EXTRACT(nullif(current_setting('request.jwt.claims', true), ''), '$.email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER
 BEGIN TO supabase_auth_admin;

--
-- SQLINES DEMO *** ail(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- SQLINES DEMO *** : FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql
 begin STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )
$$;


ALTER FUNCTION auth.jwt() OWNER
 BEGIN TO supabase_auth_admin;

--
-- SQLINES DEMO *** e: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql
 begin STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    JSON_EXTRACT(nullif(current_setting('request.jwt.claims', true), ''), '$.role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER
 BEGIN TO supabase_auth_admin;

--
-- SQLINES DEMO *** le(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- SQLINES DEMO *** : FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql
 begin STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    JSON_EXTRACT(nullif(current_setting('request.jwt.claims', true), ''), '$.sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER
 BEGIN TO supabase_auth_admin;

--
-- SQLINES DEMO *** d(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- SQLINES DEMO *** on_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END; IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** ant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- SQLINES DEMO *** aphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
    BEGIN $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- SQLINES DEMO *** pper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as
        begin
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- SQLINES DEMO *** s when `graphql.resolve` is created. That is not necessarily the last
        -- SQLINES DEMO *** xtension so we need to grant permissions on existing entities AND
        -- SQLINES DEMO *** rmissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- SQLINES DEMO *** le to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** ant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- SQLINES DEMO *** t_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- SQLINES DEMO *** se on existing projects as of 2025-02-20
      -- SQLINES DEMO *** wards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY
 BEGIN DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY
 BEGIN DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET
 BEGIN search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET
 BEGIN search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$


ALTER FUNCTION extensions.grant_pg_net_access() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** ant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- SQLINES DEMO *** atch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
    BEGIN
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- SQLINES DEMO *** ase of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
    BEGIN
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no... SQLINES DEMO ***
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** _placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS
    BEGIN $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as
        begin
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** t_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- SQLINES DEMO *** xt); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE
 BEGIN(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** sonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF
 BEGIN realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- SQLINES DEMO *** able e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- SQLINES DEMO *** t, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- SQLINES DEMO *** rity enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Su... SQLINES DEMO ***
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- SQLINES DEMO *** or wal's columns
columns realtime.wal_column[];
-- SQLINES DEMO ***  values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- SQLINES DEMO *** put for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') -->> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- SQLINES DEMO *** n version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') -->> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- SQLINES DEMO *** n version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- SQLINES DEMO *** able` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- SQLINES DEMO *** already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- SQLINES DEMO *** oes not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- SQLINES DEMO *** for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- SQLINES DEMO *** t, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- SQLINES DEMO *** key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- SQLINES DEMO *** e can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- SQLINES DEMO *** ed statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- SQLINES DEMO *** ws the role to see the record
                perform
                    -- SQLINES DEMO *** trailing quotes from working_role because set_config
                    -- SQLINES DEMO ***  the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** hanges(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE PROCEDURE realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)
    LANGUAGE plpgsql
    AS
    BEGIN
DECLARE
    -- SQLINES DEMO *** e to hold the JSONB representation of the row
    row_data JSON := '{}';
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- SQLINES DEMO *** on type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** red_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]
Begin) RETURNS text
    LANGUAGE sql
    AS $$
      /* SQLINES DEMO *** sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value -->> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for in filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql
 begin IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER
 BEGIN TO supabase_admin;

--
-- SQLINES DEMO *** pe: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql
 begin STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER
 BEGIN TO supabase_realtime_admin;

--
-- SQLINES DEMO *** object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE PROCEDURE storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
    LANGUAGE plpgsql
    AS
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- SQLINES DEMO *** the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END;
$$


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** ext); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS
    BEGIN
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- SQLINES DEMO *** last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** xt); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS
    BEGIN
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text
 begin[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** _bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE
 BEGIN(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** art_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE
 BEGIN(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key /* COLLATE "C" */) * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) /* COLLATE "C" */ > $4
                            ELSE
                                key /* COLLATE "C" */ > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id /* COLLATE "C" */ > $6
                    ELSE
                        true
                    END
            ORDER BY
                key /* COLLATE "C" */ ASC, created_at ASC) as e order by key /* COLLATE "C" */ LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** s_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE
 BEGIN(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name /* COLLATE "C" */) * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name /* COLLATE "C" */ > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) /* COLLATE "C" */ > $4
                            ELSE
                                name /* COLLATE "C" */ > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name /* COLLATE "C" */ ASC) as e order by name /* COLLATE "C" */ LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** ; Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql
 begin STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** , text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE
 BEGIN(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER
 BEGIN TO supabase_storage_admin;

--
-- SQLINES DEMO *** ted_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$


ALTER FUNCTION storage.update_updated_at_column() OWNER
 BEGIN TO supabase_storage_admin;

-- MySQL doesn't use these PostgreSQL-specific settings

--
-- SQLINES DEMO *** ntries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id CHAR(36),
    id CHAR(36) NOT NULL,
    payload JSON,
    created_at TIMESTAMP NULL,
    ip_address VARCHAR(64) DEFAULT '' NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** _log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- SQLINES DEMO ***  Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id CHAR(36) NOT NULL,
    user_id CHAR(36),
    auth_code TEXT NOT NULL,
    code_challenge_method ENUM('s256', 'plain') NOT NULL,
    code_challenge TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    provider_access_token TEXT,
    provider_refresh_token TEXT,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    authentication_method TEXT NOT NULL,
    auth_code_issued_at TIMESTAMP NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- SQLINES DEMO ***  Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id TEXT NOT NULL,
    user_id CHAR(36) NOT NULL,
    identity_data JSON NOT NULL,
    provider TEXT NOT NULL,
    last_sign_in_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    email TEXT,
    id CHAR(36) NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** ities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- SQLINES DEMO *** tities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- SQLINES DEMO *** Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** nces; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- SQLINES DEMO *** ims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp(0) with time zone NOT NULL,
    updated_at timestamp(0) with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** mr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- SQLINES DEMO *** ges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp(0) with time zone NOT NULL,
    verified_at timestamp(0) with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** hallenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- SQLINES DEMO *** ; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp(0) with time zone NOT NULL,
    updated_at timestamp(0) with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp(0) with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** actors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- SQLINES DEMO *** kens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp(0) DEFAULT now() NOT NULL,
    updated_at timestamp(0) DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** ens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** sh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- SQLINES DEMO *** ens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** ens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- SQLINES DEMO *** ers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- SQLINES DEMO *** states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- SQLINES DEMO *** ations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** a_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- SQLINES DEMO *** ype: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp(0) with time zone,
    refreshed_at timestamp(0),
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** ons; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- SQLINES DEMO *** ions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- SQLINES DEMO *** ; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** omains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- SQLINES DEMO *** rs; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** roviders; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- SQLINES DEMO *** providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- SQLINES DEMO *** : TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp(0) with time zone,
    invited_at timestamp(0) with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp(0) with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp(0) with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp(0) with time zone,
    last_sign_in_at timestamp(0) with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp(0) with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp(0) with time zone,
    confirmed_at timestamp(0) with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp(0) with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp(0) with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp(0) with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- SQLINES DEMO *** ; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- SQLINES DEMO *** s.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- SQLINES DEMO *** gs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id bigint NOT NULL,
    action_type character varying(255) NOT NULL,
    changes text,
    description character varying(1000),
    details text,
    entity_id character varying(255),
    entity_type character varying(255),
    error_message character varying(255),
    ip_address character varying(255),
    session_id character varying(255),
    severity_level character varying(255),
    status character varying(255),
    "timestamp" timestamp(6) NOT NULL,
    user_agent character varying(255),
    user_id bigint,
    user_name character varying(255),
    user_role character varying(255)
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- SQLINES DEMO *** gs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.activity_logs ALTER COLUMN id ADD
    SEQUENCE NAME public.activity_logs_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** pe: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.address (
    id bigint NOT NULL,
    address character varying(255),
    city character varying(100),
    country character varying(100),
    create_update timestamp(6),
    latitude numeric(10,8),
    longitude numeric(11,8),
    postal_code character varying(20),
    state character varying(100),
    status integer DEFAULT 1,
    type character varying(255) NOT NULL,
    update_date timestamp(6),
    user_id bigint,
    CONSTRAINT address_type_check CHECK (((type)::text = ANY ((ARRAY['SHIPPING'::character varying, 'WORK'::character varying, 'OTHER'::character varying, 'HOME'::character varying])::text[])))
);


ALTER TABLE public.address OWNER TO postgres;

--
-- SQLINES DEMO *** seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.address ALTER COLUMN id ADD
    SEQUENCE NAME public.address_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** pe: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appeals (
    id character varying(255) NOT NULL,
    admin_notes text,
    appeal_details text NOT NULL,
    appeal_reason character varying(255) NOT NULL,
    blacklist_entry_id character varying(255),
    contact_email character varying(255) NOT NULL,
    reviewed_at timestamp(6),
    reviewed_by character varying(255),
    status character varying(255) NOT NULL,
    submitted_at timestamp(6) NOT NULL,
    user_email character varying(255) NOT NULL,
    CONSTRAINT appeals_appeal_reason_check CHECK (((appeal_reason)::text = ANY ((ARRAY['WRONGFUL_BAN'::character varying, 'MISTAKEN_IDENTITY'::character varying, 'ACCOUNT_COMPROMISED'::character varying, 'TECHNICAL_ERROR'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT appeals_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.appeals OWNER TO postgres;

--
-- SQLINES DEMO *** Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attribute (
    id bigint NOT NULL,
    name character varying(15),
    status integer DEFAULT 1
);


ALTER TABLE public.attribute OWNER TO postgres;

--
-- SQLINES DEMO *** d_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.attribute ALTER COLUMN id ADD
    SEQUENCE NAME public.attribute_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** alue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attribute_value (
    id bigint NOT NULL,
    value character varying(50),
    attribute_id bigint,
    status integer DEFAULT 1
);


ALTER TABLE public.attribute_value OWNER TO postgres;

--
-- SQLINES DEMO *** alue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.attribute_value ALTER COLUMN id ADD
    SEQUENCE NAME public.attribute_value_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ntries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blacklist_entries (
    id character varying(255) NOT NULL,
    added_by character varying(255) NOT NULL,
    added_date timestamp(6) NOT NULL,
    associated_email character varying(255),
    category character varying(255) NOT NULL,
    device_fingerprint character varying(255),
    expiry_date timestamp(6),
    incident_count integer NOT NULL,
    is_automatic boolean NOT NULL,
    last_incident_date timestamp(6) NOT NULL,
    notes text,
    reason character varying(255) NOT NULL,
    risk_level character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    target_type character varying(255) NOT NULL,
    target_value character varying(255) NOT NULL,
    CONSTRAINT blacklist_entries_category_check CHECK (((category)::text = ANY ((ARRAY['FRAUD'::character varying, 'SPAM'::character varying, 'ABUSE'::character varying, 'CHARGEBACK'::character varying, 'FAKE_ACCOUNT'::character varying, 'POLICY_VIOLATION'::character varying])::text[]))),
    CONSTRAINT blacklist_entries_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[]))),
    CONSTRAINT blacklist_entries_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'APPEALED'::character varying, 'EXPIRED'::character varying, 'LIFTED'::character varying])::text[]))),
    CONSTRAINT blacklist_entries_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['EMAIL'::character varying, 'IP'::character varying, 'DEVICE'::character varying, 'PHONE'::character varying, 'USER_ID'::character varying])::text[])))
);


ALTER TABLE public.blacklist_entries OWNER TO postgres;

--
-- SQLINES DEMO *** ; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_ips (
    id bigint NOT NULL,
    blocked_until timestamp(6) NOT NULL,
    ip_address character varying(255) NOT NULL,
    reason character varying(255),
    user_email character varying(255)
);


ALTER TABLE public.blocked_ips OWNER TO postgres;

--
-- SQLINES DEMO *** _id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.blocked_ips ALTER COLUMN id ADD
    SEQUENCE NAME public.blocked_ips_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** : TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand (
    id bigint NOT NULL,
    image text,
    name character varying(255),
    status integer DEFAULT 1
);


ALTER TABLE public.brand OWNER TO postgres;

--
-- SQLINES DEMO *** ategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_has_category (
    id bigint NOT NULL,
    brand_id bigint,
    category_id bigint
);


ALTER TABLE public.brand_has_category OWNER TO postgres;

--
-- SQLINES DEMO *** ategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.brand_has_category ALTER COLUMN id ADD
    SEQUENCE NAME public.brand_has_category_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** q; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.brand ALTER COLUMN id ADD
    SEQUENCE NAME public.brand_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    id bigint NOT NULL,
    image text,
    name character varying(255),
    status integer DEFAULT 1,
    parent_id bigint,
    icon_class character varying(100),
    icon_url text
);


ALTER TABLE public.category OWNER TO postgres;

--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.category ALTER COLUMN id ADD
    SEQUENCE NAME public.category_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** sages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id bigint NOT NULL,
    email character varying(255),
    message text,
    name character varying(255),
    subject character varying(255),
    submitted_at timestamp(6)
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- SQLINES DEMO *** sages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.contact_messages ALTER COLUMN id ADD
    SEQUENCE NAME public.contact_messages_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** thod; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_method (
    id bigint NOT NULL,
    description character varying(255),
    fee double precision,
    name character varying(255) NOT NULL
);


ALTER TABLE public.delivery_method OWNER TO postgres;

--
-- SQLINES DEMO *** thod_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.delivery_method ALTER COLUMN id ADD
    SEQUENCE NAME public.delivery_method_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** rvice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_service (
    id bigint NOT NULL,
    fee_per_km numeric(38,2),
    name character varying(255),
    status integer DEFAULT 1,
    address_id bigint,
    phone_number character varying(255)
);


ALTER TABLE public.delivery_service OWNER TO postgres;

--
-- SQLINES DEMO *** rvice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.delivery_service ALTER COLUMN id ADD
    SEQUENCE NAME public.delivery_service_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount (
    id bigint NOT NULL,
    auto_apply boolean,
    code character varying(255),
    description character varying(255),
    discount_type character varying(255),
    discount_value double precision,
    end_date date,
    name character varying(255),
    start_date date,
    status boolean NOT NULL,
    event_id bigint,
    minimum_spend double precision,
    CONSTRAINT discount_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['PERCENTAGE'::character varying, 'FIXED'::character varying])::text[])))
);


ALTER TABLE public.discount OWNER TO postgres;

--
-- SQLINES DEMO *** ent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_event (
    id bigint NOT NULL,
    description character varying(255),
    discount_percent double precision NOT NULL,
    end_date timestamp(6),
    event_name character varying(255),
    start_date timestamp(6),
    status boolean NOT NULL
);


ALTER TABLE public.discount_event OWNER TO postgres;

--
-- SQLINES DEMO *** ent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.discount_event ALTER COLUMN id ADD
    SEQUENCE NAME public.discount_event_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.discount ALTER COLUMN id ADD
    SEQUENCE NAME public.discount_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** le; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_rule (
    id bigint NOT NULL,
    end_date date,
    start_date date,
    target_type character varying(255),
    brand_id bigint,
    category_id bigint,
    discount_id bigint,
    product_id bigint,
    user_id bigint,
    vip_role bigint,
    CONSTRAINT discount_rule_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['GLOBAL'::character varying, 'PRODUCT'::character varying, 'BRAND'::character varying, 'CATEGORY'::character varying, 'BRAND_CATEGORY'::character varying, 'USER'::character varying, 'USER_GLOBAL'::character varying, 'USER_PRODUCT'::character varying, 'USER_CATEGORY'::character varying, 'USER_BRAND'::character varying, 'USER_BRAND_CATEGORY'::character varying, 'VIP_TIER'::character varying])::text[])))
);


ALTER TABLE public.discount_rule OWNER TO postgres;

--
-- SQLINES DEMO *** le_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.discount_rule ALTER COLUMN id ADD
    SEQUENCE NAME public.discount_rule_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ct; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_product (
    id bigint NOT NULL,
    event_id bigint,
    product_id bigint
);


ALTER TABLE public.event_product OWNER TO postgres;

--
-- SQLINES DEMO *** ct_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_product ALTER COLUMN id ADD
    SEQUENCE NAME public.event_product_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** e: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    description character varying(255),
    end_date timestamp(6),
    event_image text,
    is_default integer DEFAULT 0,
    name character varying(255),
    slide_no integer,
    start_date timestamp(6),
    status integer DEFAULT 1,
    discount_id bigint
);


ALTER TABLE public.events OWNER TO postgres;

--
-- SQLINES DEMO *** eq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events ALTER COLUMN id ADD
    SEQUENCE NAME public.events_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** pts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    id bigint NOT NULL,
    attempt_count integer,
    country_code character varying(255),
    ip_address character varying(255),
    is_blocked boolean NOT NULL,
    is_proxy boolean NOT NULL,
    isvpn boolean NOT NULL,
    location character varying(255),
    session_id character varying(255),
    status character varying(255),
    threat_level character varying(255),
    threat_score integer,
    timeframe character varying(255),
    "timestamp" timestamp(6),
    user_agent character varying(255),
    username character varying(255),
    user_id bigint
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- SQLINES DEMO *** pts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.login_attempts ALTER COLUMN id ADD
    SEQUENCE NAME public.login_attempts_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** _subscriber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_letter_subscriber (
    id bigint NOT NULL,
    email character varying(255) NOT NULL
);


ALTER TABLE public.news_letter_subscriber OWNER TO postgres;

--
-- SQLINES DEMO *** _subscriber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.news_letter_subscriber ALTER COLUMN id ADD
    SEQUENCE NAME public.news_letter_subscriber_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** n; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id bigint NOT NULL,
    recipient_email character varying(255),
    message text,
    seen boolean,
    "timestamp" timestamp(0),
    type character varying(255),
    link character varying(255),
    category character varying(255),
    priority character varying(255),
    user_type character varying(255),
    user_id bigint,
    CONSTRAINT notification_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['ADMIN'::character varying, 'CUSTOMER'::character varying, 'MANAGER'::character varying, 'SALES_MARKETING'::character varying, 'WAREHOUSE_STAFF'::character varying, 'CUSTOMER_SUPPORT'::character varying])::text[])))
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- SQLINES DEMO *** n_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_id_seq OWNER TO postgres;

--
-- SQLINES DEMO *** n_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_id_seq OWNED BY public.notification.id;


--
-- SQLINES DEMO *** s; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status (
    id bigint NOT NULL,
    status_date timestamp(6) NOT NULL,
    refund_id bigint,
    status_id bigint NOT NULL,
    order_id bigint
);


ALTER TABLE public.order_status OWNER TO postgres;

--
-- SQLINES DEMO *** s_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.order_status ALTER COLUMN id ADD
    SEQUENCE NAME public.order_status_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verification (
    id bigint NOT NULL,
    email character varying(255),
    expiry_time timestamp(6),
    otp_code character varying(255),
    type character varying(255),
    verified boolean NOT NULL
);


ALTER TABLE public.otp_verification OWNER TO postgres;

--
-- SQLINES DEMO *** ation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.otp_verification ALTER COLUMN id ADD
    SEQUENCE NAME public.otp_verification_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO ***  Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission (
    id bigint NOT NULL,
    description character varying(255),
    create index charactercreate indexpublic.permission on public.permission varying(100) NOT NULL,
    level character varying(30),
    name character varying(100) NOT NULL,
    permission_category_id bigint
);


ALTER TABLE public.permission OWNER TO postgres;

--
-- SQLINES DEMO *** category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_category (
    id bigint NOT NULL,
    icon character varying(255),
    create index charactercreate indexpublic.permission_category on public.permission_category varying(255) NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.permission_category OWNER TO postgres;

--
-- SQLINES DEMO *** category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.permission_category ALTER COLUMN id ADD
    SEQUENCE NAME public.permission_category_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.permission ALTER COLUMN id ADD
    SEQUENCE NAME public.permission_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policies (
    id bigint NOT NULL,
    content text,
    last_updated timestamp(6),
    status integer DEFAULT 1,
    title character varying(255)
);


ALTER TABLE public.policies OWNER TO postgres;

--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.policies ALTER COLUMN id ADD
    SEQUENCE NAME public.policies_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** count; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_discount (
    id bigint NOT NULL,
    discount_id bigint,
    product_id bigint
);


ALTER TABLE public.product_discount OWNER TO postgres;

--
-- SQLINES DEMO *** count_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.product_discount ALTER COLUMN id ADD
    SEQUENCE NAME public.product_discount_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** _category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_has_category (
    id bigint NOT NULL,
    brand_id bigint,
    category_id bigint,
    product_id bigint
);


ALTER TABLE public.product_has_category OWNER TO postgres;

--
-- SQLINES DEMO *** _category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.product_has_category ALTER COLUMN id ADD
    SEQUENCE NAME public.product_has_category_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ge; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_image (
    id bigint NOT NULL,
    image_url text,
    status integer DEFAULT 1,
    product_id bigint,
    variant_id integer
);


ALTER TABLE public.product_image OWNER TO postgres;

--
-- SQLINES DEMO *** ge_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.product_image ALTER COLUMN id ADD
    SEQUENCE NAME public.product_image_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** iants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    price numeric(38,2),
    stock integer,
    stock_keeping character varying(100),
    product_id bigint,
    status integer DEFAULT 1
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- SQLINES DEMO *** iants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.product_variants ALTER COLUMN id ADD
    SEQUENCE NAME public.product_variants_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    create_date timestamp(6),
    description text,
    price double precision,
    product_code character varying(45),
    product_name character varying(45),
    quantity bigint,
    status integer DEFAULT 1,
    update_date timestamp(6),
    brand_id bigint
);


ALTER TABLE public.products OWNER TO postgres;

--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN id ADD
    SEQUENCE NAME public.products_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase (
    id integer NOT NULL,
    price double precision,
    purchase_date timestamp(6),
    quality integer,
    user_id bigint
);


ALTER TABLE public.purchase OWNER TO postgres;

--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase ALTER COLUMN id ADD
    SEQUENCE NAME public.purchase_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** oducts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_products (
    id integer NOT NULL,
    quality integer,
    products_id bigint,
    purchase_id integer
);


ALTER TABLE public.purchase_products OWNER TO postgres;

--
-- SQLINES DEMO *** oducts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.purchase_products ALTER COLUMN id ADD
    SEQUENCE NAME public.purchase_products_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** en; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_token (
    id bigint NOT NULL,
    expiry_date timestamp(6) with time zone,
    token character varying(255),
    user_id bigint
);


ALTER TABLE public.refresh_token OWNER TO postgres;

--
-- SQLINES DEMO *** en_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.refresh_token ALTER COLUMN id ADD
    SEQUENCE NAME public.refresh_token_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** pe: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refunds (
    id bigint NOT NULL,
    admin_remark character varying(1000),
    completed_at timestamp(6),
    initiated_at timestamp(6) NOT NULL,
    refund_amount numeric(10,2) NOT NULL,
    refund_type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    receive_card_id bigint,
    return_request_id bigint NOT NULL,
    CONSTRAINT refunds_refund_type_check CHECK (((refund_type)::text = ANY ((ARRAY['MONEY_REFUND'::character varying, 'REPLACEMENT'::character varying])::text[]))),
    CONSTRAINT refunds_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'COMPLETED'::character varying])::text[])))
);


ALTER TABLE public.refunds OWNER TO postgres;

--
-- SQLINES DEMO *** seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.refunds ALTER COLUMN id ADD
    SEQUENCE NAME public.refunds_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ord_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reset_password_request (
    id bigint NOT NULL,
    email character varying(255),
    new_password character varying(255)
);


ALTER TABLE public.reset_password_request OWNER TO postgres;

--
-- SQLINES DEMO *** ord_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.reset_password_request ALTER COLUMN id ADD
    SEQUENCE NAME public.reset_password_request_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** est_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_request_image (
    id bigint NOT NULL,
    image_url character varying(255) NOT NULL,
    return_request_id bigint NOT NULL
);


ALTER TABLE public.return_request_image OWNER TO postgres;

--
-- SQLINES DEMO *** est_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.return_request_image ALTER COLUMN id ADD
    SEQUENCE NAME public.return_request_image_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** est_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_request_products (
    id bigint NOT NULL,
    product_remark character varying(255),
    quantity integer,
    order_product_id bigint NOT NULL,
    return_request_id bigint NOT NULL
);


ALTER TABLE public.return_request_products OWNER TO postgres;

--
-- SQLINES DEMO *** est_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.return_request_products ALTER COLUMN id ADD
    SEQUENCE NAME public.return_request_products_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_requests (
    id bigint NOT NULL,
    admin_remark character varying(1000),
    cancelled_at timestamp(6),
    decision_at timestamp(6),
    reason_for_return character varying(255) NOT NULL,
    requested_at timestamp(6) NOT NULL,
    return_detail character varying(1000),
    status character varying(20) NOT NULL,
    order_id bigint NOT NULL,
    order_product_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT return_requests_reason_for_return_check CHECK (((reason_for_return)::text = ANY ((ARRAY['WRONG_ITEM_DELIVERED'::character varying, 'DAMAGED_ON_ARRIVAL'::character varying, 'CHANGED_MIND'::character varying])::text[]))),
    CONSTRAINT return_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.return_requests OWNER TO postgres;

--
-- SQLINES DEMO *** ests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.return_requests ALTER COLUMN id ADD
    SEQUENCE NAME public.return_requests_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** get; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_target (
    id bigint NOT NULL,
    created_at timestamp(6) NOT NULL,
    period_type character varying(255) NOT NULL,
    period_value character varying(255) NOT NULL,
    target_amount double precision NOT NULL
);


ALTER TABLE public.revenue_target OWNER TO postgres;

--
-- SQLINES DEMO *** get_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.revenue_target ALTER COLUMN id ADD
    SEQUENCE NAME public.revenue_target_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** e: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review (
    id bigint NOT NULL,
    comment text,
    rating integer NOT NULL,
    "timestamp" timestamp(6),
    product_id bigint,
    user_id bigint
);


ALTER TABLE public.review OWNER TO postgres;

--
-- SQLINES DEMO *** eq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.review ALTER COLUMN id ADD
    SEQUENCE NAME public.review_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** a; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_media (
    id bigint NOT NULL,
    media_url character varying(255),
    type character varying(255),
    review_id bigint,
    CONSTRAINT review_media_type_check CHECK (((type)::text = ANY ((ARRAY['IMAGE'::character varying, 'VIDEO'::character varying])::text[])))
);


ALTER TABLE public.review_media OWNER TO postgres;

--
-- SQLINES DEMO *** a_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.review_media ALTER COLUMN id ADD
    SEQUENCE NAME public.review_media_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO ***  TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id bigint NOT NULL,
    name character varying(45) NOT NULL,
    level integer
);


ALTER TABLE public.role OWNER TO postgres;

--
-- SQLINES DEMO *** ; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.role ALTER COLUMN id ADD
    SEQUENCE NAME public.role_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** sion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permission (
    id bigint NOT NULL,
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_permission OWNER TO postgres;

--
-- SQLINES DEMO *** sion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permission ALTER COLUMN id ADD
    SEQUENCE NAME public.role_permission_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** sion_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permission_log (
    id bigint NOT NULL,
    action character varying(255),
    details text,
    performed_by character varying(255),
    target_id bigint,
    target_name character varying(255),
    target_type character varying(255),
    "timestamp" timestamp(6)
);


ALTER TABLE public.role_permission_log OWNER TO postgres;

--
-- SQLINES DEMO *** sion_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permission_log ALTER COLUMN id ADD
    SEQUENCE NAME public.role_permission_log_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_cards (
    id bigint NOT NULL,
    card_brand character varying(20) NOT NULL,
    card_number character varying(20) NOT NULL,
    cardholder_name character varying(255) NOT NULL,
    expiry_date character varying(7) NOT NULL,
    is_default boolean,
    status integer DEFAULT 1,
    user_id bigint NOT NULL
);


ALTER TABLE public.saved_cards OWNER TO postgres;

--
-- SQLINES DEMO *** _id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.saved_cards ALTER COLUMN id ADD
    SEQUENCE NAME public.saved_cards_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** licy_rule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_policy_rule (
    id bigint NOT NULL,
    action character varying(255),
    attempts integer NOT NULL,
    extra_data text,
    window_minutes integer NOT NULL
);


ALTER TABLE public.security_policy_rule OWNER TO postgres;

--
-- SQLINES DEMO *** licy_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.security_policy_rule ALTER COLUMN id ADD
    SEQUENCE NAME public.security_policy_rule_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** e: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT status_name_check CHECK (((name)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'PROCESSING'::character varying, 'SHIPPED'::character varying, 'DELIVERED'::character varying, 'CANCELLED'::character varying, 'RETURNED'::character varying])::text[])))
);


ALTER TABLE public.status OWNER TO postgres;

--
-- SQLINES DEMO *** eq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.status ALTER COLUMN id ADD
    SEQUENCE NAME public.status_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO ***  TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test (
    id bigint NOT NULL
);


ALTER TABLE public.test OWNER TO postgres;

--
-- SQLINES DEMO *** ; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.test ALTER COLUMN id ADD
    SEQUENCE NAME public.test_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activity (
    id bigint NOT NULL,
    activity_time timestamp(6),
    activity_type character varying(255),
    user_id bigint
);


ALTER TABLE public.user_activity OWNER TO postgres;

--
-- SQLINES DEMO *** ty_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_activity ALTER COLUMN id ADD
    SEQUENCE NAME public.user_activity_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** _usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_coupon_usage (
    id bigint NOT NULL,
    used_at timestamp(6),
    discount_id bigint NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.user_coupon_usage OWNER TO postgres;

--
-- SQLINES DEMO *** _usage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_coupon_usage ALTER COLUMN id ADD
    SEQUENCE NAME public.user_coupon_usage_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO ***  Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_order (
    id bigint NOT NULL,
    delivery_fee numeric(10,2),
    order_code character varying(255),
    order_date timestamp(6),
    updated_date timestamp(6),
    address_id bigint,
    delivery_method_id bigint,
    delivery_service_id bigint,
    discount_id bigint,
    saved_card_id bigint,
    user_id bigint,
    user_discount_id bigint
);


ALTER TABLE public.user_order OWNER TO postgres;

--
-- SQLINES DEMO *** has_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_order_has_product (
    id bigint NOT NULL,
    quantity integer,
    unit_price double precision,
    product_id bigint,
    variant_id integer,
    user_order_id bigint,
    status integer DEFAULT 1,
    discount_rule_id bigint
);


ALTER TABLE public.user_order_has_product OWNER TO postgres;

--
-- SQLINES DEMO *** has_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_order_has_product ALTER COLUMN id ADD
    SEQUENCE NAME public.user_order_has_product_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_order ALTER COLUMN id ADD
    SEQUENCE NAME public.user_order_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_point_history (
    id bigint NOT NULL,
    created_at timestamp(6),
    points integer,
    status integer DEFAULT 1,
    order_id bigint NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.user_point_history OWNER TO postgres;

--
-- SQLINES DEMO *** history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_point_history ALTER COLUMN id ADD
    SEQUENCE NAME public.user_point_history_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id bigint NOT NULL,
    end_time timestamp(6),
    ip_address character varying(255),
    is_bounce boolean,
    last_activity timestamp(6),
    page_count integer,
    session_id character varying(255),
    start_time timestamp(6),
    user_agent character varying(255),
    user_id bigint
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- SQLINES DEMO *** ns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sessions ALTER COLUMN id ADD
    SEQUENCE NAME public.user_sessions_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** : TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    created_date timestamp(6),
    date_of_birth date,
    email character varying(45) NOT NULL,
    gender character varying(10),
    last_login timestamp(6),
    name character varying(45) NOT NULL,
    order_count integer,
    otp_code character varying(255),
    otp_expiry timestamp(6),
    password character varying(150) NOT NULL,
    phone_number character varying(45),
    profile_image text,
    reset_token character varying(255),
    status character varying(20) NOT NULL,
    total_points integer,
    is_verified boolean,
    role_id bigint,
    phone_verified boolean DEFAULT false,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'SUSPENDED'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- SQLINES DEMO *** q; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD
    SEQUENCE NAME public.users_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ribute_value; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.variant_attribute_value (
    id integer NOT NULL,
    attribute_value_id bigint,
    product_variants_id integer
);


ALTER TABLE public.variant_attribute_value OWNER TO postgres;

--
-- SQLINES DEMO *** ribute_value_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.variant_attribute_value ALTER COLUMN id ADD
    SEQUENCE NAME public.variant_attribute_value_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** n_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_token (
    id bigint NOT NULL,
    expiry_date timestamp(6),
    token character varying(255),
    user_id bigint
);


ALTER TABLE public.verification_token OWNER TO postgres;

--
-- SQLINES DEMO *** n_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.verification_token ALTER COLUMN id ADD
    SEQUENCE NAME public.verification_token_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vip_tiers (
    id bigint NOT NULL,
    benefits text,
    color character varying(20),
    description character varying(255),
    icon character varying(50),
    min_points integer NOT NULL,
    name character varying(255) NOT NULL,
    tier_order integer,
    weight integer NOT NULL
);


ALTER TABLE public.vip_tiers OWNER TO postgres;

--
-- SQLINES DEMO *** d_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.vip_tiers ALTER COLUMN id ADD
    SEQUENCE NAME public.vip_tiers_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist (
    id bigint NOT NULL,
    status integer DEFAULT 1,
    wishlist_date timestamp(6),
    product_id bigint,
    user_id bigint
);


ALTER TABLE public.wishlist OWNER TO postgres;

--
-- SQLINES DEMO *** _seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.wishlist ALTER COLUMN id ADD
    SEQUENCE NAME public.wishlist_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** ype: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp(0) DEFAULT now() NOT NULL,
    inserted_at timestamp(0) DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- SQLINES DEMO *** ations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0)
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- SQLINES DEMO *** n; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp(0) DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- SQLINES DEMO *** n_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD
    SEQUENCE NAME realtime.subscription_id_seq
    START 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- SQLINES DEMO *** pe: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp(0) with time zone DEFAULT now(),
    updated_at timestamp(0) with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- SQLINES DEMO *** ets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- SQLINES DEMO ***  Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp(0) DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- SQLINES DEMO *** pe: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp(0) with time zone DEFAULT now(),
    updated_at timestamp(0) with time zone DEFAULT now(),
    last_accessed_at timestamp(0) with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- SQLINES DEMO *** cts.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- SQLINES DEMO *** t_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    create index textcreate indexstorage.s3_multipart_uploads on storage.s3_multipart_uploads NOT NULL ,
    version text NOT NULL,
    owner_id text,
    created_at timestamp(0) with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- SQLINES DEMO *** t_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    create index textcreate indexstorage.s3_multipart_uploads_parts on storage.s3_multipart_uploads_parts NOT NULL ,
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp(0) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- SQLINES DEMO *** ens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- SQLINES DEMO *** n id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN id SET DEFAULT nextval('public.notification_id_seq'::regclass);


--
-- SQLINES DEMO *** dit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
.


--
-- SQLINES DEMO *** ow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
.


--
-- SQLINES DEMO *** entities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
.


--
-- SQLINES DEMO *** stances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
.


--
-- SQLINES DEMO *** a_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
.


--
-- SQLINES DEMO *** a_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
.


--
-- SQLINES DEMO *** a_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
.


--
-- SQLINES DEMO *** e_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
.


--
-- SQLINES DEMO *** fresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
.


--
-- SQLINES DEMO *** ml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
.


--
-- SQLINES DEMO *** ml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
.


--
-- SQLINES DEMO *** hema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
.


--
-- SQLINES DEMO *** ssions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
.


--
-- SQLINES DEMO *** o_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
.


--
-- SQLINES DEMO *** o_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
.


--
-- SQLINES DEMO *** ers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
.


--
-- SQLINES DEMO *** tivity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, action_type, changes, description, details, entity_id, entity_type, error_message, ip_address, session_id, severity_level, status, "timestamp", user_agent, user_id, user_name, user_role) FROM stdin;
1	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 21:21:53","StartTime":"Jul 30, 2025 21:21:46","Duration":"6793ms","SessionId":"sess_kzzv93rdle","Location":"Yangon, MM"}	1	USER	N	116.206.139.77	sess_kzzv93rdle	LOW	SUCCESS	2025-07-30 21:21:54.223993	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	CUSTOMER
2	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 21:57:43","StartTime":"Jul 30, 2025 21:57:37","Duration":"5949ms","SessionId":"sess_900oxeyao1","Location":"Unknown Location"}	2	USER	N	69.160.8.66	sess_900oxeyao1	LOW	SUCCESS	2025-07-30 21:57:45.996478	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	CUSTOMER
3	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 21:57:48","StartTime":"Jul 30, 2025 21:57:44","Duration":"4196ms","SessionId":"sess_r4vw1v0cvd","Location":"Unknown Location"}	2	USER	N	69.160.8.66	sess_r4vw1v0cvd	LOW	SUCCESS	2025-07-30 21:57:48.327218	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	CUSTOMER
4	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 22:21:41","StartTime":"Jul 30, 2025 22:21:36","Duration":"5058ms","SessionId":"sess_ay46b2n4ae","Location":"Unknown Location"}	2	USER	N	69.160.8.66	sess_ay46b2n4ae	LOW	SUCCESS	2025-07-30 22:21:43.738892	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	CUSTOMER
5	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 23:33:30","StartTime":"Jul 30, 2025 23:33:27","Duration":"3044ms","SessionId":"sess_xn6ozualoo","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_xn6ozualoo	LOW	SUCCESS	2025-07-30 23:33:32.770226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	CUSTOMER
6	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 23:34:27","StartTime":"Jul 30, 2025 23:34:24","Duration":"2530ms","SessionId":"sess_y2ecxtjp9e","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_y2ecxtjp9e	LOW	SUCCESS	2025-07-30 23:34:27.379467	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
7	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 23:37:52","StartTime":"Jul 30, 2025 23:37:47","Duration":"4945ms","SessionId":"sess_270j7muiwj","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_270j7muiwj	LOW	SUCCESS	2025-07-30 23:37:54.584739	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
8	LOGIN	N	User login	{"EndTime":"Jul 30, 2025 23:43:49","StartTime":"Jul 30, 2025 23:43:43","Duration":"5739ms","SessionId":"sess_dp08xz1fpq","Location":"Unknown Location"}	2	USER	N	69.160.8.66	sess_dp08xz1fpq	LOW	SUCCESS	2025-07-30 23:43:51.426051	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ADMIN
9	CREATE	N	Created category	{"EndTime":"Jul 30, 2025 23:47:54","StartTime":"Jul 30, 2025 23:47:54","Duration":"441ms","SessionId":"47905F9890790AA30ABD0463360FEF0D","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	47905F9890790AA30ABD0463360FEF0D	MEDIUM	SUCCESS	2025-07-30 23:47:54.921696	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
10	LOGIN_OTP_VERIFICATION	N	User login OTP verification	{"EndTime":"Jul 31, 2025 00:02:51","StartTime":"Jul 31, 2025 00:02:51","Duration":"0ms","SessionId":"sess_0poqxkcig7","Location":"Yangon, MM"}	4	USER	N	116.206.139.77	sess_0poqxkcig7	LOW	SUCCESS	2025-07-31 00:02:51.481315	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	4	Marc	CUSTOMER
11	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 00:09:10","StartTime":"Jul 31, 2025 00:09:05","Duration":"4860ms","SessionId":"sess_plcl424bau","Location":"Unknown Location"}	5	USER	N	69.160.8.66	sess_plcl424bau	LOW	SUCCESS	2025-07-31 00:09:10.783278	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
12	UPDATE	N	Updated category	{"EntityId":"1","EndTime":"Jul 31, 2025 00:11:41","StartTime":"Jul 31, 2025 00:11:40","Duration":"235ms","SessionId":"59B5EB1D3C4C097657B73A8BEF63AF66","Location":"Unknown Location"}	1	CATEGORY	N	69.160.8.66	59B5EB1D3C4C097657B73A8BEF63AF66	MEDIUM	SUCCESS	2025-07-31 00:11:41.18927	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
13	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:13:16","StartTime":"Jul 31, 2025 00:13:15","Duration":"371ms","SessionId":"AB1C08B87DA5551E1661EF62F784EA0A","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	AB1C08B87DA5551E1661EF62F784EA0A	MEDIUM	SUCCESS	2025-07-31 00:13:16.217813	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
14	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:13:16","StartTime":"Jul 31, 2025 00:13:16","Duration":"49ms","SessionId":"A18B5E7C060BCDB9FECBBA2E41B06738","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	A18B5E7C060BCDB9FECBBA2E41B06738	MEDIUM	SUCCESS	2025-07-31 00:13:16.937994	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
15	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:14:18","StartTime":"Jul 31, 2025 00:14:18","Duration":"278ms","SessionId":"4F785F92CB0DFDB9FDCF6BC05CC857F3","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	4F785F92CB0DFDB9FDCF6BC05CC857F3	MEDIUM	SUCCESS	2025-07-31 00:14:18.990096	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
16	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:15:15","StartTime":"Jul 31, 2025 00:15:15","Duration":"437ms","SessionId":"0BB8C9D0D8BAF391926A1D873887E223","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	0BB8C9D0D8BAF391926A1D873887E223	MEDIUM	SUCCESS	2025-07-31 00:15:15.561918	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
17	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 00:17:41","StartTime":"Jul 31, 2025 00:17:41","Duration":"160ms","SessionId":"3523847B6BD61AEE961B343B985B5494","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	3523847B6BD61AEE961B343B985B5494	MEDIUM	SUCCESS	2025-07-31 00:17:41.900259	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
18	UPDATE	N	Updated category	{"EntityId":"2","EndTime":"Jul 31, 2025 00:18:32","StartTime":"Jul 31, 2025 00:18:32","Duration":"383ms","SessionId":"2C80DD82719ED8CA4BE303FAC78FC58E","Location":"Unknown Location"}	2	CATEGORY	N	69.160.8.66	2C80DD82719ED8CA4BE303FAC78FC58E	MEDIUM	SUCCESS	2025-07-31 00:18:32.501001	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
19	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:20:49","StartTime":"Jul 31, 2025 00:20:49","Duration":"263ms","SessionId":"9B493108C92C6C18AEF1B45A87B4BF2D","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	9B493108C92C6C18AEF1B45A87B4BF2D	MEDIUM	SUCCESS	2025-07-31 00:20:49.831401	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
20	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:21:15","StartTime":"Jul 31, 2025 00:21:15","Duration":"260ms","SessionId":"1122F08B99BE64C3733F2BAA97E9FB2C","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	1122F08B99BE64C3733F2BAA97E9FB2C	MEDIUM	SUCCESS	2025-07-31 00:21:15.688962	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
24	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:25:19","StartTime":"Jul 31, 2025 00:25:18","Duration":"361ms","SessionId":"6D17DED8639C99DC5412D88E43A612D5","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	6D17DED8639C99DC5412D88E43A612D5	MEDIUM	SUCCESS	2025-07-31 00:25:19.300266	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
21	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:22:12","StartTime":"Jul 31, 2025 00:22:12","Duration":"287ms","SessionId":"FC8B6644F8CECED2614A115562807630","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	FC8B6644F8CECED2614A115562807630	MEDIUM	SUCCESS	2025-07-31 00:22:12.583539	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
22	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:23:19","StartTime":"Jul 31, 2025 00:23:19","Duration":"376ms","SessionId":"DB6849E68B17979E71A7C5E63CDF0AE0","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	DB6849E68B17979E71A7C5E63CDF0AE0	MEDIUM	SUCCESS	2025-07-31 00:23:19.481047	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
25	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:26:39","StartTime":"Jul 31, 2025 00:26:39","Duration":"425ms","SessionId":"A6B413A6B1E2722A9DF21C677B8B0B20","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	A6B413A6B1E2722A9DF21C677B8B0B20	MEDIUM	SUCCESS	2025-07-31 00:26:39.456519	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
23	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:25:04","StartTime":"Jul 31, 2025 00:25:04","Duration":"383ms","SessionId":"09D01CEE68F9214AA428F89F5EB37BCC","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	09D01CEE68F9214AA428F89F5EB37BCC	MEDIUM	SUCCESS	2025-07-31 00:25:04.850581	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
26	UPDATE	N	Updated brand	{"EntityId":"11","EndTime":"Jul 31, 2025 00:26:58","StartTime":"Jul 31, 2025 00:26:58","Duration":"642ms","SessionId":"C452945DC4B617F0AD0F2B0BAA4A26FB","Location":"Unknown Location"}	11	BRAND	N	69.160.8.66	C452945DC4B617F0AD0F2B0BAA4A26FB	MEDIUM	SUCCESS	2025-07-31 00:26:58.836639	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
27	CREATE	N	Created brand	{"EndTime":"Jul 31, 2025 00:28:09","StartTime":"Jul 31, 2025 00:28:09","Duration":"271ms","SessionId":"4D730348D07F7040C5919532B3254760","Location":"Unknown Location"}	N	BRAND	N	69.160.8.66	4D730348D07F7040C5919532B3254760	MEDIUM	SUCCESS	2025-07-31 00:28:09.293572	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
28	UPDATE	N	Updated category	{"EntityId":"3","EndTime":"Jul 31, 2025 00:29:21","StartTime":"Jul 31, 2025 00:29:20","Duration":"225ms","SessionId":"80F2D3DCF4942FD1B7D5243E39F8F525","Location":"Unknown Location"}	3	CATEGORY	N	69.160.8.66	80F2D3DCF4942FD1B7D5243E39F8F525	MEDIUM	SUCCESS	2025-07-31 00:29:21.12715	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
29	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 00:30:47","StartTime":"Jul 31, 2025 00:30:41","Duration":"6625ms","SessionId":"sess_ulwkm8iqfk","Location":"Yangon, MM"}	1	USER	N	116.206.139.77	sess_ulwkm8iqfk	LOW	SUCCESS	2025-07-31 00:30:47.703018	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ADMIN
30	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 00:30:52","StartTime":"Jul 31, 2025 00:30:52","Duration":"163ms","SessionId":"7A5763DAB9A23A810F1349B25F59C16C","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	7A5763DAB9A23A810F1349B25F59C16C	MEDIUM	SUCCESS	2025-07-31 00:30:52.190326	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
31	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 00:31:46","StartTime":"Jul 31, 2025 00:31:46","Duration":"159ms","SessionId":"8EFE426784DE6E0D5EABEE4DA8045BFD","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	8EFE426784DE6E0D5EABEE4DA8045BFD	MEDIUM	SUCCESS	2025-07-31 00:31:46.517237	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
32	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 00:33:40","StartTime":"Jul 31, 2025 00:33:40","Duration":"272ms","SessionId":"98A476C03829B1948577C282BEBC0664","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	98A476C03829B1948577C282BEBC0664	MEDIUM	SUCCESS	2025-07-31 00:33:40.418914	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
33	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 00:34:46","StartTime":"Jul 31, 2025 00:34:46","Duration":"274ms","SessionId":"3981954FEE802962CCE5D2E982ABEC89","Location":"Unknown Location"}	N	CATEGORY	N	69.160.8.66	3981954FEE802962CCE5D2E982ABEC89	MEDIUM	SUCCESS	2025-07-31 00:34:46.462546	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
34	UPDATE	N	Updated brand	{"EntityId":"1","EndTime":"Jul 31, 2025 00:36:31","StartTime":"Jul 31, 2025 00:36:30","Duration":"1005ms","SessionId":"6DFB40DF321E82A2FB518EF6CAD75F04","Location":"Unknown Location"}	1	BRAND	N	69.160.8.66	6DFB40DF321E82A2FB518EF6CAD75F04	MEDIUM	SUCCESS	2025-07-31 00:36:31.727008	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
35	UPDATE	N	Updated brand	{"EntityId":"1","EndTime":"Jul 31, 2025 00:36:32","StartTime":"Jul 31, 2025 00:36:31","Duration":"1061ms","SessionId":"64253DCB10C41F5DDBE5886C0D890CDC","Location":"Unknown Location"}	1	BRAND	N	69.160.8.66	64253DCB10C41F5DDBE5886C0D890CDC	MEDIUM	SUCCESS	2025-07-31 00:36:32.966398	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
36	UPDATE	N	Updated brand	{"EntityId":"2","EndTime":"Jul 31, 2025 00:36:51","StartTime":"Jul 31, 2025 00:36:50","Duration":"735ms","SessionId":"86CCD413884A6B40B7A9CFB4399C99BD","Location":"Unknown Location"}	2	BRAND	N	69.160.8.66	86CCD413884A6B40B7A9CFB4399C99BD	MEDIUM	SUCCESS	2025-07-31 00:36:51.321581	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
37	UPDATE	N	Updated brand	{"EntityId":"3","EndTime":"Jul 31, 2025 00:37:06","StartTime":"Jul 31, 2025 00:37:06","Duration":"834ms","SessionId":"44306C9B55DCD56A64D3DE2B0FC79510","Location":"Unknown Location"}	3	BRAND	N	69.160.8.66	44306C9B55DCD56A64D3DE2B0FC79510	MEDIUM	SUCCESS	2025-07-31 00:37:06.994192	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
38	UPDATE	N	Updated brand	{"EntityId":"3","EndTime":"Jul 31, 2025 00:37:07","StartTime":"Jul 31, 2025 00:37:06","Duration":"848ms","SessionId":"A2846233B500C4BAC333980E387BC3EE","Location":"Unknown Location"}	3	BRAND	N	69.160.8.66	A2846233B500C4BAC333980E387BC3EE	MEDIUM	SUCCESS	2025-07-31 00:37:07.808746	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
39	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 00:41:13","StartTime":"Jul 31, 2025 00:41:10","Duration":"2515ms","SessionId":"2DD127AB2541504717ACC201BE5E3790","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	2DD127AB2541504717ACC201BE5E3790	MEDIUM	SUCCESS	2025-07-31 00:41:13.38181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
40	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 00:49:36","StartTime":"Jul 31, 2025 00:49:34","Duration":"2217ms","SessionId":"D66F46F9337F235FC9F4E541C9BF1013","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	D66F46F9337F235FC9F4E541C9BF1013	MEDIUM	SUCCESS	2025-07-31 00:49:36.414152	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
41	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 00:51:38","StartTime":"Jul 31, 2025 00:51:36","Duration":"2013ms","SessionId":"8AAD706ED10602E827B9D3DC54DB1818","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	8AAD706ED10602E827B9D3DC54DB1818	MEDIUM	SUCCESS	2025-07-31 00:51:38.245685	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
42	UPDATE	N	Updated brand	{"EntityId":"6","EndTime":"Jul 31, 2025 00:56:17","StartTime":"Jul 31, 2025 00:56:16","Duration":"727ms","SessionId":"BC877B8ECAC41EDBC3BA04822C669C50","Location":"Unknown Location"}	6	BRAND	N	69.160.8.66	BC877B8ECAC41EDBC3BA04822C669C50	MEDIUM	SUCCESS	2025-07-31 00:56:17.072961	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
43	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 01:08:17","StartTime":"Jul 31, 2025 01:08:14","Duration":"3297ms","SessionId":"7D992E48612AF11B45C671A68DB73DE8","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	7D992E48612AF11B45C671A68DB73DE8	MEDIUM	SUCCESS	2025-07-31 01:08:17.329179	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
44	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 01:08:17","StartTime":"Jul 31, 2025 01:08:14","Duration":"3473ms","SessionId":"85013921E8126C4B7EBEEA75F212D4A1","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	85013921E8126C4B7EBEEA75F212D4A1	MEDIUM	SUCCESS	2025-07-31 01:08:17.67579	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
45	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 01:08:17","StartTime":"Jul 31, 2025 01:08:14","Duration":"3393ms","SessionId":"C88FBBB36D724E2B298F31C1C435A592","Location":"Unknown Location"}	N	PRODUCT	N	69.160.8.66	C88FBBB36D724E2B298F31C1C435A592	MEDIUM	SUCCESS	2025-07-31 01:08:17.755965	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
46	DELETE	N	Deleted product	{"EntityId":"5","EndTime":"Jul 31, 2025 01:08:35","StartTime":"Jul 31, 2025 01:08:34","Duration":"72ms","SessionId":"A7059D96E30BBFFD7F77D134F34629EB","Location":"Unknown Location"}	5	PRODUCT	N	69.160.8.66	A7059D96E30BBFFD7F77D134F34629EB	HIGH	SUCCESS	2025-07-31 01:08:35.053137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
47	DELETE	N	Deleted product	{"EntityId":"6","EndTime":"Jul 31, 2025 01:08:35","StartTime":"Jul 31, 2025 01:08:34","Duration":"72ms","SessionId":"558187939D8955D25ED2E574E34D9E63","Location":"Unknown Location"}	6	PRODUCT	N	69.160.8.66	558187939D8955D25ED2E574E34D9E63	HIGH	SUCCESS	2025-07-31 01:08:35.053137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
48	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 01:18:02","StartTime":"Jul 31, 2025 01:17:59","Duration":"3353ms","SessionId":"sess_40oztjqiur","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_40oztjqiur	LOW	SUCCESS	2025-07-31 01:18:04.414803	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
49	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 01:36:44","StartTime":"Jul 31, 2025 01:36:41","Duration":"3072ms","SessionId":"sess_hsinuxj6gh","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_hsinuxj6gh	LOW	SUCCESS	2025-07-31 01:36:44.794359	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
50	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 01:37:12","StartTime":"Jul 31, 2025 01:37:09","Duration":"3156ms","SessionId":"sess_y4e3ny1x60","Location":"Unknown Location"}	2	USER	N	103.67.50.90	sess_y4e3ny1x60	LOW	SUCCESS	2025-07-31 01:37:12.544854	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ADMIN
51	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 01:47:54","StartTime":"Jul 31, 2025 01:47:51","Duration":"3009ms","SessionId":"sess_5u4t31iclg","Location":"Unknown Location"}	3	USER	N	103.67.50.90	sess_5u4t31iclg	LOW	SUCCESS	2025-07-31 01:47:54.762012	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	3	htoo aung	ADMIN
52	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 08:48:04","StartTime":"Jul 31, 2025 08:48:01","Duration":"2584ms","SessionId":"AA4A34C054390F67936D538DFCF61558","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	AA4A34C054390F67936D538DFCF61558	MEDIUM	SUCCESS	2025-07-31 08:48:04.26063	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
53	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 08:57:16","StartTime":"Jul 31, 2025 08:57:14","Duration":"2229ms","SessionId":"BBBC1AF1E0925583316404443218CFE8","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	BBBC1AF1E0925583316404443218CFE8	MEDIUM	SUCCESS	2025-07-31 08:57:16.806572	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
54	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 09:00:00","StartTime":"Jul 31, 2025 08:59:58","Duration":"1357ms","SessionId":"47BBA7FEFF1932F201A3E2DAFA82D66C","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	47BBA7FEFF1932F201A3E2DAFA82D66C	MEDIUM	SUCCESS	2025-07-31 09:00:00.204835	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
55	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 09:02:19","StartTime":"Jul 31, 2025 09:02:15","Duration":"4102ms","SessionId":"sess_wusd9o0eqp","Location":"Yangon, MM"}	5	USER	N	103.186.123.13	sess_wusd9o0eqp	LOW	SUCCESS	2025-07-31 09:02:19.854373	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
56	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 09:05:49","StartTime":"Jul 31, 2025 09:05:46","Duration":"2820ms","SessionId":"9384925C10AF2ED52FB3D0D1570D1C42","Location":"Unknown Location"}	N	ADDRESS	N	204.157.172.242	9384925C10AF2ED52FB3D0D1570D1C42	LOW	SUCCESS	2025-07-31 09:05:49.061186	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
57	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 09:06:49","StartTime":"Jul 31, 2025 09:06:48","Duration":"769ms","SessionId":"C6BE8DC35BC549DAF19580A3252369E3","Location":"Unknown Location"}	N	ADDRESS	N	204.157.172.242	C6BE8DC35BC549DAF19580A3252369E3	LOW	SUCCESS	2025-07-31 09:06:49.372474	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
58	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 09:07:49","StartTime":"Jul 31, 2025 09:07:48","Duration":"761ms","SessionId":"3F601932A7982BE44E5FF2BE7DA1E8F6","Location":"Unknown Location"}	N	ADDRESS	N	204.157.172.242	3F601932A7982BE44E5FF2BE7DA1E8F6	LOW	SUCCESS	2025-07-31 09:07:49.227803	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
59	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 09:19:32","StartTime":"Jul 31, 2025 09:19:28","Duration":"4162ms","SessionId":"sess_rlcipiuapi","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	sess_rlcipiuapi	LOW	SUCCESS	2025-07-31 09:19:32.626722	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ADMIN
60	UPDATE	{"before":{"phoneNumber":null},"changedFields":["phoneNumber"],"after":{"phoneNumber":"09966466855"}}	Updated user	{"EntityId":"1","EndTime":"Jul 31, 2025 09:23:26","StartTime":"Jul 31, 2025 09:23:26","Duration":"556ms","SessionId":"4696A79407DDAD4B50DD782500B9B70D","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	4696A79407DDAD4B50DD782500B9B70D	MEDIUM	SUCCESS	2025-07-31 09:23:26.58641	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
61	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 09:23:39","StartTime":"Jul 31, 2025 09:23:39","Duration":"594ms","SessionId":"2955F0BF4C3066528DD1E626A488FD6F","Location":"Yangon, MM"}	N	ADDRESS	N	204.157.172.86	2955F0BF4C3066528DD1E626A488FD6F	LOW	SUCCESS	2025-07-31 09:23:39.891343	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
62	CREATE	N	Created order	{"EndTime":"Jul 31, 2025 09:25:11","StartTime":"Jul 31, 2025 09:25:07","Duration":"3851ms","SessionId":"EF18A5B8563B44066B58B6EED372ECE1","Location":"Yangon, MM"}	N	ORDER	N	204.157.172.86	EF18A5B8563B44066B58B6EED372ECE1	MEDIUM	SUCCESS	2025-07-31 09:25:11.601967	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
63	CREATE	N	Created order	{"EndTime":"Jul 31, 2025 09:26:35","StartTime":"Jul 31, 2025 09:26:31","Duration":"3720ms","SessionId":"7424AD13661324B7A490AEA72724BAFF","Location":"Yangon, MM"}	N	ORDER	N	204.157.172.86	7424AD13661324B7A490AEA72724BAFF	MEDIUM	SUCCESS	2025-07-31 09:26:35.344204	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
64	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 09:28:27","StartTime":"Jul 31, 2025 09:28:24","Duration":"3674ms","SessionId":"sess_154a6lk3vh","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	sess_154a6lk3vh	LOW	SUCCESS	2025-07-31 09:28:27.692725	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ADMIN
65	CREATE	N	Created category	{"EndTime":"Jul 31, 2025 09:28:28","StartTime":"Jul 31, 2025 09:28:28","Duration":"287ms","SessionId":"46DF53E774BA9A145D58788BF2D90513","Location":"Yangon, MM"}	N	CATEGORY	N	103.186.123.13	46DF53E774BA9A145D58788BF2D90513	MEDIUM	SUCCESS	2025-07-31 09:28:28.439923	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
66	UPDATE	{"before":{"gender":"male"},"changedFields":["gender"],"after":{"gender":"MALE"}}	Updated user	{"EntityId":"1","EndTime":"Jul 31, 2025 09:29:12","StartTime":"Jul 31, 2025 09:29:11","Duration":"539ms","SessionId":"6E185A3844D7D89C7473C9FF52C024C6","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	6E185A3844D7D89C7473C9FF52C024C6	MEDIUM	SUCCESS	2025-07-31 09:29:12.005294	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
67	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 09:34:38","StartTime":"Jul 31, 2025 09:34:35","Duration":"2373ms","SessionId":"085814A579161C6A484A79259B85F340","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	085814A579161C6A484A79259B85F340	MEDIUM	SUCCESS	2025-07-31 09:34:38.163	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
68	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 09:39:54","StartTime":"Jul 31, 2025 09:39:52","Duration":"2112ms","SessionId":"59081F2A7D914F9290A82A8D7DDF5BBF","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	59081F2A7D914F9290A82A8D7DDF5BBF	MEDIUM	SUCCESS	2025-07-31 09:39:54.996383	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
69	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 09:42:44","StartTime":"Jul 31, 2025 09:42:38","Duration":"6248ms","SessionId":"sess_2dhd9x7u2y","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	sess_2dhd9x7u2y	LOW	SUCCESS	2025-07-31 09:42:45.172679	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ADMIN
70	CREATE	N	Created product	{"EndTime":"Jul 31, 2025 09:52:51","StartTime":"Jul 31, 2025 09:52:48","Duration":"2077ms","SessionId":"036324E0ABF4826C9F2448E8CCBF74E1","Location":"Yangon, MM"}	N	PRODUCT	N	103.186.123.13	036324E0ABF4826C9F2448E8CCBF74E1	MEDIUM	SUCCESS	2025-07-31 09:52:51.0327	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
71	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 09:57:27","StartTime":"Jul 31, 2025 09:57:26","Duration":"562ms","SessionId":"46984B7088428D6A6A00DF0C010B6191","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	46984B7088428D6A6A00DF0C010B6191	MEDIUM	SUCCESS	2025-07-31 09:57:27.33739	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
72	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:03:58","StartTime":"Jul 31, 2025 10:03:56","Duration":"1856ms","SessionId":"275F5601041D8F6B040C7AA0BD923D69","Location":"Yangon, MM"}	N	DISCOUNT	N	103.186.123.13	275F5601041D8F6B040C7AA0BD923D69	MEDIUM	SUCCESS	2025-07-31 10:03:58.059757	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
73	DELETE	N	Deleted discount	{"EntityId":"2","EndTime":"Jul 31, 2025 10:04:50","StartTime":"Jul 31, 2025 10:04:50","Duration":"221ms","SessionId":"1B7F130479CF6661125D7A346755A9FA","Location":"Yangon, MM"}	2	DISCOUNT	N	103.186.123.13	1B7F130479CF6661125D7A346755A9FA	HIGH	SUCCESS	2025-07-31 10:04:50.601994	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
74	UPDATE	{"before":{"code":null},"changedFields":["code"],"after":{"code":""}}	Updated discount	{"EntityId":"3","EndTime":"Jul 31, 2025 10:06:50","StartTime":"Jul 31, 2025 10:06:50","Duration":"250ms","SessionId":"7C539A9B8E60CDE0CB924E7E2E526A5A","Location":"Yangon, MM"}	3	DISCOUNT	N	103.186.123.13	7C539A9B8E60CDE0CB924E7E2E526A5A	MEDIUM	SUCCESS	2025-07-31 10:06:50.588055	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
75	UPDATE	{"before":{"code":null},"changedFields":["code"],"after":{"code":""}}	Updated discount	{"EntityId":"3","EndTime":"Jul 31, 2025 10:07:03","StartTime":"Jul 31, 2025 10:07:03","Duration":"164ms","SessionId":"AF67EFBED44B7E188BBD8925AC66C6F7","Location":"Yangon, MM"}	3	DISCOUNT	N	103.186.123.13	AF67EFBED44B7E188BBD8925AC66C6F7	MEDIUM	SUCCESS	2025-07-31 10:07:04.001812	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
76	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:11:01","StartTime":"Jul 31, 2025 10:11:00","Duration":"623ms","SessionId":"E8FC8E1EEEFA95B3D587C6BDF9150282","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	E8FC8E1EEEFA95B3D587C6BDF9150282	MEDIUM	SUCCESS	2025-07-31 10:11:01.078915	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
77	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:14:52","StartTime":"Jul 31, 2025 10:14:51","Duration":"513ms","SessionId":"CD80C047F742F11B7E3E356FE4A2C751","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	CD80C047F742F11B7E3E356FE4A2C751	MEDIUM	SUCCESS	2025-07-31 10:14:52.241795	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
80	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:22:52","StartTime":"Jul 31, 2025 10:22:50","Duration":"1222ms","SessionId":"367A6CBED844286535F58DD981CBD4FB","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	367A6CBED844286535F58DD981CBD4FB	MEDIUM	SUCCESS	2025-07-31 10:22:52.032555	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
81	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:23:58","StartTime":"Jul 31, 2025 10:23:57","Duration":"1467ms","SessionId":"716284D0F57F782A76EC0F2E8B7BD1C2","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	716284D0F57F782A76EC0F2E8B7BD1C2	MEDIUM	SUCCESS	2025-07-31 10:23:58.478734	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
82	UPDATE	{"before":{"code":null},"changedFields":["code"],"after":{"code":""}}	Updated discount	{"EntityId":"8","EndTime":"Jul 31, 2025 10:24:26","StartTime":"Jul 31, 2025 10:24:26","Duration":"151ms","SessionId":"B96A83E9B8E46E89C0DFF6BE0AEF89B0","Location":"Yangon, MM"}	8	DISCOUNT	N	204.157.172.86	B96A83E9B8E46E89C0DFF6BE0AEF89B0	MEDIUM	SUCCESS	2025-07-31 10:24:26.740387	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
78	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 10:15:23","StartTime":"Jul 31, 2025 10:15:19","Duration":"4262ms","SessionId":"sess_ppx54s4b42","Location":"Yangon, MM"}	4	USER	N	103.186.123.13	sess_ppx54s4b42	LOW	SUCCESS	2025-07-31 10:15:23.407955	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	CUSTOMER
79	CREATE	N	Created discount	{"EndTime":"Jul 31, 2025 10:21:54","StartTime":"Jul 31, 2025 10:21:52","Duration":"1818ms","SessionId":"9BF57E395F0C4F31C66637FEE1279FC4","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	9BF57E395F0C4F31C66637FEE1279FC4	MEDIUM	SUCCESS	2025-07-31 10:21:54.210607	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
83	UPDATE	{"before":{"code":null},"changedFields":["code"],"after":{"code":""}}	Updated discount	{"EntityId":"7","EndTime":"Jul 31, 2025 10:24:59","StartTime":"Jul 31, 2025 10:24:59","Duration":"130ms","SessionId":"D5757399B09DD190172064D0F8726C5D","Location":"Yangon, MM"}	7	DISCOUNT	N	204.157.172.86	D5757399B09DD190172064D0F8726C5D	MEDIUM	SUCCESS	2025-07-31 10:24:59.249689	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
84	UPDATE	{"before":{"code":null},"changedFields":["code"],"after":{"code":""}}	Updated discount	{"EntityId":"1","EndTime":"Jul 31, 2025 10:25:26","StartTime":"Jul 31, 2025 10:25:26","Duration":"146ms","SessionId":"E1A14041617B6F1B03F68E2137D9FF19","Location":"Yangon, MM"}	1	DISCOUNT	N	204.157.172.86	E1A14041617B6F1B03F68E2137D9FF19	MEDIUM	SUCCESS	2025-07-31 10:25:26.708003	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
85	UPDATE	{"before":{"phoneNumber":null},"changedFields":["phoneNumber"],"after":{"phoneNumber":"09298370027"}}	Updated user	{"EntityId":"4","EndTime":"Jul 31, 2025 10:25:32","StartTime":"Jul 31, 2025 10:25:32","Duration":"118ms","SessionId":"36F10B353FB25DF5F0538E0D84753CB1","Location":"Yangon, MM"}	4	USER	N	103.186.123.13	36F10B353FB25DF5F0538E0D84753CB1	MEDIUM	SUCCESS	2025-07-31 10:25:32.310937	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
86	UPDATE	{"before":{"gender":"male"},"changedFields":["gender"],"after":{"gender":"MALE"}}	Updated user	{"EntityId":"4","EndTime":"Jul 31, 2025 10:27:07","StartTime":"Jul 31, 2025 10:27:07","Duration":"106ms","SessionId":"E0368E887AE4319B7981108DE33AF292","Location":"Yangon, MM"}	4	USER	N	103.186.123.13	E0368E887AE4319B7981108DE33AF292	MEDIUM	SUCCESS	2025-07-31 10:27:07.630524	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
87	UPDATE	N	Updated order status	{"EntityId":"1","EndTime":"Jul 31, 2025 10:32:50","StartTime":"Jul 31, 2025 10:32:49","Duration":"919ms","SessionId":"5C4AFAC28532EC4ADBE2B32AC79EF236","Location":"Yangon, MM"}	1	ORDER	N	103.186.123.13	5C4AFAC28532EC4ADBE2B32AC79EF236	HIGH	SUCCESS	2025-07-31 10:32:50.33966	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
88	UPDATE	N	Updated order status	{"EntityId":"2","EndTime":"Jul 31, 2025 10:33:19","StartTime":"Jul 31, 2025 10:33:18","Duration":"892ms","SessionId":"BD28643F3BA5C2DDA9E522D8A9D0F817","Location":"Yangon, MM"}	2	ORDER	N	103.186.123.13	BD28643F3BA5C2DDA9E522D8A9D0F817	HIGH	SUCCESS	2025-07-31 10:33:19.665621	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
89	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 10:34:15","StartTime":"Jul 31, 2025 10:34:15","Duration":"137ms","SessionId":"48BC5B89551E49A4AA6648F0991796DA","Location":"Yangon, MM"}	N	ADDRESS	N	103.186.123.13	48BC5B89551E49A4AA6648F0991796DA	LOW	SUCCESS	2025-07-31 10:34:15.816514	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
90	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 10:34:46","StartTime":"Jul 31, 2025 10:34:46","Duration":"150ms","SessionId":"5E13509BA3DCF736F2E47DCDB5EAC4FA","Location":"Yangon, MM"}	N	ADDRESS	N	103.186.123.13	5E13509BA3DCF736F2E47DCDB5EAC4FA	LOW	SUCCESS	2025-07-31 10:34:46.722818	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
91	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 10:36:22","StartTime":"Jul 31, 2025 10:36:22","Duration":"131ms","SessionId":"572A02636DC7E1AC8A7E39A030F92850","Location":"Yangon, MM"}	N	ADDRESS	N	103.186.123.13	572A02636DC7E1AC8A7E39A030F92850	LOW	SUCCESS	2025-07-31 10:36:22.193144	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
92	CREATE	N	Created order	{"EndTime":"Jul 31, 2025 10:37:21","StartTime":"Jul 31, 2025 10:37:17","Duration":"4723ms","SessionId":"0ED65E8BE765F27B4915A000A1E8D9E3","Location":"Yangon, MM"}	N	ORDER	N	103.186.123.13	0ED65E8BE765F27B4915A000A1E8D9E3	MEDIUM	SUCCESS	2025-07-31 10:37:21.816722	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
93	CREATE	N	Added new address	{"EndTime":"Jul 31, 2025 10:38:21","StartTime":"Jul 31, 2025 10:38:21","Duration":"151ms","SessionId":"10CCD0081EA07494BB79C115CDE39E3A","Location":"Yangon, MM"}	N	ADDRESS	N	103.186.123.13	10CCD0081EA07494BB79C115CDE39E3A	LOW	SUCCESS	2025-07-31 10:38:21.723718	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
94	DELETE	N	Deleted address	{"EntityId":"7","EndTime":"Jul 31, 2025 10:38:30","StartTime":"Jul 31, 2025 10:38:30","Duration":"183ms","SessionId":"93713065477D2C0902EEC1840A4A31C5","Location":"Yangon, MM"}	7	ADDRESS	N	103.186.123.13	93713065477D2C0902EEC1840A4A31C5	LOW	SUCCESS	2025-07-31 10:38:30.828271	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
95	CREATE	N	Created order	{"EndTime":"Jul 31, 2025 11:00:19","StartTime":"Jul 31, 2025 11:00:15","Duration":"4348ms","SessionId":"B7E2F651CBD6D7D4080770DF841B6CEC","Location":"Yangon, MM"}	N	ORDER	N	103.186.123.13	B7E2F651CBD6D7D4080770DF841B6CEC	MEDIUM	SUCCESS	2025-07-31 11:00:19.947433	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
130	CREATE	N	Submitted return request - FAILED	N	N	RETURN_REQUEST	N	103.186.123.13	BC4E5F7D1060CD2C8D62CDCA6DCED3B8	CRITICAL	SUCCESS	2025-07-31 11:49:33.183327	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
96	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:14:56","StartTime":"Jul 31, 2025 11:14:49","Duration":"6278ms","SessionId":"sess_ajytl6jzrn","Location":"Yangon, MM"}	5	USER	N	103.186.123.13	sess_ajytl6jzrn	LOW	SUCCESS	2025-07-31 11:14:56.413457	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
97	CREATE	N	Added product to wishlist	{"EntityName":"Unknown WISHLIST","EndTime":"Jul 31, 2025 11:15:42","StartTime":"Jul 31, 2025 11:15:41","Duration":"388ms","SessionId":"801741C5896432765753974238783981","Location":"Yangon, MM"}	N	WISHLIST	N	103.186.123.13	801741C5896432765753974238783981	LOW	SUCCESS	2025-07-31 11:15:42.374896	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
98	UPDATE	{"before":{"orderStatus":"PENDING","updatedDate":"2025-07-31 11:00:15"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"PAID","updatedDate":"2025-07-31 11:16:12"}}	Updated order **Order --4** status	{"EntityId":"4","EntityName":"Order #4","EndTime":"Jul 31, 2025 11:16:12","StartTime":"Jul 31, 2025 11:16:12","Duration":"579ms","SessionId":"1696631175FA68778E54F89254FB9B85","Location":"Yangon, MM"}	4	ORDER	N	103.186.123.13	1696631175FA68778E54F89254FB9B85	HIGH	SUCCESS	2025-07-31 11:16:12.654407	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
99	UPDATE	{"before":{"orderStatus":"PAID","updatedDate":"2025-07-31 11:16:12"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"PROCESSING","updatedDate":"2025-07-31 11:16:21"}}	Updated order **Order --4** status	{"EntityId":"4","EntityName":"Order #4","EndTime":"Jul 31, 2025 11:16:21","StartTime":"Jul 31, 2025 11:16:21","Duration":"671ms","SessionId":"7BDA3D379A9AB86688AC095FD018A2C0","Location":"Yangon, MM"}	4	ORDER	N	103.186.123.13	7BDA3D379A9AB86688AC095FD018A2C0	HIGH	SUCCESS	2025-07-31 11:16:21.983389	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
100	UPDATE	{"before":{"orderStatus":"PROCESSING","updatedDate":"2025-07-31 11:16:21"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"SHIPPED","updatedDate":"2025-07-31 11:16:30"}}	Updated order **Order --4** status	{"EntityId":"4","EntityName":"Order #4","EndTime":"Jul 31, 2025 11:16:30","StartTime":"Jul 31, 2025 11:16:30","Duration":"675ms","SessionId":"A7E975EBB16E5D612C7DD451643AEAD3","Location":"Yangon, MM"}	4	ORDER	N	103.186.123.13	A7E975EBB16E5D612C7DD451643AEAD3	HIGH	SUCCESS	2025-07-31 11:16:30.798707	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
101	UPDATE	{"before":{"orderStatus":"SHIPPED","updatedDate":"2025-07-31 11:16:30"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"DELIVERED","updatedDate":"2025-07-31 11:16:41"}}	Updated order **Order --4** status	{"EntityId":"4","EntityName":"Order #4","EndTime":"Jul 31, 2025 11:16:42","StartTime":"Jul 31, 2025 11:16:41","Duration":"697ms","SessionId":"1E911E83B965B0AB83597306D000349E","Location":"Yangon, MM"}	4	ORDER	N	103.186.123.13	1E911E83B965B0AB83597306D000349E	HIGH	SUCCESS	2025-07-31 11:16:42.034298	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
102	UPDATE	{"before":{"orderStatus":"PENDING","updatedDate":"2025-07-31 10:37:17"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"PAID","updatedDate":"2025-07-31 11:17:26"}}	Updated order **Order --3** status	{"EntityId":"3","EntityName":"Order #3","EndTime":"Jul 31, 2025 11:17:26","StartTime":"Jul 31, 2025 11:17:26","Duration":"609ms","SessionId":"020B3B797A3D5B364094FBA2AF36F8E2","Location":"Yangon, MM"}	3	ORDER	N	103.186.123.13	020B3B797A3D5B364094FBA2AF36F8E2	HIGH	SUCCESS	2025-07-31 11:17:26.65828	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
103	UPDATE	{"before":{"phoneNumber":null},"changedFields":["phoneNumber"],"after":{"phoneNumber":"09298370027"}}	Updated user **Kyaw Kyaw**	{"EntityId":"5","EntityName":"Kyaw Kyaw","EndTime":"Jul 31, 2025 11:21:05","StartTime":"Jul 31, 2025 11:21:05","Duration":"134ms","SessionId":"0A841E6BBA04F60831A08D4C8B6456F2","Location":"Yangon, MM"}	5	USER	N	103.186.123.13	0A841E6BBA04F60831A08D4C8B6456F2	MEDIUM	SUCCESS	2025-07-31 11:21:05.198842	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
104	CREATE	N	Added new address	{"EntityName":"Youth Advocates for Theravada Buddhism, No.169, 9A","EndTime":"Jul 31, 2025 11:21:23","StartTime":"Jul 31, 2025 11:21:23","Duration":"185ms","SessionId":"7CB5C92BE378DB36F5DA2D11B34AD04B","Location":"Yangon, MM"}	N	ADDRESS	N	103.186.123.13	7CB5C92BE378DB36F5DA2D11B34AD04B	LOW	SUCCESS	2025-07-31 11:21:23.257112	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
105	CREATE	N	Created saved card	{"EntityName":"Unknown SAVED_CARD","EndTime":"Jul 31, 2025 11:22:09","StartTime":"Jul 31, 2025 11:22:08","Duration":"193ms","SessionId":"4094BAF12F213573B50060F71687A12D","Location":"Yangon, MM"}	N	SAVED_CARD	N	103.186.123.13	4094BAF12F213573B50060F71687A12D	MEDIUM	SUCCESS	2025-07-31 11:22:09.164284	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
106	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:22:10","StartTime":"Jul 31, 2025 11:22:05","Duration":"4591ms","SessionId":"sess_kfbth3i1vy","Location":"Unknown Location"}	5	USER	N	103.186.123.13	sess_kfbth3i1vy	LOW	SUCCESS	2025-07-31 11:22:12.323766	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
107	CREATE	N	Created order	{"EntityName":"Unknown ORDER","EndTime":"Jul 31, 2025 11:22:14","StartTime":"Jul 31, 2025 11:22:09","Duration":"4999ms","SessionId":"82EA3A7A26C81FD05B5F9BFA1C39F4C5","Location":"Yangon, MM"}	N	ORDER	N	103.186.123.13	82EA3A7A26C81FD05B5F9BFA1C39F4C5	MEDIUM	SUCCESS	2025-07-31 11:22:14.61559	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
108	UPDATE	{"before":{"gender":"male"},"changedFields":["gender"],"after":{"gender":"MALE"}}	Updated user **Kyaw Kyaw**	{"EntityId":"5","EntityName":"Kyaw Kyaw","EndTime":"Jul 31, 2025 11:28:56","StartTime":"Jul 31, 2025 11:28:56","Duration":"86ms","SessionId":"3B284601D86553088B06CFCD80F6560F","Location":"Unknown Location"}	5	USER	N	103.186.123.13	3B284601D86553088B06CFCD80F6560F	MEDIUM	SUCCESS	2025-07-31 11:28:56.810876	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
109	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:29:41","StartTime":"Jul 31, 2025 11:29:36","Duration":"4498ms","SessionId":"sess_lul062dtta","Location":"Unknown Location"}	5	USER	N	103.186.123.13	sess_lul062dtta	LOW	SUCCESS	2025-07-31 11:29:41.11825	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
110	UPDATE	{"before":{"orderStatus":"PAID","updatedDate":"2025-07-31 11:17:26"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"PROCESSING","updatedDate":"2025-07-31 11:35:07"}}	Updated order **Order --3** status	{"EntityId":"3","EntityName":"Order #3","EndTime":"Jul 31, 2025 11:35:07","StartTime":"Jul 31, 2025 11:35:07","Duration":"638ms","SessionId":"2BF49265F1ABA02DF8C2D93E5F8D6C69","Location":"Yangon, MM"}	3	ORDER	N	103.186.123.13	2BF49265F1ABA02DF8C2D93E5F8D6C69	HIGH	SUCCESS	2025-07-31 11:35:07.655705	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
111	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:35:26","StartTime":"Jul 31, 2025 11:35:21","Duration":"4780ms","SessionId":"sess_dpiedf6w7n","Location":"Unknown Location"}	5	USER	N	103.186.123.13	sess_dpiedf6w7n	LOW	SUCCESS	2025-07-31 11:35:26.267444	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
112	UPDATE	{"before":{"orderStatus":"PROCESSING","updatedDate":"2025-07-31 11:35:07"},"changedFields":["orderStatus","updatedDate"],"after":{"orderStatus":"SHIPPED","updatedDate":"2025-07-31 11:35:34"}}	Updated order **Order --3** status	{"EntityId":"3","EntityName":"Order #3","EndTime":"Jul 31, 2025 11:35:34","StartTime":"Jul 31, 2025 11:35:34","Duration":"710ms","SessionId":"AFE50D5908093F6B15F8980AACA6D90D","Location":"Yangon, MM"}	3	ORDER	N	103.186.123.13	AFE50D5908093F6B15F8980AACA6D90D	HIGH	SUCCESS	2025-07-31 11:35:34.747071	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
113	CREATE	N	Created order	{"EntityName":"Unknown ORDER","EndTime":"Jul 31, 2025 11:37:57","StartTime":"Jul 31, 2025 11:37:52","Duration":"4938ms","SessionId":"A35B111DEDD224AE5DA21F2FF138D4D0","Location":"Yangon, MM"}	N	ORDER	N	103.186.123.13	A35B111DEDD224AE5DA21F2FF138D4D0	MEDIUM	SUCCESS	2025-07-31 11:37:57.863502	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	ROLE_CUSTOMER
114	CREATE	N	Created revenue target	{"EntityName":"Unknown REVENUE_TARGET","EndTime":"Jul 31, 2025 11:38:35","StartTime":"Jul 31, 2025 11:38:35","Duration":"125ms","SessionId":"F22338B7C92AC5F745871CEF64E695DE","Location":"Unknown Location"}	N	REVENUE_TARGET	N	103.186.123.13	F22338B7C92AC5F745871CEF64E695DE	MEDIUM	SUCCESS	2025-07-31 11:38:35.395172	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
115	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:40:09","StartTime":"Jul 31, 2025 11:40:04","Duration":"4601ms","SessionId":"sess_hp3rqbvcxj","Location":"Yangon, MM"}	4	USER	N	204.157.172.86	sess_hp3rqbvcxj	LOW	SUCCESS	2025-07-31 11:40:09.574864	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	4	Marc	CUSTOMER
116	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:31","StartTime":"Jul 31, 2025 11:43:17","Duration":"13965ms","SessionId":"196737DC1DA33AE9E4E105F7419948AD","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	196737DC1DA33AE9E4E105F7419948AD	HIGH	SUCCESS	2025-07-31 11:43:31.799198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
117	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:36","StartTime":"Jul 31, 2025 11:43:22","Duration":"13873ms","SessionId":"33DFFD1E9EF72FFF2BAF8B6ACF63BC4D","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	33DFFD1E9EF72FFF2BAF8B6ACF63BC4D	HIGH	SUCCESS	2025-07-31 11:43:36.168436	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
118	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:42","StartTime":"Jul 31, 2025 11:43:28","Duration":"13880ms","SessionId":"13BE1A4586D079097956D1536FC1AFD2","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	13BE1A4586D079097956D1536FC1AFD2	HIGH	SUCCESS	2025-07-31 11:43:42.104545	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
119	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:46","StartTime":"Jul 31, 2025 11:43:32","Duration":"14003ms","SessionId":"DEB8E29FF041FBC4AD5A28536DBF1ABF","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	DEB8E29FF041FBC4AD5A28536DBF1ABF	HIGH	SUCCESS	2025-07-31 11:43:46.93301	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
120	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:52","StartTime":"Jul 31, 2025 11:43:37","Duration":"15886ms","SessionId":"FBA8B823F8F66E1C8FAD0991CECD999F","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	FBA8B823F8F66E1C8FAD0991CECD999F	HIGH	SUCCESS	2025-07-31 11:43:52.966205	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
121	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:43:56","StartTime":"Jul 31, 2025 11:43:37","Duration":"18974ms","SessionId":"5B4196DD14F3822A9EEBBA10D15671C4","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	5B4196DD14F3822A9EEBBA10D15671C4	HIGH	SUCCESS	2025-07-31 11:43:56.724847	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
122	CREATE	N	Added entry to blacklist	{"EntityName":"Unknown BLACKLIST","EndTime":"Jul 31, 2025 11:44:04","StartTime":"Jul 31, 2025 11:43:39","Duration":"25883ms","SessionId":"E94D03C88BBFFCC78829EFADB2BDC8A5","Location":"Unknown Location"}	N	BLACKLIST	N	103.186.123.13	E94D03C88BBFFCC78829EFADB2BDC8A5	HIGH	SUCCESS	2025-07-31 11:44:04.966562	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	2	Ei Kyaw	ROLE_ADMIN
123	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:44:16","StartTime":"Jul 31, 2025 11:44:10","Duration":"5864ms","SessionId":"sess_n0vgft26ho","Location":"Yangon, MM"}	5	USER	N	103.186.123.13	sess_n0vgft26ho	LOW	SUCCESS	2025-07-31 11:44:16.232443	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	5	Kyaw Kyaw	CUSTOMER
124	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:44:48","StartTime":"Jul 31, 2025 11:44:42","Duration":"5809ms","SessionId":"sess_7d22i6yk2h","Location":"Yangon, MM"}	4	USER	N	103.186.123.13	sess_7d22i6yk2h	LOW	SUCCESS	2025-07-31 11:44:48.239272	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	CUSTOMER
125	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:46:32","StartTime":"Jul 31, 2025 11:46:28","Duration":"4601ms","SessionId":"sess_gp63awnyat","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	sess_gp63awnyat	LOW	SUCCESS	2025-07-31 11:46:32.668931	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	CUSTOMER
126	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:46:56","StartTime":"Jul 31, 2025 11:46:52","Duration":"4779ms","SessionId":"sess_joa0r56utq","Location":"Unknown Location"}	1	USER	N	103.186.123.13	sess_joa0r56utq	LOW	SUCCESS	2025-07-31 11:46:57.008111	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	CUSTOMER
127	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:47:20","StartTime":"Jul 31, 2025 11:47:14","Duration":"5444ms","SessionId":"sess_k8irm2fgzd","Location":"Unknown Location"}	3	USER	N	103.186.123.13	sess_k8irm2fgzd	LOW	SUCCESS	2025-07-31 11:47:20.204264	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
128	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:47:29","StartTime":"Jul 31, 2025 11:47:23","Duration":"6004ms","SessionId":"sess_g5brcz2d52","Location":"Unknown Location"}	3	USER	N	103.186.123.13	sess_g5brcz2d52	LOW	SUCCESS	2025-07-31 11:47:29.282491	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	3	htoo aung	ADMIN
129	CREATE	N	Submitted return request - FAILED	N	N	RETURN_REQUEST	N	103.186.123.13	DB26F7A67050579986BEC765949F8CD0	CRITICAL	SUCCESS	2025-07-31 11:48:46.515133	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
131	LOGIN	N	User login	{"EndTime":"Jul 31, 2025 11:51:18","StartTime":"Jul 31, 2025 11:51:13","Duration":"5528ms","SessionId":"sess_le0n823um2","Location":"Yangon, MM"}	1	USER	N	204.157.172.86	sess_le0n823um2	LOW	SUCCESS	2025-07-31 11:51:18.659993	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ADMIN
132	CREATE	N	Created order	{"EntityName":"Unknown ORDER","EndTime":"Jul 31, 2025 13:08:19","StartTime":"Jul 31, 2025 13:08:12","Duration":"6937ms","SessionId":"69CA0525B52617FA49576E855BA906C4","Location":"Yangon, MM"}	N	ORDER	N	204.157.172.86	69CA0525B52617FA49576E855BA906C4	MEDIUM	SUCCESS	2025-07-31 13:08:19.029575	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	4	Marc	ROLE_CUSTOMER
133	CREATE	N	Validated coupon	{"EntityName":"Unknown COUPON","EndTime":"Jul 31, 2025 14:15:57","StartTime":"Jul 31, 2025 14:15:56","Duration":"191ms","SessionId":"2B4553030316760175A7AAC59D0C699D","Location":"Yangon, MM"}	N	COUPON	N	204.157.172.86	2B4553030316760175A7AAC59D0C699D	LOW	SUCCESS	2025-07-31 14:15:57.151689	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
134	CREATE	N	Validated coupon	{"EntityName":"Unknown COUPON","EndTime":"Jul 31, 2025 14:16:09","StartTime":"Jul 31, 2025 14:16:09","Duration":"104ms","SessionId":"42834738267E7F54177F056C4E28993A","Location":"Yangon, MM"}	N	COUPON	N	204.157.172.86	42834738267E7F54177F056C4E28993A	LOW	SUCCESS	2025-07-31 14:16:09.76373	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
135	CREATE	N	Created revenue target	{"EntityName":"Unknown REVENUE_TARGET","EndTime":"Jul 31, 2025 15:14:41","StartTime":"Jul 31, 2025 15:14:41","Duration":"127ms","SessionId":"FBD28857CCED45BF9DA44A4F6EF1BDF3","Location":"Yangon, MM"}	N	REVENUE_TARGET	N	204.157.172.86	FBD28857CCED45BF9DA44A4F6EF1BDF3	MEDIUM	SUCCESS	2025-07-31 15:14:41.859452	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
136	CREATE	N	Created discount	{"EntityName":"11.11","EndTime":"Jul 31, 2025 15:25:38","StartTime":"Jul 31, 2025 15:25:37","Duration":"1404ms","SessionId":"71251912E57CC29BA4E35A871BDD8DBE","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	71251912E57CC29BA4E35A871BDD8DBE	MEDIUM	SUCCESS	2025-07-31 15:25:38.60164	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
137	CREATE	N	Created discount	{"EntityName":"Brand Discount","EndTime":"Jul 31, 2025 15:28:43","StartTime":"Jul 31, 2025 15:28:42","Duration":"1359ms","SessionId":"5BF5AE2B2E6729AD0EA4FC940EC9E351","Location":"Yangon, MM"}	N	DISCOUNT	N	204.157.172.86	5BF5AE2B2E6729AD0EA4FC940EC9E351	MEDIUM	SUCCESS	2025-07-31 15:28:43.893354	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1	pmk	ROLE_ADMIN
138	UPDATE	N	Updated policy **Unknown Entity (ID: 2)**	{"EntityId":"2","EntityName":"Unknown Entity (ID: 2)","EndTime":"Jul 31, 2025 15:36:27","StartTime":"Jul 31, 2025 15:36:27","Duration":"176ms","SessionId":"901D88D60D678BEA426B00807D851B95","Location":"Yangon, MM"}	2	POLICY	N	103.186.123.13	901D88D60D678BEA426B00807D851B95	MEDIUM	SUCCESS	2025-07-31 15:36:27.449375	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
139	UPDATE	N	Updated policy **Unknown Entity (ID: 3)**	{"EntityId":"3","EntityName":"Unknown Entity (ID: 3)","EndTime":"Jul 31, 2025 15:37:09","StartTime":"Jul 31, 2025 15:37:09","Duration":"162ms","SessionId":"D23B30552627FA79810307FE17AC5A00","Location":"Yangon, MM"}	3	POLICY	N	103.186.123.13	D23B30552627FA79810307FE17AC5A00	MEDIUM	SUCCESS	2025-07-31 15:37:09.52586	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	2	Ei Kyaw	ROLE_ADMIN
140	CREATE	N	Submitted return request - FAILED	N	N	RETURN_REQUEST	N	103.186.123.13	A939F6F84A4732FBEFE4028DAD52587C	CRITICAL	SUCCESS	2025-07-31 15:38:28.343892	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
141	CREATE	N	Added product to wishlist	{"EntityName":"Unknown WISHLIST","EndTime":"Jul 31, 2025 20:50:40","StartTime":"Jul 31, 2025 20:50:38","Duration":"2763ms","SessionId":"79989D67EFA33362B863926BE2798B45","Location":"Unknown Location"}	N	WISHLIST	N	69.160.8.20	79989D67EFA33362B863926BE2798B45	LOW	SUCCESS	2025-07-31 20:50:40.970726	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
142	CREATE	N	Added product to wishlist	{"EntityName":"Unknown WISHLIST","EndTime":"Jul 31, 2025 20:50:41","StartTime":"Jul 31, 2025 20:50:40","Duration":"444ms","SessionId":"31FD1A6BA4932B325C3A728EE8ECEB08","Location":"Unknown Location"}	N	WISHLIST	N	69.160.8.20	31FD1A6BA4932B325C3A728EE8ECEB08	LOW	SUCCESS	2025-07-31 20:50:41.224219	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
143	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:50:41","StartTime":"Jul 31, 2025 20:50:39","Error":"Query did not return a unique result: 2 results were returned","Duration":"2177ms","SessionId":"47D0EDB509BDE4C6003D799D21778F8D","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	47D0EDB509BDE4C6003D799D21778F8D	CRITICAL	FAILED	2025-07-31 20:50:41.882661	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
144	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:00","StartTime":"Jul 31, 2025 20:51:00","Error":"Query did not return a unique result: 2 results were returned","Duration":"166ms","SessionId":"234D68EC6CAE41E5EFE1D6790A33E1D6","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	234D68EC6CAE41E5EFE1D6790A33E1D6	CRITICAL	FAILED	2025-07-31 20:51:00.690438	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
145	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:02","StartTime":"Jul 31, 2025 20:51:02","Error":"Query did not return a unique result: 2 results were returned","Duration":"245ms","SessionId":"17501553BE5BF0A703F79CD8CF7CD6FE","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	17501553BE5BF0A703F79CD8CF7CD6FE	CRITICAL	FAILED	2025-07-31 20:51:02.912047	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
146	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:04","StartTime":"Jul 31, 2025 20:51:03","Error":"Query did not return a unique result: 2 results were returned","Duration":"216ms","SessionId":"D9A1C3BBDF37D7C2DA7F4B28EE7D9DBF","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	D9A1C3BBDF37D7C2DA7F4B28EE7D9DBF	CRITICAL	FAILED	2025-07-31 20:51:04.010202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
147	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:05","StartTime":"Jul 31, 2025 20:51:04","Error":"Query did not return a unique result: 2 results were returned","Duration":"210ms","SessionId":"78D7E481A27794B29441531B217A6D27","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	78D7E481A27794B29441531B217A6D27	CRITICAL	FAILED	2025-07-31 20:51:05.075287	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
149	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:08","StartTime":"Jul 31, 2025 20:51:07","Error":"Query did not return a unique result: 2 results were returned","Duration":"147ms","SessionId":"78B5C0DA5E3D68DD4AE2539577BFE6EB","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	78B5C0DA5E3D68DD4AE2539577BFE6EB	CRITICAL	FAILED	2025-07-31 20:51:08.006311	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
150	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:09","StartTime":"Jul 31, 2025 20:51:08","Error":"Query did not return a unique result: 2 results were returned","Duration":"162ms","SessionId":"363BC6DA34F2EA50C9FCAE16D1D4C592","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	363BC6DA34F2EA50C9FCAE16D1D4C592	CRITICAL	FAILED	2025-07-31 20:51:09.044036	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
148	DELETE	N	Removed product from wishlist - FAILED	{"EndTime":"Jul 31, 2025 20:51:05","StartTime":"Jul 31, 2025 20:51:05","Error":"Query did not return a unique result: 2 results were returned","Duration":"163ms","SessionId":"8ABCE92B29EA231A16BCC39D2D7AA0B8","Location":"Unknown Location"}	N	WISHLIST	Query did not return a unique result: 2 results were returned	69.160.8.20	8ABCE92B29EA231A16BCC39D2D7AA0B8	CRITICAL	FAILED	2025-07-31 20:51:05.726743	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4	Marc	ROLE_CUSTOMER
.


--
-- SQLINES DEMO *** dress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.address (id, address, city, country, create_update, latitude, longitude, postal_code, state, status, type, update_date, user_id) FROM stdin;
1	Mayangone, Mayangon District, Yangon City	Yangon City	Myanmar	2025-07-31 09:05:48.98016	16.86241280	96.13148160	11061	Yangon	1	SHIPPING	2025-07-31 09:05:48.98016	2
2	Myayadanar Street, Hlaing, Mayangon District	Yangon City	Myanmar	2025-07-31 09:06:49.268098	16.84167364	96.11958569	11510	Yangon	1	SHIPPING	2025-07-31 09:06:49.268098	2
3	Waizayantar Road, Mayangone, Mayangon District	Yangon City	Myanmar	2025-07-31 09:07:49.154818	16.86798698	96.15830712	11421	Yangon	1	SHIPPING	2025-07-31 09:07:49.154818	2
4	Youth Advocates for Theravada Buddhism, No.169, 9A	Yangon City	Myanmar	2025-07-31 09:23:39.823633	16.84598098	96.12562263	11051	Yangon	1	SHIPPING	2025-07-31 09:23:39.823633	1
5	Youth Advocates for Theravada Buddhism, No.169, 9A	Yangon City	Myanmar	2025-07-31 10:34:15.746242	16.84961843	96.13517568	11051	Yangon	1	SHIPPING	2025-07-31 10:34:15.746242	4
6	ßÇüßÇ¢ßÇ▒ßÇòßÇäßÇ║ßÇ£ßÇÖßÇ║ßÇ╕, Hlegu Township, Hlegu District	Hlegu District	Myanmar	2025-07-31 10:34:46.651976	21.91369443	95.94410238	11132	Yangon	1	SHIPPING	2025-07-31 10:34:46.651976	4
8	Kauk Lyin Street, Thingangyun, Thingangyun District	Yangon City	Myanmar	2025-07-31 10:38:21.637113	16.84598754	96.12562080	11051	Yangon	1	SHIPPING	2025-07-31 10:38:21.637113	4
7	Youth Advocates for Theravada Buddhism, No.169, 9A	Yangon City	Myanmar	2025-07-31 10:36:22.125948	16.84598754	96.12562080	11051	Yangon	0	SHIPPING	2025-07-31 10:36:22.125948	4
9	Youth Advocates for Theravada Buddhism, No.169, 9A	Yangon City	Myanmar	2025-07-31 11:21:23.163164	16.84595167	96.12766620	11051	Yangon	1	SHIPPING	2025-07-31 11:21:23.163164	5
.


--
-- SQLINES DEMO *** peals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appeals (id, admin_notes, appeal_details, appeal_reason, blacklist_entry_id, contact_email, reviewed_at, reviewed_by, status, submitted_at, user_email) FROM stdin;
.


--
-- SQLINES DEMO *** tribute; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attribute (id, name, status) FROM stdin;
1	Colour	1
.


--
-- SQLINES DEMO *** tribute_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attribute_value (id, value, attribute_id, status) FROM stdin;
1	--000000	1	1
2	--ecb94b	1	1
3	--c6c486	1	1
4	--5a6e35	1	1
5	--212529	1	1
6	--0d1068	1	1
7	--fbf4f4	1	1
8	--7b2df0	1	1
9	--cbd7ec	1	1
10	--f8ecaf	1	1
11	--c54b8c	1	1
12	--ede2d4	1	1
13	--a0a56e	1	1
14	--783f00	1	1
15	--02075d	1	1
16	--c19a6b	1	1
.


--
-- SQLINES DEMO *** acklist_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blacklist_entries (id, added_by, added_date, associated_email, category, device_fingerprint, expiry_date, incident_count, is_automatic, last_incident_date, notes, reason, risk_level, status, target_type, target_value) FROM stdin;
e7b345e1-c65e-4d34-9e72-2317faacc76f	Ei Kyaw	2025-07-31 11:43:17.833374	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:17.833374	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
03fecad8-d869-4ac8-b3e7-fbebf3bbe3b0	Ei Kyaw	2025-07-31 11:43:22.29448	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:22.29448	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
f6b5975d-4aa2-45ad-b467-3007c19fb842	Ei Kyaw	2025-07-31 11:43:28.264923	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:28.264923	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
14226c84-9304-46a6-84c7-45088408380a	Ei Kyaw	2025-07-31 11:43:33.116073	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:33.116073	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
b60e1540-a959-41a0-b900-9ac3453bd346	Ei Kyaw	2025-07-31 11:43:39.117257	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:39.117257	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
962ac722-1abd-4c6e-8756-eab595a915b1	Ei Kyaw	2025-07-31 11:43:42.279051	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:42.279051	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
f7120b22-9dd5-42d2-a006-857463ba7942	Ei Kyaw	2025-07-31 11:43:51.180347	N	FRAUD	N	2026-05-04 00:00:00	1	f	2025-07-31 11:43:51.180347	Detail note	MAB	CRITICAL	ACTIVE	EMAIL	isjustmarc06@gmail.com
.


--
-- SQLINES DEMO *** ocked_ips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocked_ips (id, blocked_until, ip_address, reason, user_email) FROM stdin;
.


--
-- SQLINES DEMO *** and; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brand (id, image, name, status) FROM stdin;
1	/brand_and_category_image/84d3d869-7558-4671-87b5-b46de6bf2d00_Louis-Vuitton-Logo-SVG-preview.jpg	LV	1
2	/brand_and_category_image/57bb15f4-7180-4a94-893c-06b437afaae8_Logo.png	Bonia	1
3	/brand_and_category_image/647c53d1-0f9c-413e-9938-71b06a54160a_Logo.webp	Chanel	1
4	/brand_and_category_image/9f05493f-f5d3-4da0-8883-62729b1b814d_Logo.jpg	Prada	1
5	/brand_and_category_image/65e84b0d-9abb-4df8-a95e-0c71ba610ce3_Logo.jpg	Calvin Klein	1
6	/brand_and_category_image/d030f657-af05-4238-b0b5-3649b1f80acb_Logo.jpg	Tory Burch	1
7	/brand_and_category_image/2780e788-f504-4682-bf88-c8565db7424d_Gucci.jpg	Gucci	1
8	/brand_and_category_image/cf2b6b8e-53e4-4290-8de4-489cd4829fe5_Zara.jpg	Zara	1
9	/brand_and_category_image/8a31a075-2372-402e-8b6b-9e5482ef281f_MK.jpg	Michael Kors	1
10	/brand_and_category_image/fd9f5487-e13f-4bb0-a4f1-30773299410b_Fendi.jpg	Fendi	1
11	/brand_and_category_image/a5eebe00-7b64-4047-8ae1-7ce671b71739_Dior.jpg	Dior	1
12	/brand_and_category_image/ab2ae618-7f95-467f-9972-0b0e6761901a_Giorgio Armani.jpg	Giorgio Armani	1
.


--
-- SQLINES DEMO *** and_has_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brand_has_category (id, brand_id, category_id) FROM stdin;
4	4	1
5	5	2
7	7	2
8	8	1
9	8	2
10	9	1
11	9	2
12	10	1
13	10	2
15	11	1
16	11	2
17	11	3
18	12	3
26	1	3
27	1	5
28	1	1
29	1	2
30	1	4
31	1	6
32	1	7
33	2	5
34	2	2
35	2	4
36	2	6
37	2	7
44	3	5
45	3	1
46	3	2
47	3	4
48	3	6
49	3	7
50	6	5
51	6	1
52	6	2
53	6	4
54	6	6
55	2	8
.


--
-- SQLINES DEMO *** tegory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category (id, image, name, status, parent_id, icon_class, icon_url) FROM stdin;
3	/brand_and_category_image/8b499068-4f94-4fb6-8aac-90575dbfe37d_Armani.jpg	Perfume	1	N	N	N
5	/brand_and_category_image/d9686a4c-5c07-4e98-bde2-331a57c7e725_Bag.jpg	Bag	1	N	N	N
1	/brand_and_category_image/ed527a31-b22d-4f74-a2cc-5690ee74cecd_LeatherToteBlack_8.webp	Tote Bag	1	5	N	N
2	/brand_and_category_image/774e66d8-57f5-4128-9aa6-c89f1783f8ef_5S24-1-2.webp	Shoulder Bag	1	5	N	N
4	/brand_and_category_image/815c5e40-53ad-44ba-be4b-ec3633014ef9_Sling Bage.jpg	Sling Bag	1	5	N	N
6	/brand_and_category_image/841c1f1a-4e08-4bf6-a149-79138f25381b_Bucket Bag.jpg	Bucket Bag	1	5	N	N
7	/brand_and_category_image/97b8504d-35ea-44a1-bc3b-d277f28b467f_Backpack.jpg	Backpack	1	5	N	N
8	/brand_and_category_image/eba82096-ff9a-4387-859b-9b9328642779_licia-mini-hobo-bag-129478.webp	Hand Bag	1	5	N	N
.


--
-- SQLINES DEMO *** ntact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, email, message, name, subject, submitted_at) FROM stdin;
.


--
-- SQLINES DEMO *** livery_method; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_method (id, description, fee, name) FROM stdin;
.


--
-- SQLINES DEMO *** livery_service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_service (id, fee_per_km, name, status, address_id, phone_number) FROM stdin;
1	100.00	Royal Express	1	1	09248102838
2	100.00	Fast Delivery	1	2	094029138830
3	100.00	BEE Delivery	1	3	094203849291
.


--
-- SQLINES DEMO *** scount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount (id, auto_apply, code, description, discount_type, discount_value, end_date, name, start_date, status, event_id, minimum_spend) FROM stdin;
3	t	N	Up to 70% Off on fashion, gadgets, and home essentials. DonΓÇÖt miss the biggest deals of the season!nnImage Suggestions:nnHappy shoppers with bagsnnProduct flat-lays with sale tagsnnCountdown clock or price tags	PERCENTAGE	0.15	2025-08-09	Mega Mid-Year Sale	2025-07-31	t	N	0
4	t	N	silver tier discount for silver tier customer 	PERCENTAGE	0.02	2025-08-09	Silver 	2025-07-21	t	N	0
6	t	N	silver tier discount for silver tier customer 	PERCENTAGE	0.02	2025-08-09	Silver 	2025-07-21	t	N	0
8	t	N	Platinum tier discount for Platinum tier customer	PERCENTAGE	0.06	2200-08-05	Platinum	2000-07-27	t	N	0
7	t	N	Gold Tier discount for gold tier customer	PERCENTAGE	0.04	2200-08-09	Gold Tier	2000-07-27	t	N	0
1	t	N	10% discount for first-time buyers	PERCENTAGE	0.1	2200-07-30	First Time Buyer	2000-07-30	t	N	N
10	f	USER12	testing	PERCENTAGE	0.07	2025-08-08	for user	2025-07-30	t	N	N
11	f	WELCOME10	Coupon for New user 	PERCENTAGE	0.1	2025-08-08	WELCOME NEW USER	2025-07-30	t	N	500000
9	f	NEW10	The new coupon for every users	FIXED	50000	2025-08-09	new coupon	2025-07-28	t	N	1000000
12	t	N	11.11 discount 	PERCENTAGE	0.11	2025-08-09	11.11	2025-07-23	t	N	111111
13	t	N	test	PERCENTAGE	0.1	2025-08-09	Brand Discount	2025-07-29	t	N	500000
.


--
-- SQLINES DEMO *** scount_event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_event (id, description, discount_percent, end_date, event_name, start_date, status) FROM stdin;
.


--
-- SQLINES DEMO *** scount_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_rule (id, end_date, start_date, target_type, brand_id, category_id, discount_id, product_id, user_id, vip_role) FROM stdin;
1	2025-08-06	2025-07-30	USER	N	N	1	N	1	N
2	2025-08-06	2025-07-30	USER	N	N	1	N	2	N
3	2025-08-06	2025-07-30	USER	N	N	1	N	3	N
4	2025-08-07	2025-07-31	USER	N	N	1	N	4	N
5	2025-08-07	2025-07-31	USER	N	N	1	N	5	N
7	N	N	PRODUCT	N	N	3	12	N	N
8	N	N	PRODUCT	N	N	3	8	N	N
9	N	N	PRODUCT	N	N	3	2	N	N
14	N	N	VIP_TIER	N	N	6	N	N	2
15	N	N	VIP_TIER	N	N	7	N	N	3
16	N	N	VIP_TIER	N	N	8	N	N	4
17	N	N	GLOBAL	N	N	9	N	N	N
18	N	N	USER	N	N	10	N	4	N
19	N	N	USER	N	N	11	N	4	N
20	N	N	USER_CATEGORY	N	5	12	N	5	N
21	N	N	BRAND	1	N	13	N	N	N
22	N	N	BRAND	10	N	13	N	N	N
.


--
-- SQLINES DEMO *** ent_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_product (id, event_id, product_id) FROM stdin;
1	1	1
2	1	3
3	1	1
4	1	3
5	1	1
6	1	3
7	1	1
8	1	3
9	1	1
10	1	3
11	1	1
12	1	3
13	1	1
14	1	3
15	1	1
16	1	3
17	1	1
18	1	3
19	1	1
20	1	1
21	1	3
22	1	3
23	1	1
24	1	1
25	1	3
26	1	3
27	1	1
28	1	1
29	1	3
30	1	3
31	1	1
32	1	3
33	1	1
34	1	3
35	1	1
36	1	3
37	1	1
38	1	3
39	1	1
40	1	3
41	1	1
42	1	3
43	1	1
44	1	3
45	1	1
46	1	3
47	1	1
48	1	3
49	1	1
50	1	3
51	1	1
52	1	3
53	1	1
54	1	3
55	1	1
56	1	1
57	1	3
58	1	3
59	1	1
60	1	1
61	1	3
62	1	3
63	1	1
64	1	1
65	1	3
66	1	3
67	1	1
68	1	3
69	1	1
70	1	3
71	1	1
72	1	3
73	1	11
74	1	10
75	2	12
76	3	11
77	3	11
78	3	11
79	3	11
.


--
-- SQLINES DEMO *** ents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, description, end_date, event_image, is_default, name, slide_no, start_date, status, discount_id) FROM stdin;
2	The Fendi Spy Bag, a notable Y2K luxury item, has been relaunched with a new campaign and is featured in Fendi's Fall/Winter 2025 collection. 	2025-08-09 09:55:00	/event/1753932361488_Screenshot 2025-07-31 094307.png	0	Fendi Spy	1	2025-07-31 09:55:00	1	N
3	The 7.7 sale, also known as the 7.7 Mid-Year Mega Sale, is a major online shopping event that typically occurs in early July, with deals and discounts on various e-commerce platforms.	2025-08-09 09:57:00	/event/1753932564468_7-7-shopping-day-sale-poster-or-flyer-design-7-7-super-sale-online-banner-vector.jpg	0	7.7 Sale	2	2025-07-31 09:57:00	0	N
1	This campaign reimagines the quintessential Parisian summer through a minimalist yet evocative lens, inviting audiences to discover beauty in simplicity and celebrate the artistry of everyday life.	2025-08-09 09:18:00	/event/1753930916641_Screenshot 2025-07-31 092454.png	0	Summer Ever After	3	2025-07-31 09:18:00	1	N
4	Up to 70% Off on fashion, gadgets, and home essentials. DonΓÇÖt miss the biggest deals of the season!	2025-08-09 10:08:00	/event/1753933354827_5565519.jpg	0	Mega Mid-Year Sale	2	2025-07-31 10:10:00	1	3
.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (id, attempt_count, country_code, ip_address, is_blocked, is_proxy, isvpn, location, session_id, status, threat_level, threat_score, timeframe, "timestamp", user_agent, username, user_id) FROM stdin;
1	0		116.206.139.77	f	f	f	Yangon, Yangon, MM	sess_kzzv93rdle	successful	low	0	1 min	2025-07-30 21:21:52.763098	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
2	0		69.160.8.66	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	1 min	2025-07-30 21:46:59.318678	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	ei4482847@gmail.com	N
3	1		69.160.8.66	f	f	f	Yangon, Yangon, MM	sess_900oxeyao1	successful	low	10	1 min	2025-07-30 21:57:43.076086	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	ei4482847@gmail.com	N
4	2		69.160.8.66	f	f	f	Yangon, Yangon, MM	sess_r4vw1v0cvd	successful	low	10	10 min	2025-07-30 21:57:47.602101	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	ei4482847@gmail.com	N
5	3		69.160.8.66	f	f	f	Yangon, Yangon, MM	sess_ay46b2n4ae	successful	low	0	10 min	2025-07-30 22:21:40.899592	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	ei4482847@gmail.com	N
6	0		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_mw95a50ql0	successful	low	0	1 min	2025-07-30 23:19:40.433221	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	ei4482847@gmail.com	N
7	1		103.67.50.90	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	1 min	2025-07-30 23:19:40.826501	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	ei4482847@gmail.com	N
8	2		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_9ah2jrzph4	successful	low	10	0 min	2025-07-30 23:21:27.992298	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	ei4482847@gmail.com	N
9	3		103.67.50.90	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	1 min	2025-07-30 23:21:28.278622	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	ei4482847@gmail.com	N
10	4		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_uyfvmnqmmw	successful	low	20	1 min	2025-07-30 23:23:28.366066	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
11	5		103.67.50.90	f	f	f	Yangon, Yangon, MM	N	failed	medium	45	3 min	2025-07-30 23:23:28.703523	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
12	6		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_xn6ozualoo	successful	medium	55	3 min	2025-07-30 23:33:30.101378	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
13	7		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_y2ecxtjp9e	successful	medium	55	13 min	2025-07-30 23:34:26.878752	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
14	8		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_270j7muiwj	successful	low	25	14 min	2025-07-30 23:37:51.810372	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
15	4		69.160.8.66	f	f	f	Yangon, Yangon, MM	sess_dp08xz1fpq	successful	low	0	34 min	2025-07-30 23:43:48.367227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	ei4482847@gmail.com	N
16	1		116.206.139.77	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	1 min	2025-07-31 00:01:23.102616	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	chomiemie17@gmail.com	N
17	2		116.206.139.77	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	159 min	2025-07-31 00:01:36.776924	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	chomiemie17@gmail.com	N
18	3		116.206.139.77	f	f	f	Yangon, Yangon, MM	N	failed	medium	30	159 min	2025-07-31 00:01:50.431053	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	chomiemie17@gmail.com	N
19	5		69.160.8.66	f	f	f	Yangon, Yangon, MM	sess_plcl424bau	successful	low	15	116 min	2025-07-31 00:09:09.144979	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
20	4		116.206.139.77	f	f	f	Yangon, Yangon, MM	sess_ulwkm8iqfk	successful	low	0	159 min	2025-07-31 00:30:46.845606	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
21	9		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_40oztjqiur	successful	low	15	18 min	2025-07-31 01:18:01.762511	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
22	10		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_hsinuxj6gh	successful	low	15	118 min	2025-07-31 01:36:44.173444	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
23	10		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_y4e3ny1x60	successful	low	15	137 min	2025-07-31 01:37:11.868855	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	ei4482847@gmail.com	N
24	10		103.67.50.90	f	f	f	Yangon, Yangon, MM	sess_5u4t31iclg	successful	low	15	135 min	2025-07-31 01:47:54.182983	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	htooaungyeyint65@gmail.com	N
26	0		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_rlcipiuapi	successful	low	0	1 min	2025-07-31 09:19:31.760755	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
27	1		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_154a6lk3vh	successful	low	0	1 min	2025-07-31 09:28:27.325705	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
28	2		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_2dhd9x7u2y	successful	low	0	8 min	2025-07-31 09:42:44.257741	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
25	0		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_wusd9o0eqp	successful	low	0	1 min	2025-07-31 09:02:18.448078	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
29	1		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_ppx54s4b42	successful	low	0	1 min	2025-07-31 10:15:22.57893	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	chomiemie17@gmail.com	N
30	2		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_ajytl6jzrn	successful	low	0	73 min	2025-07-31 11:14:54.649115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
31	3		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_kfbth3i1vy	successful	low	0	132 min	2025-07-31 11:22:09.766125	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
32	4		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_lul062dtta	successful	low	0	139 min	2025-07-31 11:29:40.672289	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
33	5		103.186.123.13	t	f	f	Yangon, Yangon, MM	sess_dpiedf6w7n	successful	low	15	147 min	2025-07-31 11:35:25.782986	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
34	3		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_hp3rqbvcxj	successful	low	0	23 min	2025-07-31 11:40:08.887763	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	chomiemie17@gmail.com	N
35	6		103.186.123.13	f	f	f	Yangon, Yangon, MM	sess_n0vgft26ho	successful	low	15	153 min	2025-07-31 11:44:14.91315	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	kyaw112412@gmail.com	N
36	7		103.186.123.13	f	f	f	Yangon, Yangon, MM	sess_7d22i6yk2h	successful	low	15	161 min	2025-07-31 11:44:46.84731	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	chomiemie17@gmail.com	N
37	4		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_gp63awnyat	successful	low	0	140 min	2025-07-31 11:46:32.270716	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
38	8		103.186.123.13	f	f	f	Yangon, Yangon, MM	sess_joa0r56utq	successful	low	15	162 min	2025-07-31 11:46:56.46076	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
39	9		103.186.123.13	f	f	f	Yangon, Yangon, MM	sess_k8irm2fgzd	successful	low	15	164 min	2025-07-31 11:47:19.719516	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
40	10		103.186.123.13	f	f	f	Yangon, Yangon, MM	sess_g5brcz2d52	successful	low	15	165 min	2025-07-31 11:47:28.876571	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	htooaungyeyint65@gmail.com	N
41	5		204.157.172.86	f	f	f	Yangon, Yangon, MM	sess_le0n823um2	successful	low	15	147 min	2025-07-31 11:51:18.318898	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	isjustmarc06@gmail.com	N
.


--
-- Data for Name: news_letter_subscriber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news_letter_subscriber (id, email) FROM stdin;
.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id, recipient_email, message, seen, "timestamp", type, link, category, priority, user_type, user_id) FROM stdin;
1	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-30 23:33:30.429612	login_attempt	N	login_attempt	high	N	N
2	htooaungyeyint65@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-30 23:33:33.241234	first time buyer discount	/userproductlist	N	N	N	N
3	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-30 23:34:27.098213	login_attempt	N	login_attempt	high	N	N
4	htooaungyeyint65@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-30 23:34:27.160748	login_attempt	N	login_attempt	high	N	N
5	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-30 23:37:52.151884	login_attempt	N	login_attempt	high	N	N
6	htooaungyeyint65@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-30 23:37:52.260684	login_attempt	N	login_attempt	high	N	N
7	ei4482847@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-30 23:39:29.894364	first time buyer discount	/userproductlist	N	N	N	N
8	htooaungyeyint65@gmail.com	Successful login for ei4482847@gmail.com from IP 69.160.8.66	f	2025-07-30 23:43:48.826174	login_attempt	N	login_attempt	high	N	N
9	ei4482847@gmail.com	Successful login for ei4482847@gmail.com from IP 69.160.8.66	f	2025-07-30 23:43:48.955568	login_attempt	N	login_attempt	high	N	N
10	htooaungyeyint65@gmail.com	Successful login for kyaw112412@gmail.com from IP 69.160.8.66	f	2025-07-31 00:09:10.282834	login_attempt	N	login_attempt	high	N	N
11	ei4482847@gmail.com	Successful login for kyaw112412@gmail.com from IP 69.160.8.66	f	2025-07-31 00:09:10.380489	login_attempt	N	login_attempt	high	N	N
12	kyaw112412@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-31 00:09:11.510602	first time buyer discount	/userproductlist	N	N	N	N
13	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:18:02.013123	login_attempt	N	login_attempt	high	N	N
14	isjustmarc06@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:18:02.094418	login_attempt	N	login_attempt	high	N	N
15	htooaungyeyint65@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:18:02.159188	login_attempt	N	login_attempt	high	N	N
16	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:36:44.392756	login_attempt	N	login_attempt	high	N	N
17	isjustmarc06@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:36:44.455231	login_attempt	N	login_attempt	high	N	N
18	htooaungyeyint65@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:36:44.517722	login_attempt	N	login_attempt	high	N	N
19	ei4482847@gmail.com	Successful login for ei4482847@gmail.com from IP 103.67.50.90	f	2025-07-31 01:37:12.098694	login_attempt	N	login_attempt	high	N	N
20	isjustmarc06@gmail.com	Successful login for ei4482847@gmail.com from IP 103.67.50.90	f	2025-07-31 01:37:12.187694	login_attempt	N	login_attempt	high	N	N
21	htooaungyeyint65@gmail.com	Successful login for ei4482847@gmail.com from IP 103.67.50.90	f	2025-07-31 01:37:12.279687	login_attempt	N	login_attempt	high	N	N
22	ei4482847@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:47:54.401733	login_attempt	N	login_attempt	high	N	N
23	htooaungyeyint65@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:47:54.464234	login_attempt	N	login_attempt	high	N	N
24	isjustmarc06@gmail.com	Successful login for htooaungyeyint65@gmail.com from IP 103.67.50.90	f	2025-07-31 01:47:54.526734	login_attempt	N	login_attempt	high	N	N
25	kyaw112412@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-31 08:44:33.9768	first time buyer discount	/userproductlist	N	N	N	N
26	ei4482847@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 09:02:19.340743	login_attempt	N	login_attempt	high	N	N
27	htooaungyeyint65@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 09:02:19.427252	login_attempt	N	login_attempt	high	N	N
28	isjustmarc06@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 09:02:19.5066	login_attempt	N	login_attempt	high	N	N
31	ei4482847@gmail.com	New order placed: #I90145 by isjustmarc06@gmail.com	f	2025-07-31 09:25:09.067712	created	/admin/orders/1	order	N	ADMIN	2
32	htooaungyeyint65@gmail.com	New order placed: #I90145 by isjustmarc06@gmail.com	f	2025-07-31 09:25:09.100607	created	/admin/orders/1	order	N	ADMIN	3
33	isjustmarc06@gmail.com	New order placed: #I90145 by isjustmarc06@gmail.com	f	2025-07-31 09:25:09.13552	created	/admin/orders/1	order	N	ADMIN	1
35	ei4482847@gmail.com	New order placed: #L69490 by isjustmarc06@gmail.com	f	2025-07-31 09:26:32.754793	created	/admin/orders/2	order	N	ADMIN	2
36	htooaungyeyint65@gmail.com	New order placed: #L69490 by isjustmarc06@gmail.com	f	2025-07-31 09:26:32.78971	created	/admin/orders/2	order	N	ADMIN	3
37	isjustmarc06@gmail.com	New order placed: #L69490 by isjustmarc06@gmail.com	f	2025-07-31 09:26:32.822615	created	/admin/orders/2	order	N	ADMIN	1
38	chomiemie17@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-31 09:36:45.456103	first time buyer discount	/userproductlist	discount	N	CUSTOMER	4
39	ei4482847@gmail.com	≡ƒöÑ "Mega Mid-Year Sale" is live: 10.0% off! Click here to view products.	f	2025-07-31 10:03:57.66585	discount	/userproductlist?discountId=3	N	N	N	N
40	htooaungyeyint65@gmail.com	≡ƒöÑ "Mega Mid-Year Sale" is live: 10.0% off! Click here to view products.	f	2025-07-31 10:03:57.743814	discount	/userproductlist?discountId=3	N	N	N	N
41	kyaw112412@gmail.com	≡ƒöÑ "Mega Mid-Year Sale" is live: 10.0% off! Click here to view products.	f	2025-07-31 10:03:57.81433	discount	/userproductlist?discountId=3	N	N	N	N
42	isjustmarc06@gmail.com	≡ƒöÑ "Mega Mid-Year Sale" is live: 10.0% off! Click here to view products.	f	2025-07-31 10:03:57.894949	discount	/userproductlist?discountId=3	N	N	N	N
30	isjustmarc06@gmail.com	Your order #I90145 has been placed.	t	2025-07-31 09:25:08.989906	pending	order	/profile/1?section=orders&orderId=1	N	CUSTOMER	1
34	isjustmarc06@gmail.com	Your order #L69490 has been placed.	t	2025-07-31 09:26:32.676998	pending	order	/profile/1?section=orders&orderId=2	N	CUSTOMER	1
43	chomiemie17@gmail.com	≡ƒöÑ "Mega Mid-Year Sale" is live: 10.0% off! Click here to view products.	f	2025-07-31 10:03:57.976958	discount	/userproductlist?discountId=3	N	N	N	N
44	ei4482847@gmail.com	Successful login for chomiemie17@gmail.com from IP 103.186.123.13	f	2025-07-31 10:15:22.869771	login_attempt	N	login_attempt	high	N	N
45	htooaungyeyint65@gmail.com	Successful login for chomiemie17@gmail.com from IP 103.186.123.13	f	2025-07-31 10:15:22.988884	login_attempt	N	login_attempt	high	N	N
46	isjustmarc06@gmail.com	Successful login for chomiemie17@gmail.com from IP 103.186.123.13	f	2025-07-31 10:15:23.098594	login_attempt	N	login_attempt	high	N	N
47	ei4482847@gmail.com	≡ƒöÑ "Silver " is live: 2.0% off! Click here to view products.	f	2025-07-31 10:21:53.49919	create	/userproductlist?discountId=6	discount	N	CUSTOMER	2
48	htooaungyeyint65@gmail.com	≡ƒöÑ "Silver " is live: 2.0% off! Click here to view products.	f	2025-07-31 10:21:53.796075	create	/userproductlist?discountId=6	discount	N	CUSTOMER	3
49	kyaw112412@gmail.com	≡ƒöÑ "Silver " is live: 2.0% off! Click here to view products.	f	2025-07-31 10:21:53.897514	create	/userproductlist?discountId=6	discount	N	CUSTOMER	5
51	chomiemie17@gmail.com	≡ƒöÑ "Silver " is live: 2.0% off! Click here to view products.	f	2025-07-31 10:21:54.131817	create	/userproductlist?discountId=6	discount	N	CUSTOMER	4
52	ei4482847@gmail.com	≡ƒöÑ "Gold Tier" is live: 4.0% off! Click here to view products.	f	2025-07-31 10:22:51.579563	create	/userproductlist?discountId=7	discount	N	CUSTOMER	2
53	htooaungyeyint65@gmail.com	≡ƒöÑ "Gold Tier" is live: 4.0% off! Click here to view products.	f	2025-07-31 10:22:51.675999	create	/userproductlist?discountId=7	discount	N	CUSTOMER	3
54	kyaw112412@gmail.com	≡ƒöÑ "Gold Tier" is live: 4.0% off! Click here to view products.	f	2025-07-31 10:22:51.770647	create	/userproductlist?discountId=7	discount	N	CUSTOMER	5
56	chomiemie17@gmail.com	≡ƒöÑ "Gold Tier" is live: 4.0% off! Click here to view products.	f	2025-07-31 10:22:51.963556	create	/userproductlist?discountId=7	discount	N	CUSTOMER	4
57	ei4482847@gmail.com	≡ƒöÑ "Platinum" is live: 6.0% off! Click here to view products.	f	2025-07-31 10:23:57.839821	create	/userproductlist?discountId=8	discount	N	CUSTOMER	2
58	htooaungyeyint65@gmail.com	≡ƒöÑ "Platinum" is live: 6.0% off! Click here to view products.	f	2025-07-31 10:23:57.971629	create	/userproductlist?discountId=8	discount	N	CUSTOMER	3
59	kyaw112412@gmail.com	≡ƒöÑ "Platinum" is live: 6.0% off! Click here to view products.	f	2025-07-31 10:23:58.102387	create	/userproductlist?discountId=8	discount	N	CUSTOMER	5
61	chomiemie17@gmail.com	≡ƒöÑ "Platinum" is live: 6.0% off! Click here to view products.	f	2025-07-31 10:23:58.377896	create	/userproductlist?discountId=8	discount	N	CUSTOMER	4
62	chomiemie17@gmail.com	Your profile was updated successfully!	f	2025-07-31 10:25:32.230903	N	N	N	N	N	N
63	chomiemie17@gmail.com	Your profile was updated successfully!	f	2025-07-31 10:27:07.557534	N	N	N	N	N	N
64	isjustmarc06@gmail.com	Your order #I90145 has been placed.	f	2025-07-31 10:32:50.272645	order	/profile/1?section=orders&orderId=1	N	N	N	N
65	isjustmarc06@gmail.com	Your order #L69490 has been placed.	f	2025-07-31 10:33:19.595133	order	/profile/1?section=orders&orderId=2	N	N	N	N
66	chomiemie17@gmail.com	Your order #M96813 has been placed.	f	2025-07-31 10:37:17.97254	order	/profile/4?section=orders&orderId=3	N	N	N	N
67	chomiemie17@gmail.com	Your order was successful	f	2025-07-31 10:37:18.012398	N	N	N	N	N	N
29	isjustmarc06@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	t	2025-07-31 09:19:34.484509	first time buyer discount	/userproductlist	discount	N	CUSTOMER	1
68	chomiemie17@gmail.com	Your order #N59822 has been placed.	f	2025-07-31 11:00:16.516889	order	/profile/4?section=orders&orderId=4	N	N	N	N
69	chomiemie17@gmail.com	Your order was successful	f	2025-07-31 11:00:16.566782	N	N	N	N	N	N
70	ei4482847@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 11:14:55.638087	login_attempt	N	login_attempt	high	N	N
71	htooaungyeyint65@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 11:14:55.757539	login_attempt	N	login_attempt	high	N	N
72	kyaw112412@gmail.com	Your profile was updated successfully!	f	2025-07-31 11:21:05.113803	N	N	N	N	N	N
73	kyaw112412@gmail.com	Your order #P98785 has been placed.	f	2025-07-31 11:22:10.431202	order	/profile/5?section=orders&orderId=5	N	N	N	N
74	kyaw112412@gmail.com	Your order was successful	f	2025-07-31 11:22:10.480243	N	N	N	N	N	N
75	kyaw112412@gmail.com	Your order #S16085 has been placed.	f	2025-07-31 11:37:53.604738	order	/profile/5?section=orders&orderId=6	N	N	N	N
76	kyaw112412@gmail.com	Your order was successful	f	2025-07-31 11:37:53.652137	N	N	N	N	N	N
77	ei4482847@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 11:44:15.783526	login_attempt	N	login_attempt	high	N	N
78	htooaungyeyint65@gmail.com	Successful login for kyaw112412@gmail.com from IP 103.186.123.13	f	2025-07-31 11:44:15.882997	login_attempt	N	login_attempt	high	N	N
79	ei4482847@gmail.com	Successful login for chomiemie17@gmail.com from IP 103.186.123.13	f	2025-07-31 11:44:47.772403	login_attempt	N	login_attempt	high	N	N
80	htooaungyeyint65@gmail.com	Successful login for chomiemie17@gmail.com from IP 103.186.123.13	f	2025-07-31 11:44:47.891661	login_attempt	N	login_attempt	high	N	N
81	htooaungyeyint65@gmail.com	≡ƒÄë Welcome! First Time Buyer Discount is available for you. Click to view details.	f	2025-07-31 11:47:22.507714	first time buyer discount	/userproductlist	discount	N	CUSTOMER	3
82	chomiemie17@gmail.com	Your order #U64281 has been placed.	f	2025-07-31 13:08:14.735107	pending	order	/profile/4?section=orders&orderId=7	N	CUSTOMER	4
83	ei4482847@gmail.com	New order placed: #U64281 by chomiemie17@gmail.com	f	2025-07-31 13:08:15.285804	created	/admin/orders/7	order	N	ADMIN	2
84	htooaungyeyint65@gmail.com	New order placed: #U64281 by chomiemie17@gmail.com	f	2025-07-31 13:08:15.321804	created	/admin/orders/7	order	N	ADMIN	3
85	isjustmarc06@gmail.com	New order placed: #U64281 by chomiemie17@gmail.com	f	2025-07-31 13:08:15.353527	created	/admin/orders/7	order	N	ADMIN	1
86	ei4482847@gmail.com	≡ƒöÑ "11.11" is live: 11.0% off! Click here to view products.	f	2025-07-31 15:25:38.101465	create	/userproductlist?discountId=12	discount	N	CUSTOMER	2
87	kyaw112412@gmail.com	≡ƒöÑ "11.11" is live: 11.0% off! Click here to view products.	f	2025-07-31 15:25:38.209196	create	/userproductlist?discountId=12	discount	N	CUSTOMER	5
88	htooaungyeyint65@gmail.com	≡ƒöÑ "11.11" is live: 11.0% off! Click here to view products.	f	2025-07-31 15:25:38.313128	create	/userproductlist?discountId=12	discount	N	CUSTOMER	3
89	isjustmarc06@gmail.com	≡ƒöÑ "11.11" is live: 11.0% off! Click here to view products.	f	2025-07-31 15:25:38.424466	create	/userproductlist?discountId=12	discount	N	CUSTOMER	1
90	chomiemie17@gmail.com	≡ƒöÑ "11.11" is live: 11.0% off! Click here to view products.	f	2025-07-31 15:25:38.524273	create	/userproductlist?discountId=12	discount	N	CUSTOMER	4
91	ei4482847@gmail.com	≡ƒöÑ "Brand Discount" is live: 10.0% off! Click here to view products.	f	2025-07-31 15:28:43.446765	create	/userproductlist?discountId=13	discount	N	CUSTOMER	2
92	kyaw112412@gmail.com	≡ƒöÑ "Brand Discount" is live: 10.0% off! Click here to view products.	f	2025-07-31 15:28:43.542001	create	/userproductlist?discountId=13	discount	N	CUSTOMER	5
93	htooaungyeyint65@gmail.com	≡ƒöÑ "Brand Discount" is live: 10.0% off! Click here to view products.	f	2025-07-31 15:28:43.635759	create	/userproductlist?discountId=13	discount	N	CUSTOMER	3
94	isjustmarc06@gmail.com	≡ƒöÑ "Brand Discount" is live: 10.0% off! Click here to view products.	f	2025-07-31 15:28:43.729921	create	/userproductlist?discountId=13	discount	N	CUSTOMER	1
95	chomiemie17@gmail.com	≡ƒöÑ "Brand Discount" is live: 10.0% off! Click here to view products.	f	2025-07-31 15:28:43.82367	create	/userproductlist?discountId=13	discount	N	CUSTOMER	4
96	ei4482847@gmail.com	Test admin notification	f	2025-07-31 20:44:55.536329	admin_only	/admin/dashboard	admin_only	medium	N	N
97	htooaungyeyint65@gmail.com	Test admin notification	f	2025-07-31 20:44:55.653782	admin_only	/admin/dashboard	admin_only	medium	N	N
98	isjustmarc06@gmail.com	Test admin notification	f	2025-07-31 20:44:55.756142	admin_only	/admin/dashboard	admin_only	medium	N	N
.


--
-- Data for Name: order_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status (id, status_date, refund_id, status_id, order_id) FROM stdin;
1	2025-07-31 09:25:08.573756	N	1	1
2	2025-07-31 09:26:32.339489	N	1	2
3	2025-07-31 10:32:49.530362	N	2	1
4	2025-07-31 10:33:18.874717	N	2	2
5	2025-07-31 10:37:17.473191	N	1	3
6	2025-07-31 11:00:15.982069	N	1	4
7	2025-07-31 11:16:12.504224	N	2	4
8	2025-07-31 11:16:21.799063	N	3	4
9	2025-07-31 11:16:30.626983	N	4	4
10	2025-07-31 11:16:41.865296	N	5	4
11	2025-07-31 11:17:26.489949	N	2	3
12	2025-07-31 11:22:10.081059	N	1	5
13	2025-07-31 11:35:07.462353	N	3	3
14	2025-07-31 11:35:34.57901	N	4	3
15	2025-07-31 11:37:53.2528	N	1	6
16	2025-07-31 13:08:14.324821	N	1	7
.


--
-- Data for Name: otp_verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_verification (id, email, expiry_time, otp_code, type, verified) FROM stdin;
4	isjustmarc06@gmail.com	2025-07-30 21:30:26.426531	096986	N	f
5	ei4482847@gmail.com	2025-07-30 22:06:32.651444	222374	N	f
6	htooaungyeyint65@gmail.com	2025-07-30 23:32:24.437543	292834	N	f
8	kyaw112412@gmail.com	2025-07-31 00:18:09.279254	277356	N	f
.


--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission (id, description, key, level, name, permission_category_id) FROM stdin;
1	Auto-registered	users.view	basic	Users View	1
2	Auto-registered	users.update	intermediate	Users Update	1
3	Auto-registered	users.assign_role	intermediate	Users Assign Role	1
4	Auto-registered	users.create	intermediate	Users Create	1
5	Auto-registered	users.view_by_role	basic	Users View By Role	1
6	Process refund for return request	refund.update	basic	Refund Update	2
7	View all return requests	refund.view	basic	Refund View	2
8	Auto-registered	discounts.view	basic	Discounts View	3
9	Auto-registered	discounts.update	advanced	Discounts Update	3
10	Auto-registered	discounts.delete	critical	Discounts Delete	3
11	Auto-registered	discounts.create	advanced	Discounts Create	3
12	Auto-registered	orders.view	basic	Orders View	2
13	Update order status	orders.update	basic	Orders Update	2
14	Auto-registered	orders.create	basic	Orders Create	2
15	View all VIP tiers	vip_tiers.view	basic	Vip Tiers View	4
16	Update a VIP tier	vip_tiers.update	basic	Vip Tiers Update	4
17	Create a new VIP tier	vip_tiers.create	basic	Vip Tiers Create	4
18	Delete a VIP tier	vip_tiers.delete	basic	Vip Tiers Delete	4
19	Create a new role	roles.create	advanced	Roles Create	5
20	Update an existing role	roles.update	advanced	Roles Update	5
21	Delete a role	roles.delete	critical	Roles Delete	5
22	Auto-registered	blacklist.create	advanced	Blacklist Create	6
23	Auto-registered	blacklist.view	basic	Blacklist View	6
24	Auto-registered	blacklist.delete	advanced	Blacklist Delete	6
25	Auto-registered	blacklist.update	advanced	Blacklist Update	6
26	View VIP customers	customers.view_vip	intermediate	Customers View Vip	1
27	View all customers	customers.view	basic	Customers View	1
28	Delete user	users.delete	advanced	Users Delete	1
29	Auto-registered	security.update_attempts	advanced	Security Update Attempts	7
30	Auto-registered	security.view_attempts	basic	Security View Attempts	7
31	Assign permissions to roles	roles.assign_permissions	advanced	Roles Assign Permissions	5
32	Auto-registered	categories.create	advanced	Categories Create	8
33	Auto-registered	categories.delete	advanced	Categories Delete	8
34	Auto-registered	categories.update	advanced	Categories Update	8
35	Auto-registered	categories.view	basic	Categories View	8
36	Auto-registered	products.create	advanced	Products Create	9
37	Auto-registered	products.delete	advanced	Products Delete	9
38	Auto-registered	products.update	advanced	Products Update	9
39	Auto-registered	products.view	basic	Products View	9
40	Auto-registered	delivery.update	advanced	Delivery Update	10
41	Auto-registered	delivery.create	advanced	Delivery Create	10
42	Auto-registered	delivery.view	basic	Delivery View	10
43	Auto-registered	delivery.delete	critical	Delivery Delete	10
44	Create new permission	permissions.create	critical	Permissions Create	11
45	Delete permission	permissions.delete	critical	Permissions Delete	11
46	View all permissions	permissions.view	basic	Permissions View	11
47	Auto-registered	activity_logs.view	basic	Activity Logs View	12
48	Auto-registered	activity_logs.update	advanced	Activity Logs Update	12
49	Auto-registered	activity_logs.delete	critical	Activity Logs Delete	12
50	Auto-registered	activity_logs.create	advanced	Activity Logs Create	12
51	Auto-registered	activity_logs.export	advanced	Activity Logs Export	12
52	Auto-registered	brands.view	basic	Brands View	13
53	Auto-registered	brands.create	advanced	Brands Create	13
54	Auto-registered	brands.delete	advanced	Brands Delete	13
55	Auto-registered	brands.update	advanced	Brands Update	13
56	Auto-registered	admin_users.update	advanced	Admin Users Update	14
57	Auto-registered	admin_users.view	basic	Admin Users View	14
58	Auto-registered	admin_users.create	advanced	Admin Users Create	14
59	Auto-registered	admin_users.delete	critical	Admin Users Delete	14
.


--
-- Data for Name: permission_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission_category (id, icon, key, name) FROM stdin;
1	fas fa-users	users	User Management
2	fa-shopping-cart	orders	Order Management
3	fa-percent	discounts	Discount Management
4	fa-user-tag	vip_tiers	VIP Tiers
5	fa-user-tag	roles	Role Management
6	fas fa-ban	blacklist	Blacklist Management
7	fa-shield-alt	security	Security & Login Attempts
8	fa-list	categories	Category Management
9	fa-box	products	Product Management
10	fa-truck	delivery	Delivery Service Management
11	fa-key	permissions	Permission Management
12	fa-list	activity_logs	Activity Logs
13	fa-tag	brands	Brand Management
14	fa-user-shield	admin_users	Admin User Management
.


--
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policies (id, content, last_updated, status, title) FROM stdin;
1	<h2><strong><em>HIJKLMNOPQRSTUVWXYZ</em></strong></h2>	2025-07-29 09:54:37.963403	2	ABCDEFG
2	<p><span style="color: rgb(55, 65, 81);">Return&nbsp;Policy</span></p><p><span style="color: rgb(55, 65, 81);">Customers&nbsp;are&nbsp;eligible&nbsp;to&nbsp;request&nbsp;returns&nbsp;under&nbsp;the&nbsp;following&nbsp;conditions.&nbsp;All&nbsp;return&nbsp;requests&nbsp;must&nbsp;be&nbsp;reviewed&nbsp;and&nbsp;approved&nbsp;by&nbsp;the&nbsp;admin&nbsp;before&nbsp;any&nbsp;refund&nbsp;or&nbsp;replacement&nbsp;is&nbsp;processed.</span></p><p><span style="color: rgb(55, 65, 81);">1.&nbsp;Wrong&nbsp;Item&nbsp;Delivered</span></p><p><span style="color: rgb(55, 65, 81);">If&nbsp;the&nbsp;item&nbsp;received&nbsp;is&nbsp;different&nbsp;from&nbsp;what&nbsp;was&nbsp;ordered,&nbsp;a&nbsp;return&nbsp;request&nbsp;must&nbsp;be&nbsp;submitted&nbsp;within&nbsp;7&nbsp;days&nbsp;of&nbsp;delivery.</span></p><p><span style="color: rgb(55, 65, 81);">Upon&nbsp;verification,&nbsp;a&nbsp;full&nbsp;refund&nbsp;will&nbsp;be&nbsp;issued.</span></p><p><span style="color: rgb(55, 65, 81);">2.&nbsp;Damaged&nbsp;on&nbsp;Arrival</span></p><p><span style="color: rgb(55, 65, 81);">If&nbsp;the&nbsp;item&nbsp;is&nbsp;received&nbsp;in&nbsp;a&nbsp;damaged&nbsp;or&nbsp;defective&nbsp;condition,&nbsp;photo&nbsp;evidence&nbsp;must&nbsp;be&nbsp;provided.</span></p><p><span style="color: rgb(55, 65, 81);">After&nbsp;verification&nbsp;by&nbsp;the&nbsp;admin,&nbsp;customers&nbsp;will&nbsp;be&nbsp;offered&nbsp;either&nbsp;a&nbsp;refund&nbsp;or&nbsp;a&nbsp;replacement.</span></p><p><span style="color: rgb(55, 65, 81);">3.&nbsp;Changed&nbsp;Mind</span></p><p><span style="color: rgb(55, 65, 81);">Returns&nbsp;due&nbsp;to&nbsp;a&nbsp;change&nbsp;of&nbsp;mind&nbsp;are&nbsp;accepted&nbsp;only&nbsp;if&nbsp;the&nbsp;product&nbsp;is&nbsp;unused&nbsp;and&nbsp;sealed.</span></p><p><span style="color: rgb(55, 65, 81);">The&nbsp;customer&nbsp;is&nbsp;responsible&nbsp;for&nbsp;the&nbsp;return&nbsp;shipping&nbsp;costs.</span></p><p><span style="color: rgb(55, 65, 81);">A&nbsp;refund&nbsp;will&nbsp;be&nbsp;processed&nbsp;after&nbsp;the&nbsp;returned&nbsp;product&nbsp;is&nbsp;inspected&nbsp;and&nbsp;approved.</span></p>	2025-07-31 15:36:27.349586	1	Return Policy
3	<p>Welcome&nbsp;to&nbsp;our&nbsp;online&nbsp;store!&nbsp;Please&nbsp;read&nbsp;these&nbsp;Terms&nbsp;and&nbsp;Conditions&nbsp;carefully&nbsp;before&nbsp;using&nbsp;our&nbsp;website.</p><p></p><p>1.&nbsp;General</p><p>By&nbsp;using&nbsp;this&nbsp;website,&nbsp;you&nbsp;agree&nbsp;to&nbsp;follow&nbsp;these&nbsp;Terms&nbsp;and&nbsp;Conditions.&nbsp;If&nbsp;you&nbsp;do&nbsp;not&nbsp;agree,&nbsp;please&nbsp;do&nbsp;not&nbsp;use&nbsp;our&nbsp;site.</p><p></p><p>2.&nbsp;Products</p><p>We&nbsp;do&nbsp;our&nbsp;best&nbsp;to&nbsp;display&nbsp;product&nbsp;details&nbsp;and&nbsp;prices&nbsp;accurately.&nbsp;However,&nbsp;we&nbsp;cannot&nbsp;guarantee&nbsp;that&nbsp;all&nbsp;product&nbsp;information&nbsp;is&nbsp;error-free.</p><p></p><p>3.&nbsp;Orders</p><p>All&nbsp;orders&nbsp;are&nbsp;subject&nbsp;to&nbsp;availability&nbsp;and&nbsp;confirmation.&nbsp;Once&nbsp;your&nbsp;order&nbsp;is&nbsp;placed,&nbsp;we&nbsp;will&nbsp;send&nbsp;you&nbsp;a&nbsp;confirmation&nbsp;email.&nbsp;We&nbsp;reserve&nbsp;the&nbsp;right&nbsp;to&nbsp;cancel&nbsp;or&nbsp;refuse&nbsp;any&nbsp;order&nbsp;at&nbsp;our&nbsp;discretion.</p><p></p><p>4.&nbsp;Payments</p><p>We&nbsp;accept&nbsp;various&nbsp;payment&nbsp;methods&nbsp;shown&nbsp;at&nbsp;checkout.&nbsp;Payment&nbsp;must&nbsp;be&nbsp;completed&nbsp;before&nbsp;your&nbsp;order&nbsp;is&nbsp;shipped.</p><p></p><p>5.&nbsp;Shipping</p><p>We&nbsp;aim&nbsp;to&nbsp;deliver&nbsp;products&nbsp;within&nbsp;the&nbsp;estimated&nbsp;time.&nbsp;However,&nbsp;delays&nbsp;may&nbsp;occur&nbsp;due&nbsp;to&nbsp;external&nbsp;factors.&nbsp;We&nbsp;are&nbsp;not&nbsp;responsible&nbsp;for&nbsp;delivery&nbsp;delays.</p><p></p><p>6.&nbsp;Returns&nbsp;and&nbsp;Refunds</p><p>If&nbsp;you&#39;re&nbsp;not&nbsp;satisfied&nbsp;with&nbsp;your&nbsp;purchase,&nbsp;you&nbsp;may&nbsp;return&nbsp;it&nbsp;within&nbsp;7&nbsp;days&nbsp;of&nbsp;receiving&nbsp;it.&nbsp;Products&nbsp;must&nbsp;be&nbsp;unused&nbsp;and&nbsp;in&nbsp;original&nbsp;condition.&nbsp;Refunds&nbsp;will&nbsp;be&nbsp;processed&nbsp;after&nbsp;we&nbsp;receive&nbsp;and&nbsp;inspect&nbsp;the&nbsp;returned&nbsp;item.</p><p></p><p>7.&nbsp;Account&nbsp;and&nbsp;Privacy</p><p>Please&nbsp;keep&nbsp;your&nbsp;account&nbsp;details&nbsp;safe.&nbsp;We&nbsp;do&nbsp;not&nbsp;share&nbsp;your&nbsp;personal&nbsp;information&nbsp;with&nbsp;others&nbsp;except&nbsp;as&nbsp;needed&nbsp;to&nbsp;complete&nbsp;your&nbsp;order.&nbsp;For&nbsp;more,&nbsp;see&nbsp;our&nbsp;Privacy&nbsp;Policy.</p><p></p><p>8.&nbsp;Changes</p><p>We&nbsp;may&nbsp;update&nbsp;these&nbsp;Terms&nbsp;at&nbsp;any&nbsp;time.&nbsp;Changes&nbsp;will&nbsp;be&nbsp;posted&nbsp;on&nbsp;this&nbsp;page.&nbsp;Please&nbsp;check&nbsp;regularly&nbsp;for&nbsp;updates.</p><p></p><p>9.&nbsp;Contact&nbsp;Us</p><p>If&nbsp;you&nbsp;have&nbsp;any&nbsp;questions,&nbsp;feel&nbsp;free&nbsp;to&nbsp;contact&nbsp;our&nbsp;support&nbsp;team.</p>	2025-07-31 15:37:09.425657	1	Terms and Conditions
.


--
-- Data for Name: product_discount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_discount (id, discount_id, product_id) FROM stdin;
.


--
-- Data for Name: product_has_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_has_category (id, brand_id, category_id, product_id) FROM stdin;
1	N	5	1
2	2	7	1
3	N	5	2
4	2	7	2
5	N	5	3
6	2	7	3
9	N	5	5
10	6	1	5
11	N	5	6
12	6	1	6
25	N	5	4
26	6	1	4
27	N	5	7
28	2	4	7
29	N	5	8
30	2	4	8
31	N	5	9
32	2	2	9
33	N	5	10
34	2	8	10
35	N	5	11
36	2	8	11
37	10	2	12
38	N	5	12
.


--
-- Data for Name: product_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_image (id, image_url, status, product_id, variant_id) FROM stdin;
1	/product_image/314c4e55-f05e-4217-97c8-51d31cb76c1f_everyday-croissant-small-backpack-470228_540x.webp	1	1	1
2	/product_image/ec874212-448f-498f-842b-a4682abc0fb2_everyday-croissant-small-backpack-602570_540x.webp	1	1	1
3	/product_image/94f4a585-06f1-49d3-ba45-c26d57c98d84_everyday-croissant-small-backpack-616474_460x.webp	1	1	1
4	/product_image/ef071351-f9e6-4e7d-a69c-852282256685_everyday-croissant-small-backpack-781551_460x.webp	1	1	1
5	/product_image/906b1fec-8317-4389-81de-47feeec1ae26_everyday-croissant-small-backpack-168910_460x.webp	1	1	2
6	/product_image/19732047-4113-4fe5-8ba6-87248983da2a_everyday-croissant-small-backpack-450043_460x.webp	1	1	2
7	/product_image/07340fc1-074b-4ad7-83a6-4eda35508b61_everyday-croissant-small-backpack-900811_460x.webp	1	1	2
8	/product_image/7c2263f7-1a88-4009-8955-b40514d7927f_everyday-croissant-small-backpack-969553_460x.webp	1	1	2
9	/product_image/476acc95-48c2-413a-a964-2b35a01d6439_everyday-croissant-small-backpack-168910_460x.webp	1	1	N
10	/product_image/cda26919-a0d2-407b-bac0-4877307810ba_everyday-croissant-small-backpack-470228_540x.webp	1	1	N
11	/product_image/5f76f802-2603-4af2-8e00-7e3c0b0a6b60_monogram-small-backpack-397531_460x.webp	1	2	3
12	/product_image/5a560af6-c841-4ee2-9df1-4d467c290c6f_monogram-small-backpack-417096_460x.webp	1	2	3
13	/product_image/67644115-f38b-4c8a-a843-e01aa2ec0491_monogram-small-backpack-589955_540x.webp	1	2	3
14	/product_image/acbd5c42-1a1c-44b1-aad8-2bf16c75300b_monogram-small-backpack-978981_460x.webp	1	2	3
15	/product_image/0cb4a5c7-1829-41dd-a75e-d8e3054f5546_monogram-small-backpack-978981_460x.webp	1	2	N
16	/product_image/de368aa2-348b-4750-b936-c5f65ffd5f28_pure-monogram-backpack-273863_460x.webp	1	3	4
17	/product_image/2170ab8c-a077-4a26-854b-e94f07b56ae2_pure-monogram-backpack-396415_460x.webp	1	3	4
18	/product_image/626d0534-5ffa-4231-8986-876411f72bae_pure-monogram-backpack-504311_540x.webp	1	3	4
19	/product_image/9bd88040-325c-4d57-96be-ae78fe70793d_pure-monogram-backpack-593195_460x.webp	1	3	4
20	/product_image/09df2708-c2de-41c0-b1c1-30bee8652b5e_pure-monogram-backpack-396415_460x.webp	1	3	N
21	/product_image/3b47f027-78db-4d26-97ea-a50b7b98535f_Screenshot 2025-07-31 010212.png	1	4	N
22	/product_image/5a07f626-d965-432b-9da1-841c623e73d4_Screenshot 2025-07-31 010201.png	1	4	N
23	/product_image/e83b75a6-cc12-41e0-b43b-77511f4a1dcd_Screenshot 2025-07-31 010151.png	1	4	N
24	/product_image/6f7d195c-8da9-4e8a-ac62-b150e951bbfa_Screenshot 2025-07-31 010142.png	1	4	N
25	/product_image/cf656b5c-7454-426e-a615-19940f376256_Screenshot 2025-07-31 010133.png	1	4	N
26	/product_image/c963f070-b633-43ca-a32b-ec5e3c754df8_Screenshot 2025-07-31 010212.png	1	5	N
27	/product_image/df7b5623-a488-4343-9584-1e7d353d6d8d_Screenshot 2025-07-31 010122.png	1	4	N
28	/product_image/30314882-9bc3-4fbf-8864-fdd0437d4dc5_Screenshot 2025-07-31 010201.png	1	5	N
29	/product_image/d294dd3d-e5a2-4552-82ab-2be72b603364_Screenshot 2025-07-31 010112.png	1	4	N
30	/product_image/6f2e0284-df43-417d-8d13-c4712ec394c9_Screenshot 2025-07-31 010151.png	1	5	N
31	/product_image/20469463-29e5-4d20-8503-a062ad0e0750_Screenshot 2025-07-31 010102.png	1	4	N
32	/product_image/eac71f81-2c0c-47e9-a0c7-0727f7386deb_Screenshot 2025-07-31 010212.png	1	6	N
33	/product_image/8eb27e61-e447-4bc4-8845-8c3df58118bf_Screenshot 2025-07-31 010142.png	1	5	N
34	/product_image/a6ef49e5-4485-4c0d-9f64-59d07e54e5fd_Screenshot 2025-07-31 010201.png	1	6	N
35	/product_image/294b7f7e-4cc4-45a4-9bd8-e3c5d747ce3b_Screenshot 2025-07-31 010133.png	1	5	N
36	/product_image/2548bc2f-8128-461f-b261-9d7682f36735_Screenshot 2025-07-31 010151.png	1	6	N
37	/product_image/d911c4f6-ffe2-4673-8199-4f5fe091a533_Screenshot 2025-07-31 010122.png	1	5	N
38	/product_image/5cfee279-0590-4631-8756-d3021123919c_Screenshot 2025-07-31 010142.png	1	6	N
39	/product_image/48c69ef0-a547-4a37-bd7a-cd1d4e9aa31c_Screenshot 2025-07-31 010112.png	1	5	N
40	/product_image/760a9266-74d1-4586-ad32-fdfeec164d4e_Screenshot 2025-07-31 010133.png	1	6	N
41	/product_image/f14060a3-6314-42d7-9452-78077e50b822_Screenshot 2025-07-31 010102.png	1	5	N
42	/product_image/6a3c7863-8564-45d4-8453-8fb81bf170d0_Screenshot 2025-07-31 010122.png	1	6	N
43	/product_image/3025064e-4182-48d5-89a8-f65a71265cbe_Screenshot 2025-07-31 010112.png	1	6	N
44	/product_image/e9e320f5-5636-4825-97e8-b0bf6cbb7fa8_Screenshot 2025-07-31 010102.png	1	6	N
98	/product_image/b2f008c5-6270-4336-8d1c-7e9f2a07e8fd_Screenshot 2025-07-31 010237.png	1	4	5
99	/product_image/eae0190f-e639-41ae-9d0b-a0b68a098a1c_Screenshot 2025-07-31 010228.png	1	4	5
100	/product_image/ee8b666c-0c89-413a-af46-2dc37a226e37_Screenshot 2025-07-31 010220.png	1	4	5
101	/product_image/becba739-c79e-46bc-8d42-dc70fd429aa9_Screenshot 2025-07-31 010212.png	1	4	5
102	/product_image/15186918-b0d4-4dc6-8353-39296f2077b0_Screenshot 2025-07-31 010357.png	1	4	6
103	/product_image/51ff9e86-c287-4559-8e78-9e762cc79675_Screenshot 2025-07-31 010142.png	1	4	6
104	/product_image/a987b5e3-7737-4852-aef1-4404c1e6cd5a_Screenshot 2025-07-31 010102.png	1	4	8
105	/product_image/ebbcfb7c-317c-42bd-9a26-f826297d1f3f_Screenshot 2025-07-31 010342.png	1	4	14
106	/product_image/63aa348f-b81a-4983-9b1c-c869d02ad0d3_Screenshot 2025-07-31 010334.png	1	4	14
107	/product_image/55323468-cd43-4618-8bf5-3be706067849_Screenshot 2025-07-31 010133.png	1	4	14
108	/product_image/9e741725-1f30-4890-9472-3a02d1dd5e1f_Screenshot 2025-07-31 010438.png	1	4	17
109	/product_image/7b88f319-a59c-42a5-9d91-80cf8077e2f3_Screenshot 2025-07-31 010430.png	1	4	17
110	/product_image/bd7d551a-7f25-4fe6-ae7f-a3ca7f620c08_Screenshot 2025-07-31 010201.png	1	4	17
111	/product_image/3005be6a-125e-4495-8039-bd2c88bbc9dc_Screenshot 2025-07-31 010416.png	1	4	58
112	/product_image/92453e10-eae4-46eb-b041-af5b9678f904_Screenshot 2025-07-31 010410.png	1	4	58
113	/product_image/ea2969db-01ad-4c84-bc37-f093a1caecca_Screenshot 2025-07-31 010151.png	1	4	58
114	/product_image/efa5ff1c-6850-4a4b-b120-a34a5f5d6cd3_Screenshot 2025-07-31 010324.png	1	4	59
115	/product_image/156fb53a-2d33-4982-b50d-698f9504a966_Screenshot 2025-07-31 010317.png	1	4	59
116	/product_image/f30a78a8-5690-47cf-9484-670c69ee9175_Screenshot 2025-07-31 010122.png	1	4	59
117	/product_image/1cf34bec-b97b-4a23-8d2d-2c4dcbbce01b_kety-wallet-on-strap-392652_540x.webp	1	7	60
118	/product_image/7513b626-fd03-4015-80ed-bc1d510c64a8_kety-wallet-on-strap-433293_460x.webp	1	7	60
119	/product_image/91e53474-138f-436e-92ba-e7979cd2a472_kety-wallet-on-strap-709295_540x.webp	1	7	60
120	/product_image/c689e912-b93a-46eb-97f2-0d06cc01c0ad_kety-wallet-on-strap-759944_460x.webp	1	7	60
121	/product_image/ccef18df-f7c0-4b99-beb1-716847e95f2b_kety-wallet-on-strap-267992_460x.webp	1	7	61
122	/product_image/2c0d9ce5-f45f-4fa6-9918-ee2b6e4a4eb1_kety-wallet-on-strap-326107_460x.webp	1	7	61
123	/product_image/16e700ef-8f8c-49ef-826c-986cd6a2cf4d_kety-wallet-on-strap-338212_460x.webp	1	7	61
124	/product_image/61bb7fce-c8e2-47e7-970a-2185d7bd05e8_kety-wallet-on-strap-904225_460x.webp	1	7	61
125	/product_image/547d2e79-5bb5-44b4-b7d6-7421bba9a2eb_kety-wallet-on-strap-759944_460x.webp	1	7	N
126	/product_image/ccbb46e1-8e62-4734-b30e-817778d3cf58_kety-wallet-on-strap-904225_460x.webp	1	7	N
127	/product_image/daca80f4-57ff-4971-b39c-244918462b3c_pure-small-crossbody-bag-432732_460x.webp	1	8	62
128	/product_image/06804962-1aa9-4ebd-a367-a8b9b1508306_pure-small-crossbody-bag-504272_460x.webp	1	8	62
129	/product_image/b12827e9-c1dd-483c-85c7-347ff3e081f5_pure-small-crossbody-bag-598564_460x.webp	1	8	62
130	/product_image/bee8a550-dbd0-4a77-830a-8b34a0b0c0fb_pure-small-crossbody-bag-761112_460x.webp	1	8	62
131	/product_image/047f2f78-4ce6-49e0-8b38-5f506228b6ef_pure-small-crossbody-bag-385207_460x.webp	1	8	63
132	/product_image/1a465add-6268-4cfd-9fca-303bf8507934_pure-small-crossbody-bag-450403_460x.webp	1	8	63
133	/product_image/ba14331f-c58a-4580-8382-32b51ebc7fa5_pure-small-crossbody-bag-485390_460x.webp	1	8	63
134	/product_image/415e689e-4bd0-404d-bab2-018a8a9e8c42_pure-small-crossbody-bag-735823_460x.webp	1	8	63
135	/product_image/bd3746d1-0010-4558-8101-3967c7250ffa_pure-small-crossbody-bag-280476_460x.jpg	1	8	64
136	/product_image/46d34b5e-c60f-4e72-b7e6-9a6f69ef3f28_pure-small-crossbody-bag-419616_460x.webp	1	8	64
137	/product_image/055d7487-5568-49d9-97ca-15f0285a34ab_pure-small-crossbody-bag-538174_460x.jpg	1	8	64
138	/product_image/4f518e84-7b05-4bfc-85aa-4248567c1a40_pure-small-crossbody-bag-937027_460x.jpg	1	8	64
139	/product_image/645c8a45-2307-4663-b850-53df997606a5_pure-small-crossbody-bag-504272_460x.webp	1	8	N
140	/product_image/a58f0f73-9e51-4117-bdef-ca98a68e8a10_pure-small-crossbody-bag-538174_460x.jpg	1	8	N
141	/product_image/61f3d11b-1a4a-4d52-a2e3-fce275e3eb42_pure-small-crossbody-bag-735823_460x.webp	1	8	N
142	/product_image/ca29a82e-320c-4e78-9966-dfa9f7e73709_BCMY_0057_Bonia-D2-OF-15-10812_460x.webp	1	8	N
143	/product_image/77754bb4-e263-4a0f-a179-4b5b7e287cb3_maida-shoulder-bag-111026_460x.webp	1	9	N
144	/product_image/d63fcd88-04d5-4c7c-8844-6c9ed9d81478_maida-shoulder-bag-184964_540x.webp	1	9	N
145	/product_image/774406b3-75f2-4d7a-a825-2d4bae99c5f8_maida-shoulder-bag-750660_540x.webp	1	9	N
146	/product_image/e50ee99a-5522-4a7a-97d4-7f146055c809_maida-shoulder-bag-970450_460x.webp	1	9	N
147	/product_image/0d23395e-cd16-4c13-aac3-1a3037273fe5_BCMY_0031_Bonia-D2-OF-20-11458.webp	1	10	65
148	/product_image/e212a867-d625-4272-a45c-6ac2c3bc3fcc_licia-mini-hobo-bag-300335.webp	1	10	65
149	/product_image/848687fe-8d9b-4261-b61e-57ffe24d0324_licia-mini-hobo-bag-554082.webp	1	10	65
150	/product_image/52cb103a-fac5-45f5-9157-85bd18ae24ba_licia-mini-hobo-bag-925756.webp	1	10	65
151	/product_image/45e1293c-4ca0-4b44-8967-826472bb5a45_BCMY_0026_Bonia-D2-OF-20-11524.webp	1	10	66
152	/product_image/4f34c10f-cfb3-4b1e-93f1-63c44c2e65c8_licia-mini-hobo-bag-534190.webp	1	10	66
153	/product_image/962ede3c-26f8-438e-a1d9-7b3935b13814_licia-mini-hobo-bag-552807.webp	1	10	66
154	/product_image/0fa76cb8-060f-456b-aeeb-8d132ecf4bd8_licia-mini-hobo-bag-736518.webp	1	10	66
155	/product_image/46ff9c68-c27f-4786-9c46-4d1171429e23_licia-mini-hobo-bag-129478.webp	1	10	67
156	/product_image/64d7a427-4359-46ad-8c54-6884c5c40c5c_licia-mini-hobo-bag-299636.webp	1	10	67
157	/product_image/3c930491-c8f2-47e5-87ef-12f4c751109a_licia-mini-hobo-bag-557505.webp	1	10	67
158	/product_image/c963367a-c7ac-4cfe-858a-395be2ef033c_licia-mini-hobo-bag-596673.webp	1	10	67
159	/product_image/94caf985-5c17-4245-9857-a0929e2df581_licia-mini-hobo-bag-300335.webp	1	10	N
160	/product_image/c19a2941-6745-4dec-9f36-447036615035_licia-mini-hobo-bag-596673.webp	1	10	N
161	/product_image/ada263eb-c49a-49cf-9ab6-60226c7de3df_licia-mini-hobo-bag-736518.webp	1	10	N
162	/product_image/9dfcc5e9-52e2-4314-a19f-0fceac82a536_freda-tote-bag-227681.webp	1	11	68
163	/product_image/f7be8c61-7aa8-4974-aa6d-82c09204f26d_freda-tote-bag-336406.webp	1	11	68
164	/product_image/3c5b70b1-1112-499a-b8c5-d8e2528f1fe6_freda-tote-bag-951131.webp	1	11	68
165	/product_image/3d58c64e-ac50-4e2e-8aeb-c55d84baecf9_freda-tote-bag-999909.webp	1	11	68
166	/product_image/d4994db4-0b0b-4ac2-a789-feef0d0457cb_freda-tote-bag-454927_460x.webp	1	11	69
167	/product_image/58c5a136-1c89-4ffe-a3ef-0b417d811b4a_freda-tote-bag-613054_460x.webp	1	11	69
168	/product_image/fb5e4b51-00fb-44c2-a1dd-06805f4e4473_freda-tote-bag-881108_460x.webp	1	11	69
169	/product_image/3a1e1c24-ea07-4331-86ff-f8cda32fea6f_freda-tote-bag-893070_460x.webp	1	11	69
170	/product_image/6d9e2f05-e73c-4dee-881f-98e8e7e4e98e_freda-tote-bag-265959.webp	1	11	70
171	/product_image/070dd905-3ce2-4a99-bcb7-bd9f7e18deea_freda-tote-bag-319364.webp	1	11	70
172	/product_image/708141f0-4044-44b2-8987-957afccf1db0_freda-tote-bag-657102.webp	1	11	70
173	/product_image/e487b435-adfd-4c59-af05-188798ebf5f1_freda-tote-bag-764924.webp	1	11	70
174	/product_image/74641957-f684-4b54-baae-84d53b1ec925_freda-tote-bag-227681.webp	1	11	N
175	/product_image/225791c6-28ba-4ed6-a617-643a4fe8056f_freda-tote-bag-454927_460x.webp	1	11	N
176	/product_image/5d32122a-034b-418c-81ee-3841bb0e4636_freda-tote-bag-657102.webp	1	11	N
177	/product_image/bbe46486-8b89-46b4-89fe-0e2e82c0baa3_Screenshot 2025-07-31 095129.png	1	12	71
178	/product_image/bd9aa5a0-d415-4fce-8f43-f710bcab97cb_Screenshot 2025-07-31 095120.png	1	12	71
179	/product_image/22146ff5-1ae0-45be-bfa8-5555f331a79b_Screenshot 2025-07-31 095107.png	1	12	71
180	/product_image/880c7114-a58d-4f50-bd47-674901c37d99_Screenshot 2025-07-31 095053.png	1	12	72
181	/product_image/3f8747ca-ff81-4595-a0f0-5ac9c2f50b1d_Screenshot 2025-07-31 095040.png	1	12	72
182	/product_image/042d600b-2426-4910-9ce2-7b630152d429_Screenshot 2025-07-31 095028.png	1	12	72
183	/product_image/f2d4c289-3034-4498-b7b4-d033932358b7_Screenshot 2025-07-31 095010.png	1	12	73
184	/product_image/9a16ffd6-7c8b-4ea9-85a0-6aef85cd574d_Screenshot 2025-07-31 094952.png	1	12	73
185	/product_image/aa257545-9421-4317-aeb3-4790bb59355f_Screenshot 2025-07-31 094941.png	1	12	73
186	/product_image/c6b15ea7-5212-4531-a7a1-f82edc8d68ce_Screenshot 2025-07-31 095129.png	1	12	N
187	/product_image/2f300993-021c-4fed-a145-ed103c03779c_Screenshot 2025-07-31 095028.png	1	12	N
188	/product_image/f7070564-a96d-4854-84de-a55b746cfa4c_Screenshot 2025-07-31 094933.png	1	12	N
.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, price, stock, stock_keeping, product_id, status) FROM stdin;
1	1804000.00	50	EVBBBO00001	1	1
2	1804000.00	50	EVBBBOEC002	1	1
5	1056000.00	20	SMBTTO00001	4	1
6	1056000.00	20	SMBTTOC6002	4	1
7	1056000.00	20	SMBTTO00001	5	1
8	1056000.00	20	SMBTTO5A003	4	1
9	1056000.00	20	SMBTTO00001	6	1
10	1056000.00	20	SMBTTOC6002	5	1
12	1056000.00	20	SMBTTOC6002	6	1
13	1056000.00	20	SMBTTO5A003	5	1
14	1056000.00	20	SMBTTO0D001	4	1
15	1056000.00	20	SMBTTO5A003	6	1
16	1056000.00	20	SMBTTO5A002	5	1
18	1056000.00	20	SMBTTO0D001	5	1
19	1056000.00	20	SMBTTO5A002	6	1
21	1056000.00	20	SMBTTO0D001	6	1
22	1056000.00	20	SMBTTOFB001	5	1
24	1056000.00	20	SMBTTOFB001	6	1
25	1056000.00	20	SMBTTOFB002	5	1
26	1056000.00	20	SMBTTOFB003	5	1
27	1056000.00	20	SMBTTOFB002	6	1
28	1056000.00	20	SMBTTOFB003	6	1
17	1056000.00	40	SMBTTOFB001	4	1
11	1056000.00	20	SMBTTO5A002	4	0
20	1056000.00	20	SMBTTOFB002	4	0
59	1056000.00	20	SMBTTOF8002	4	1
23	1056000.00	40	SMBTTOFB003	4	0
60	1276000.00	50	KEBSBO00001	7	1
61	1276000.00	50	KEBSBO78002	7	1
62	1496000.00	50	PUBSBOF8001	8	1
63	1496000.00	50	PUBSBOC1002	8	1
64	1496000.00	50	PUBSBO00001	8	1
65	1408000.00	50	LIBHBO00001	10	1
66	1408000.00	50	LIBHBO5A002	10	1
68	2376000.00	50	FRBHBO00001	11	1
69	2376000.00	50	FRBHBOED002	11	1
71	2540000.00	50	FESBFE00001	12	1
72	2540000.00	50	FESBFE78002	12	1
73	2540000.00	50	FESBFEEC002	12	1
70	2376000.00	49	FRBHBO78003	11	1
4	2508000.00	46	PUBBBO5A001	3	1
58	1056000.00	19	SMBTTO7B001	4	1
3	1980000.00	49	MOBBBOEC001	2	1
67	1408000.00	47	LIBHBO78003	10	1
.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, create_date, description, price, product_code, product_name, quantity, status, update_date, brand_id) FROM stdin;
1	2025-07-31 00:41:10.920799	Modern flair ΓÇö the Everyday Croissant Small Backpack offers brush gold accessories that add to its chic style. Offering a designer appeal, this stunning accessory pairs well with casual looks for every season. Style it with your favourite charms for a cute and fun feel.nn nnFeature Detailsnn1 Card Slotn1 Pocketn1 Zip PocketnHandle: SinglenStrap: Adjustable & Non-DetachablenMaterial: Milled LeathernAccessories Type: Brush Gold, Silver (For Black)nLogo: La Luna LogonBonia-860514-102n nnMeasurementnn22.5cm (L) ├ù 22.5cm (H) x 12cm (W)	1804000	P-647247	Everyday Croissant Small Backpack	100	1	N	2
2	2025-07-31 00:49:34.246252	The Monogram Small Backpack is an urban accessory for those with refined taste. Designed from Classic Monogram BONIA Vinyl Trimmed Leather, its simplicity and charm makes it a versatile plus-one for casual to elegant moments in life.nn nnFeature Detailsnn2 Pockets n1 Card Slot n1 Zip Compartment n1 Extra External Zip Compartment nMaterial: Classic Monogram BONIA Vinyl Trimmed Leather nAccessories Type: Antique Gold nStrap: Detachable & Adjustable [H:38cm] nBonia-868522-077n nnMeasurementn21.5 cm (L) x 13 cm (W) x 29 cm (H)	1980000	P-704701	Monogram Small Backpack	50	1	N	2
3	2025-07-31 00:51:36.284049	Cosmopolitan versatility ΓÇö the Pure Monogram Backpack has everything you could want in a travel companion. Compact with an understated edge, it boasts multiple external zipper pockets to keep things accessible and secure for active and outdoor adventures. nn nnFeature Detailsnn1 Pocketn1 Card Slotn1 Zip Pocketn2 Extra External Zipper PocketsnExterior Material: Vinyl LeathernMaterial Type: ModeratenAccessories: Brush GoldnLogo: Metal LogonLining: PlainnHandle: SinglenBonia- 860492-103n nnMeasurementnn27cm (L) x 30cm (H) x 12 cm (W)	2508000	P-793598	Pure Monogram Backpack	50	1	N	2
7	2025-07-31 08:48:02.301075	Kety Wallet On Strap is a classy piece that stores wallet essentials effortlessly. Designed with brush gold accessories and functional storage, it adds a sense of ease to your day and style no matter the occasion.nn nnFeature Detailsnn2 Pocketsn1 Zip Pocketn7 Card Sleevesn1 Window SlotnMaterial: Twist LeathernLogo: La Luna LogonAccessories: Brush GoldnShoulder Strap: Detachable [L: 52cm]. AdjustablenBonia-860515-811	1276000	P-337298	Kety Wallet On Strap	100	1	N	2
4	2025-07-31 01:08:14.091075	As part of our commitment to reducing waste through innovation, the Small Ella Tote is an extraordinary essential. Updated to enhance its signature sleek look, functionality and durability, the tote is crafted from certified recycled nylon with trim and a debossed logo patch made using USDA-certified bio-based content. Originally introduced in 2008, the ultra-lightweight silhouette features refined details like streamlined straps and a smooth finish.nnHeight: 10.4" (26.5cm); length: 13.4" (34cm); depth: 4.3" (11cm)nFits a laptop up to 13"nOuter shell: 100% recycled nylon; Bio-based, leather alternative trim from 56% USDA certified bio-based contentnLining: 100% recycled polyesternBridge with magnetic snap closurenTop handles with 8.3" (21cm) dropn1 hidden exterior pocket on logo patch, 1 interior front slit pocket, 1 interior back zipper pocketnSmallnTote BagsnStyle Number 164757	1056000	P-539910	SMALL ELLA TOTE	160	1	2025-07-31 01:39:13.921085	6
5	2025-07-31 01:08:14.260442	As part of our commitment to reducing waste through innovation, the Small Ella Tote is an extraordinary essential. Updated to enhance its signature sleek look, functionality and durability, the tote is crafted from certified recycled nylon with trim and a debossed logo patch made using USDA-certified bio-based content. Originally introduced in 2008, the ultra-lightweight silhouette features refined details like streamlined straps and a smooth finish.nnHeight: 10.4" (26.5cm); length: 13.4" (34cm); depth: 4.3" (11cm)nFits a laptop up to 13"nOuter shell: 100% recycled nylon; Bio-based, leather alternative trim from 56% USDA certified bio-based contentnLining: 100% recycled polyesternBridge with magnetic snap closurenTop handles with 8.3" (21cm) dropn1 hidden exterior pocket on logo patch, 1 interior front slit pocket, 1 interior back zipper pocketnSmallnTote BagsnStyle Number 164757	1056000	P-416260	SMALL ELLA TOTE	160	2	N	6
6	2025-07-31 01:08:14.419657	As part of our commitment to reducing waste through innovation, the Small Ella Tote is an extraordinary essential. Updated to enhance its signature sleek look, functionality and durability, the tote is crafted from certified recycled nylon with trim and a debossed logo patch made using USDA-certified bio-based content. Originally introduced in 2008, the ultra-lightweight silhouette features refined details like streamlined straps and a smooth finish.nnHeight: 10.4" (26.5cm); length: 13.4" (34cm); depth: 4.3" (11cm)nFits a laptop up to 13"nOuter shell: 100% recycled nylon; Bio-based, leather alternative trim from 56% USDA certified bio-based contentnLining: 100% recycled polyesternBridge with magnetic snap closurenTop handles with 8.3" (21cm) dropn1 hidden exterior pocket on logo patch, 1 interior front slit pocket, 1 interior back zipper pocketnSmallnTote BagsnStyle Number 164757	1056000	P-773620	SMALL ELLA TOTE	160	2	N	6
8	2025-07-31 08:57:14.615905	Stunning femininity ΓÇö the Pure Small Crossbody Bag channels a touch of alluring charm. Paired with brush gold accents, it boasts a roomy interior to house belongings while going hands-free to grace any occasion.nn nnFeature Detailsnn1 Pocketn1 Card Slotn1 Zip CompartmentnMaterial: Split LeathernAccessories Type: Brush GoldnStrap: Adjustable & Detachable [H:47cm]nBonia-860479-005n nnMeasurementnn20.5 cm (L) x 7.4 cm (W) x 17 cm (H)	1496000	P-909493	Pure Small Crossbody Bag	150	1	N	2
9	2025-07-31 08:59:58.885565	Classic sophistication ΓÇö the Maida Shoulder Bag is dedicated to serving class every time. Crafted from split leather, this stylish plus-one features the La Luna logo and bronze accessories. Perfect for events and elegant affairs.nn nFeature Detailsnn1 Card Slotn1 Pocketn1 Zip PocketnMaterial: Spilt LeathernLogo: La Luna LogonAccessories: BronzenHandle: Single [H:21cm]nStrap: Adjustable & Detachable [H:56cm]nBonia-860454-006An nnMeasurementnn25 cm (L) x 7.5 cm (W) x 18 cm (H)	1496000	P-596415	Maida Shoulder Bag	46	1	N	2
10	2025-07-31 09:34:35.833507	Shoulder sophistication ΓÇö the Licia Mini Hobo Bag offers a sense of ease, housing your absolute essentials in a stylish and dainty carryall. Made for easy days out and simple styling moments.nn nnFeature Detailsnn1 Zip CompartmentnMaterial: Split LeathernAccessories Type: Brush Gold, 08-SilvernLogo: La Luna nStrap: Dual ; Adjustable & Detachable [H:52cm]nBonia-860503-101n nnMeasurementnn17cm (L) x 18.8cm (H) x 9.5cm (W)	1408000	P-313935	Licia Mini Hobo Bag	148	1	N	2
11	2025-07-31 09:39:52.921983	Chic plus-one ΓÇö the Freda Tote Bag features a moderate texture and brush gold accessories that add to its luxe look. It offers a roomy interior for essentials like purses and gadgets, keeping this tote functional yet stylish ΓÇö perfect for a variety of occasions.nn nnFeature Detailsnn1 Zip PocketnMaterial: Milled LeathernLogo: La Luna LogonAccessories: Brush GoldnHandle Strap: DualnShoulder Strap: Detachable [L:52cm], AdjustablenBonia-860497-002n nnMeasurementnn37.5 cm (L) x 12.5 cm (W) x 22 cm (H)	2376000	P-299985	Freda Tote Bag	150	1	N	2
12	2025-07-31 09:52:48.991248	Large Fendi Spy Bag, a contemporary reinterpretation of a famous Fendi It bag presented in the Spring Summer 2005 Fashion Show, distinguished by its unique and unmistakable design. The name is inspired by the bagΓÇÖs features, which include a secret pocket hidden in the flap that can be opened with a small button. An expression of fine craftsmanship, it features distinctive twisted handles that embellish the silhouette.nMade of beige calfskin.nThe round flap closure conceals a coin pocket and is trimmed in metal and has a knotted strap in tone-on-tone leather. Printed gold-coloured FENDI Roma logo.nFeaturing a tobacco-brown FF jacquard fabric-lined internal compartment with a cardholder pocket, ring for attaching charms or key rings and gold-finish metalware.nIt can be carried in the hand or worn over the shoulder thanks to the twisted handles.nMade in ItalynnMeasurements:nHeight : 22 cmnDepth : 20 cmnWidth : 48 cmnWeight : 1.21 kg	2540000	P-884359	Fendi SPY	150	1	N	10
.


--
-- Data for Name: purchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase (id, price, purchase_date, quality, user_id) FROM stdin;
.


--
-- Data for Name: purchase_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_products (id, quality, products_id, purchase_id) FROM stdin;
.


--
-- Data for Name: refresh_token; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_token (id, expiry_date, token, user_id) FROM stdin;
2	2025-08-06 19:07:12.483851+00	efc1e8bd-9b34-4198-adf3-ae92c0904aff	2
5	2025-08-07 05:14:16.151894+00	8d389249-0a71-4190-a047-00be944e783f	5
4	2025-08-07 05:14:48.156322+00	02671120-254d-4604-b384-fe489558f1dd	4
3	2025-08-07 05:17:29.208627+00	94fbedfe-6822-4049-9965-6a707a1726e4	3
1	2025-08-07 05:21:18.588951+00	cf7b5f1c-3903-47d4-afd6-3b307c790718	1
.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refunds (id, admin_remark, completed_at, initiated_at, refund_amount, refund_type, status, receive_card_id, return_request_id) FROM stdin;
.


--
-- Data for Name: reset_password_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reset_password_request (id, email, new_password) FROM stdin;
.


--
-- Data for Name: return_request_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_request_image (id, image_url, return_request_id) FROM stdin;
.


--
-- Data for Name: return_request_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_request_products (id, product_remark, quantity, order_product_id, return_request_id) FROM stdin;
.


--
-- Data for Name: return_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_requests (id, admin_remark, cancelled_at, decision_at, reason_for_return, requested_at, return_detail, status, order_id, order_product_id, user_id) FROM stdin;
.


--
-- Data for Name: revenue_target; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revenue_target (id, created_at, period_type, period_value, target_amount) FROM stdin;
1	2025-07-31 11:38:35.316798	day	2025-07-31	1000000
.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review (id, comment, rating, "timestamp", product_id, user_id) FROM stdin;
1	I like this bag	5	2025-07-31 09:03:34.369236	3	5
2	I Like this product.	4	2025-07-31 10:17:56.812975	12	4
.


--
-- Data for Name: review_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_media (id, media_url, type, review_id) FROM stdin;
1	/review/a136dce0-21bf-4daf-bc73-5687b7c5f664_pure-monogram-backpack-396415_460x.webp	IMAGE	1
2	/review/3e1f1b8b-9032-4ca7-b770-3d6929d92edd_Screenshot 2025-07-31 095129.png	IMAGE	2
.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (id, name, level) FROM stdin;
1	ADMIN	6
2	MANAGER	5
3	SALES/MARKETING	4
4	CUSTOMER SUPPORT	3
5	WAREHOUSE STAFF	2
6	CUSTOMER	1
.


--
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permission (id, permission_id, role_id) FROM stdin;
1	31	1
2	1	1
3	2	1
4	3	1
5	4	1
6	5	1
7	6	1
8	7	1
9	8	1
10	9	1
11	10	1
12	11	1
13	12	1
14	13	1
15	14	1
16	15	1
17	16	1
18	17	1
19	18	1
20	19	1
21	20	1
22	21	1
23	22	1
24	23	1
25	24	1
26	25	1
27	26	1
28	27	1
29	28	1
30	29	1
31	30	1
32	32	1
33	33	1
34	34	1
35	35	1
36	36	1
37	37	1
38	38	1
39	39	1
40	40	1
41	41	1
42	42	1
43	43	1
44	44	1
45	45	1
46	46	1
47	47	1
48	48	1
49	49	1
50	50	1
51	51	1
52	52	1
53	53	1
54	54	1
55	55	1
56	56	1
57	57	1
58	58	1
59	59	1
.


--
-- Data for Name: role_permission_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permission_log (id, action, details, performed_by, target_id, target_name, target_type, "timestamp") FROM stdin;
1	ASSIGNED	Assigned permissions: [1, 2, 3, 4, 5, 26, 27, 28, 6, 7, 12, 13, 14, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 21, 31, 22, 23, 24, 25, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]	system	1	ADMIN	ROLE	2025-07-30 23:38:42.720361
2	ASSIGNED	Assigned permissions: [1, 2, 3, 4, 5, 26, 27, 28, 6, 7, 12, 13, 14, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 21, 31, 22, 23, 24, 25, 29, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]	system	1	ADMIN	ROLE	2025-07-30 23:38:48.4661
.


--
-- Data for Name: saved_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_cards (id, card_brand, card_number, cardholder_name, expiry_date, is_default, status, user_id) FROM stdin;
1	VISA	1234567890123456	John Doe	11 / 26	f	1	1
2	VISA	1234567894567894	Phyo MIn Khant	12 / 25	f	1	4
3	VISA	1234568765434567	Kyaw Kyaw	12 / 26	f	1	5
.


--
-- Data for Name: security_policy_rule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_policy_rule (id, action, attempts, extra_data, window_minutes) FROM stdin;
1	email_alert	2	N	15
2	require_otp	3	N	15
3	ban_ip	5	{"banMinutes":60}	15
.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status (id, name) FROM stdin;
1	PENDING
2	PAID
3	PROCESSING
4	SHIPPED
5	DELIVERED
6	CANCELLED
7	RETURNED
.


--
-- Data for Name: test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test (id) FROM stdin;
.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_activity (id, activity_time, activity_type, user_id) FROM stdin;
1	2025-07-30 21:21:49.545532	login	1
2	2025-07-30 21:57:40.120747	login	2
3	2025-07-30 21:57:45.335611	login	2
4	2025-07-30 21:57:59.352296	page_view	2
5	2025-07-30 22:21:38.73939	login	2
6	2025-07-30 22:21:45.845171	page_view	2
7	2025-07-30 22:21:59.319694	page_view	2
8	2025-07-30 22:21:59.336491	page_view	2
9	2025-07-30 22:36:54.448831	page_view	2
10	2025-07-30 22:37:00.143669	page_view	2
11	2025-07-30 22:37:00.118956	page_view	2
12	2025-07-30 23:19:39.149926	login	2
13	2025-07-30 23:21:26.860314	login	2
14	2025-07-30 23:23:26.941268	login	3
15	2025-07-30 23:33:28.891436	login	3
16	2025-07-30 23:34:25.751263	login	3
17	2025-07-30 23:34:28.305622	page_view	3
18	2025-07-30 23:34:28.368807	page_view	3
19	2025-07-30 23:34:41.667998	active	3
20	2025-07-30 23:34:53.264716	page_view	3
21	2025-07-30 23:34:53.825319	active	3
22	2025-07-30 23:36:59.700512	active	3
23	2025-07-30 23:37:30.4372	active	3
24	2025-07-30 23:37:49.399567	login	3
25	2025-07-30 23:37:56.023222	page_view	3
26	2025-07-30 23:37:58.133345	active	3
27	2025-07-30 23:38:29.144288	page_view	3
28	2025-07-30 23:38:30.781412	active	3
29	2025-07-30 23:39:09.353688	active	3
30	2025-07-30 23:39:54.029153	active	3
31	2025-07-30 23:43:46.225642	login	2
32	2025-07-30 23:43:55.454364	page_view	2
33	2025-07-30 23:43:55.663001	page_view	2
34	2025-07-30 23:43:59.839136	active	2
35	2025-07-30 23:44:39.809593	active	2
36	2025-07-30 23:44:53.786764	page_view	2
37	2025-07-30 23:45:09.912182	active	2
38	2025-07-30 23:45:18.433637	page_view	2
39	2025-07-30 23:45:40.140574	active	2
40	2025-07-30 23:46:10.34857	active	2
41	2025-07-30 23:47:29.592672	active	2
42	2025-07-30 23:47:59.542027	active	2
43	2025-07-30 23:48:29.626034	active	2
44	2025-07-30 23:49:56.595197	active	2
45	2025-07-31 00:02:47.650907	login	4
46	2025-07-31 00:03:32.540947	active	2
47	2025-07-31 00:04:33.006624	active	2
48	2025-07-31 00:06:07.416255	active	2
49	2025-07-31 00:06:19.167964	page_view	2
50	2025-07-31 00:08:13.031167	active	2
51	2025-07-31 00:09:07.261978	login	5
52	2025-07-31 00:09:18.736344	page_view	5
53	2025-07-31 00:09:24.004269	page_view	5
54	2025-07-31 00:09:24.004269	page_view	5
55	2025-07-31 00:09:31.29828	page_view	5
56	2025-07-31 00:09:31.312107	page_view	5
57	2025-07-31 00:09:31.398473	page_view	5
58	2025-07-31 00:09:37.676503	page_view	5
59	2025-07-31 00:09:37.676503	page_view	5
60	2025-07-31 00:09:37.843434	page_view	5
61	2025-07-31 00:09:38.021268	page_view	5
62	2025-07-31 00:09:50.879229	active	2
63	2025-07-31 00:10:24.108923	active	2
64	2025-07-31 00:11:30.631282	active	2
65	2025-07-31 00:11:57.201863	page_view	5
66	2025-07-31 00:12:07.343304	active	2
67	2025-07-31 00:12:37.380005	active	2
68	2025-07-31 00:13:07.089571	active	2
69	2025-07-31 00:13:56.88771	active	2
70	2025-07-31 00:14:57.817896	active	2
71	2025-07-31 00:15:23.51198	page_view	5
72	2025-07-31 00:15:23.687633	page_view	5
73	2025-07-31 00:15:34.939523	active	2
74	2025-07-31 00:17:08.401603	active	2
75	2025-07-31 00:17:40.119236	active	2
76	2025-07-31 00:18:23.460058	active	2
77	2025-07-31 00:20:18.636727	active	2
78	2025-07-31 00:20:48.556485	active	2
79	2025-07-31 00:21:30.59315	active	2
80	2025-07-31 00:22:00.704662	active	2
81	2025-07-31 00:23:05.0044	active	2
82	2025-07-31 00:24:47.94135	active	2
83	2025-07-31 00:25:17.823734	active	2
84	2025-07-31 00:26:23.902037	active	2
85	2025-07-31 00:26:54.174928	active	2
86	2025-07-31 00:27:58.558108	active	2
87	2025-07-31 00:29:00.489659	active	2
88	2025-07-31 00:30:18.039584	active	2
89	2025-07-31 00:30:44.106352	login	1
90	2025-07-31 00:30:49.860213	active	2
91	2025-07-31 00:30:52.47169	page_view	1
92	2025-07-31 00:30:52.731645	page_view	1
93	2025-07-31 00:30:56.76767	active	1
94	2025-07-31 00:31:26.105754	active	1
95	2025-07-31 00:31:31.37553	active	2
96	2025-07-31 00:32:01.273803	active	2
97	2025-07-31 00:32:41.102548	active	2
98	2025-07-31 00:33:17.551217	active	2
99	2025-07-31 00:34:16.219431	active	2
100	2025-07-31 00:34:47.82399	active	2
101	2025-07-31 00:35:08.709106	page_view	5
102	2025-07-31 00:35:20.06742	page_view	5
103	2025-07-31 00:35:20.086818	page_view	5
104	2025-07-31 00:35:25.889045	page_view	5
105	2025-07-31 00:35:25.889045	page_view	5
106	2025-07-31 00:35:25.889045	page_view	5
107	2025-07-31 00:35:28.269279	active	2
108	2025-07-31 00:35:58.538299	active	2
109	2025-07-31 00:36:28.861358	active	2
110	2025-07-31 00:36:59.015768	active	2
111	2025-07-31 00:37:31.152751	active	2
112	2025-07-31 00:38:01.213085	active	2
113	2025-07-31 00:38:33.961872	active	2
114	2025-07-31 00:39:10.452297	active	2
115	2025-07-31 00:39:47.81999	active	2
116	2025-07-31 00:40:18.00802	active	2
117	2025-07-31 00:40:48.044945	active	2
118	2025-07-31 00:41:18.462165	active	2
119	2025-07-31 00:43:52.057109	active	2
120	2025-07-31 00:44:05.598822	page_view	5
121	2025-07-31 00:44:24.45068	active	2
122	2025-07-31 00:45:13.609329	active	2
123	2025-07-31 00:45:29.825268	page_view	2
124	2025-07-31 00:45:46.045517	active	2
125	2025-07-31 00:46:16.387052	active	2
126	2025-07-31 00:46:51.630791	page_view	2
127	2025-07-31 00:46:54.129213	active	2
128	2025-07-31 00:47:27.748693	active	2
129	2025-07-31 00:47:53.700535	page_view	5
130	2025-07-31 00:47:58.38892	active	2
131	2025-07-31 00:48:11.437674	page_view	5
142	2025-07-31 00:52:19.202201	page_view	5
147	2025-07-31 00:52:30.460727	page_view	5
151	2025-07-31 00:55:11.355461	active	2
1243	2025-07-31 12:28:13.304486	active	1
1244	2025-07-31 12:29:36.215495	active	1
1245	2025-07-31 12:33:49.910786	active	1
1249	2025-07-31 12:35:55.939005	active	1
1394	2025-07-31 15:07:24.650184	page_view	1
1395	2025-07-31 15:07:45.755833	page_view	1
1400	2025-07-31 15:14:40.138653	active	1
1402	2025-07-31 15:15:42.305504	active	1
1403	2025-07-31 15:16:13.052439	active	1
1410	2025-07-31 15:27:41.548291	active	1
1411	2025-07-31 15:28:11.540355	active	1
132	2025-07-31 00:48:11.44006	page_view	5
134	2025-07-31 00:48:58.49755	active	2
135	2025-07-31 00:49:33.016457	active	2
137	2025-07-31 00:50:39.604704	active	2
141	2025-07-31 00:52:01.650692	page_view	5
1246	2025-07-31 12:33:54.415331	page_view	1
1248	2025-07-31 12:35:17.850282	active	1
1251	2025-07-31 12:36:31.53637	active	1
1252	2025-07-31 12:37:00.368105	active	1
1253	2025-07-31 12:39:06.40931	active	1
1397	2025-07-31 15:08:42.009395	active	1
1398	2025-07-31 15:09:22.448999	active	1
1404	2025-07-31 15:19:13.650464	active	1
133	2025-07-31 00:48:28.367494	active	2
138	2025-07-31 00:51:17.178271	active	2
146	2025-07-31 00:52:30.510372	page_view	5
154	2025-07-31 00:58:04.239232	active	2
155	2025-07-31 00:58:43.559456	active	2
157	2025-07-31 00:59:43.779036	active	2
1247	2025-07-31 12:34:20.315147	active	1
1401	2025-07-31 15:15:10.946843	active	1
1405	2025-07-31 15:21:28.17813	active	1
1407	2025-07-31 15:24:46.818565	active	1
1408	2025-07-31 15:25:16.848963	active	1
1412	2025-07-31 15:28:41.610828	active	1
136	2025-07-31 00:50:09.523867	active	2
139	2025-07-31 00:51:51.079916	page_view	5
148	2025-07-31 00:52:30.864262	page_view	5
152	2025-07-31 00:55:41.348815	active	2
153	2025-07-31 00:56:11.549502	active	2
1250	2025-07-31 12:36:28.600853	page_view	1
1256	2025-07-31 12:42:52.193098	active	1
1257	2025-07-31 12:43:27.89689	active	1
1409	2025-07-31 15:25:46.952526	active	1
140	2025-07-31 00:52:01.650692	page_view	5
143	2025-07-31 00:52:19.247652	page_view	5
144	2025-07-31 00:52:19.359569	page_view	5
145	2025-07-31 00:52:30.510372	page_view	5
149	2025-07-31 00:52:43.568546	active	2
150	2025-07-31 00:53:22.700675	active	2
156	2025-07-31 00:59:13.357708	active	2
158	2025-07-31 01:04:43.521469	active	2
159	2025-07-31 01:05:13.719498	active	2
160	2025-07-31 01:05:43.973763	active	2
161	2025-07-31 01:06:14.50051	active	2
162	2025-07-31 01:06:58.564858	active	2
163	2025-07-31 01:07:31.824148	active	2
164	2025-07-31 01:07:59.519081	active	2
165	2025-07-31 01:08:29.681441	active	2
166	2025-07-31 01:09:24.145989	active	2
167	2025-07-31 01:09:54.19093	active	2
168	2025-07-31 01:10:29.445901	active	2
169	2025-07-31 01:11:00.965698	active	2
170	2025-07-31 01:11:30.987113	active	2
171	2025-07-31 01:12:01.012554	active	2
172	2025-07-31 01:12:30.97236	active	2
173	2025-07-31 01:13:01.740716	active	2
174	2025-07-31 01:13:34.591866	active	2
175	2025-07-31 01:14:07.900935	page_view	2
176	2025-07-31 01:14:09.04948	active	2
177	2025-07-31 01:14:30.114046	page_view	5
178	2025-07-31 01:14:49.16083	page_view	5
179	2025-07-31 01:14:49.225178	page_view	5
180	2025-07-31 01:14:53.76947	active	2
181	2025-07-31 01:15:32.82143	active	2
182	2025-07-31 01:16:09.770791	active	2
183	2025-07-31 01:16:41.164681	active	2
184	2025-07-31 01:17:11.231808	active	2
185	2025-07-31 01:17:41.511319	active	2
186	2025-07-31 01:17:46.973231	page_view	2
187	2025-07-31 01:17:50.815952	active	2
188	2025-07-31 01:17:47.759445	page_view	3
189	2025-07-31 01:17:50.546991	active	3
190	2025-07-31 01:18:00.630181	login	3
191	2025-07-31 01:18:06.511889	page_view	3
192	2025-07-31 01:18:08.226847	active	3
193	2025-07-31 01:18:20.961084	active	2
194	2025-07-31 01:18:38.341232	active	3
195	2025-07-31 01:18:51.334229	active	2
196	2025-07-31 01:19:21.569049	active	2
197	2025-07-31 01:19:55.286683	active	3
198	2025-07-31 01:24:42.02362	active	2
199	2025-07-31 01:26:49.542469	active	2
200	2025-07-31 01:29:04.530316	active	2
201	2025-07-31 01:29:34.38808	active	2
202	2025-07-31 01:31:14.83393	page_view	3
203	2025-07-31 01:31:16.118748	active	3
204	2025-07-31 01:31:48.904386	page_view	3
205	2025-07-31 01:31:49.92064	active	3
206	2025-07-31 01:33:23.575587	active	2
207	2025-07-31 01:34:44.480499	page_view	2
208	2025-07-31 01:34:54.238397	active	2
209	2025-07-31 01:35:24.203922	active	2
210	2025-07-31 01:35:54.395377	active	2
211	2025-07-31 01:36:24.36703	active	2
212	2025-07-31 01:36:43.056802	login	3
213	2025-07-31 01:36:46.912198	page_view	3
214	2025-07-31 01:36:48.595463	active	3
215	2025-07-31 01:37:01.002317	active	2
216	2025-07-31 01:37:10.705296	login	2
217	2025-07-31 01:37:14.534829	page_view	2
218	2025-07-31 01:37:15.816358	active	2
219	2025-07-31 01:37:31.03757	active	2
220	2025-07-31 01:38:10.102782	active	2
221	2025-07-31 01:38:40.187753	active	2
222	2025-07-31 01:39:12.07022	active	2
223	2025-07-31 01:39:42.383889	active	2
224	2025-07-31 01:40:12.782015	active	2
225	2025-07-31 01:41:15.624087	page_view	2
226	2025-07-31 01:41:39.469805	page_view	2
227	2025-07-31 01:41:54.525072	page_view	2
228	2025-07-31 01:42:04.614519	page_view	2
229	2025-07-31 01:42:40.129317	active	2
230	2025-07-31 01:42:50.116914	active	2
231	2025-07-31 01:42:44.847821	page_view	2
232	2025-07-31 01:42:45.81418	active	2
233	2025-07-31 01:43:11.32481	page_view	2
234	2025-07-31 01:43:13.430078	active	2
235	2025-07-31 01:43:48.425905	page_view	2
236	2025-07-31 01:44:13.101509	page_view	2
237	2025-07-31 01:45:20.557958	active	2
238	2025-07-31 01:45:40.794138	page_view	2
239	2025-07-31 01:45:41.533772	active	2
240	2025-07-31 01:45:56.9397	page_view	5
241	2025-07-31 01:46:07.413203	page_view	5
242	2025-07-31 01:46:07.464786	page_view	5
243	2025-07-31 01:46:58.740783	active	2
244	2025-07-31 01:47:19.409693	active	2
245	2025-07-31 01:47:53.089216	login	3
246	2025-07-31 01:47:56.790373	page_view	3
247	2025-07-31 01:47:57.985583	active	3
248	2025-07-31 01:48:09.415237	active	2
249	2025-07-31 01:51:00.863753	active	3
250	2025-07-31 01:51:47.481912	active	3
251	2025-07-31 01:52:17.836393	active	3
252	2025-07-31 01:52:24.293075	page_view	3
253	2025-07-31 01:52:25.254852	active	3
254	2025-07-31 01:53:04.105082	active	3
255	2025-07-31 01:53:34.211382	active	3
256	2025-07-31 01:54:24.583878	active	3
257	2025-07-31 01:54:54.610537	active	3
258	2025-07-31 01:55:31.166252	active	3
259	2025-07-31 01:56:07.563036	active	3
260	2025-07-31 02:01:54.972625	active	3
261	2025-07-31 02:02:26.616305	active	3
262	2025-07-31 02:02:42.314352	page_view	3
263	2025-07-31 02:02:45.615345	active	3
264	2025-07-31 02:03:15.60057	active	3
265	2025-07-31 02:03:45.670855	active	3
266	2025-07-31 02:04:18.943213	active	3
267	2025-07-31 02:04:49.045776	active	3
268	2025-07-31 02:05:19.490059	active	3
269	2025-07-31 02:05:59.364935	active	3
270	2025-07-31 02:06:37.167186	active	3
271	2025-07-31 02:07:11.817625	active	3
272	2025-07-31 02:07:41.870012	active	3
273	2025-07-31 02:08:23.763224	active	3
274	2025-07-31 02:08:55.189031	active	3
275	2025-07-31 02:09:29.609028	active	3
276	2025-07-31 02:10:01.736122	active	3
277	2025-07-31 02:10:40.659899	active	3
278	2025-07-31 02:11:17.263849	active	3
279	2025-07-31 02:12:02.50246	active	3
280	2025-07-31 02:12:39.317255	active	3
281	2025-07-31 02:13:29.656814	active	3
282	2025-07-31 02:13:59.655049	active	3
283	2025-07-31 02:14:29.668915	active	3
285	2025-07-31 02:15:53.944876	active	3
287	2025-07-31 02:17:08.841069	active	3
288	2025-07-31 02:18:14.30413	active	3
1254	2025-07-31 12:39:30.835043	page_view	1
1258	2025-07-31 12:44:26.107338	active	1
1259	2025-07-31 12:47:34.122674	active	1
1261	2025-07-31 12:48:58.829538	active	1
1262	2025-07-31 12:51:59.83845	active	1
1287	2025-07-31 12:53:52.518935	active	1
1300	2025-07-31 12:55:20.986994	active	1
1413	2025-07-31 15:29:36.576964	active	1
284	2025-07-31 02:15:00.366065	active	3
286	2025-07-31 02:16:24.404008	active	3
289	2025-07-31 02:18:44.274728	active	3
290	2025-07-31 02:19:14.464705	active	3
291	2025-07-31 02:19:47.799613	active	3
292	2025-07-31 08:43:55.933429	page_view	2
293	2025-07-31 08:43:55.933429	active	2
294	2025-07-31 08:44:25.913815	active	2
295	2025-07-31 08:44:42.260168	page_view	5
296	2025-07-31 08:45:26.422073	active	2
297	2025-07-31 08:46:25.978032	active	2
298	2025-07-31 08:46:56.518348	active	2
299	2025-07-31 08:47:26.608035	active	2
300	2025-07-31 08:47:59.5364	active	2
301	2025-07-31 08:48:44.032967	active	2
302	2025-07-31 08:48:55.629089	page_view	2
303	2025-07-31 08:49:05.685388	active	2
304	2025-07-31 08:49:36.031069	active	2
305	2025-07-31 08:50:50.974226	active	2
306	2025-07-31 08:51:25.495992	active	2
307	2025-07-31 08:51:50.114324	page_view	2
308	2025-07-31 08:51:52.734672	active	2
309	2025-07-31 08:52:07.816304	page_view	2
310	2025-07-31 08:52:11.876851	active	2
311	2025-07-31 08:53:08.035967	page_view	2
312	2025-07-31 08:53:20.527806	page_view	2
313	2025-07-31 08:53:35.496232	active	2
314	2025-07-31 08:53:44.157414	page_view	2
315	2025-07-31 08:53:45.40909	active	2
316	2025-07-31 08:54:21.288883	page_view	2
317	2025-07-31 08:54:33.435972	active	2
318	2025-07-31 08:55:03.435963	active	2
319	2025-07-31 08:55:40.10218	active	2
320	2025-07-31 08:56:10.576306	active	2
321	2025-07-31 08:56:43.215214	active	2
322	2025-07-31 08:57:13.264548	active	2
323	2025-07-31 08:57:49.166541	active	2
324	2025-07-31 08:58:28.436272	active	2
325	2025-07-31 08:58:58.439308	active	2
326	2025-07-31 08:59:28.52584	active	2
327	2025-07-31 08:59:58.589623	active	2
328	2025-07-31 09:01:36.989177	active	2
329	2025-07-31 09:02:07.014835	active	2
330	2025-07-31 09:02:17.014618	login	5
331	2025-07-31 09:02:21.367025	page_view	5
332	2025-07-31 09:02:24.532231	page_view	2
333	2025-07-31 09:02:31.407786	active	2
334	2025-07-31 09:02:39.275079	page_view	5
335	2025-07-31 09:02:39.292489	page_view	5
336	2025-07-31 09:04:18.832729	page_view	5
337	2025-07-31 09:04:50.941918	active	2
338	2025-07-31 09:05:21.021955	active	2
339	2025-07-31 09:05:51.0009	active	2
340	2025-07-31 09:06:21.171442	active	2
341	2025-07-31 09:06:51.165579	active	2
342	2025-07-31 09:07:21.405845	active	2
343	2025-07-31 09:07:51.37262	active	2
344	2025-07-31 09:08:59.495056	active	2
345	2025-07-31 09:09:29.997648	active	2
346	2025-07-31 09:11:13.961844	active	2
347	2025-07-31 09:11:18.468285	page_view	2
348	2025-07-31 09:11:19.354255	active	2
349	2025-07-31 09:11:27.88454	page_view	2
350	2025-07-31 09:11:30.047039	active	2
351	2025-07-31 09:13:58.867632	page_view	2
352	2025-07-31 09:13:59.714458	active	2
353	2025-07-31 09:14:29.915551	active	2
354	2025-07-31 09:15:36.874089	active	2
355	2025-07-31 09:18:22.216149	active	2
356	2025-07-31 09:18:52.163252	active	2
357	2025-07-31 09:19:16.044182	page_view	5
358	2025-07-31 09:19:16.174938	page_view	5
359	2025-07-31 09:19:30.123929	login	1
360	2025-07-31 09:19:35.107841	page_view	1
361	2025-07-31 09:19:36.008994	page_view	1
362	2025-07-31 09:19:38.188299	active	1
363	2025-07-31 09:19:42.624346	active	2
364	2025-07-31 09:20:18.471921	page_view	1
365	2025-07-31 09:20:33.762441	page_view	1
366	2025-07-31 09:20:33.866163	page_view	1
367	2025-07-31 09:20:41.504379	active	2
368	2025-07-31 09:20:46.838	page_view	1
369	2025-07-31 09:20:46.926758	page_view	1
370	2025-07-31 09:20:46.933738	page_view	1
371	2025-07-31 09:20:58.475229	page_view	1
372	2025-07-31 09:20:58.481189	page_view	1
373	2025-07-31 09:20:58.484185	page_view	1
374	2025-07-31 09:20:59.10524	page_view	1
375	2025-07-31 09:21:07.949383	page_view	1
376	2025-07-31 09:21:07.93941	page_view	1
377	2025-07-31 09:21:07.951378	page_view	1
378	2025-07-31 09:21:08.993571	page_view	1
379	2025-07-31 09:21:09.226061	page_view	1
380	2025-07-31 09:21:38.17713	page_view	1
381	2025-07-31 09:21:38.184093	page_view	1
382	2025-07-31 09:21:38.700387	page_view	1
383	2025-07-31 09:21:38.762297	page_view	1
384	2025-07-31 09:21:38.81709	page_view	1
385	2025-07-31 09:21:39.977897	page_view	1
386	2025-07-31 09:21:54.204771	active	2
387	2025-07-31 09:22:29.10656	page_view	1
388	2025-07-31 09:22:29.544963	active	2
389	2025-07-31 09:22:39.389036	page_view	1
390	2025-07-31 09:22:39.388037	page_view	1
391	2025-07-31 09:22:55.638804	page_view	1
392	2025-07-31 09:22:55.689699	page_view	1
393	2025-07-31 09:22:55.807353	page_view	1
394	2025-07-31 09:23:04.878935	page_view	1
395	2025-07-31 09:23:04.905864	page_view	1
396	2025-07-31 09:23:05.511257	page_view	1
397	2025-07-31 09:23:05.424496	page_view	1
398	2025-07-31 09:23:16.308314	page_view	1
399	2025-07-31 09:23:16.35818	page_view	1
400	2025-07-31 09:23:16.827924	page_view	1
401	2025-07-31 09:23:16.94162	page_view	1
402	2025-07-31 09:23:17.478228	page_view	1
403	2025-07-31 09:23:18.129432	active	2
404	2025-07-31 09:23:50.986595	active	2
405	2025-07-31 09:24:15.280261	page_view	1
406	2025-07-31 09:24:15.376781	page_view	1
407	2025-07-31 09:24:15.832247	page_view	1
408	2025-07-31 09:24:16.014949	page_view	1
409	2025-07-31 09:24:16.546708	page_view	1
410	2025-07-31 09:24:17.187672	page_view	1
411	2025-07-31 09:24:25.489241	active	2
412	2025-07-31 09:25:00.357446	active	2
413	2025-07-31 09:25:09.207086	order	1
414	2025-07-31 09:25:17.494765	page_view	1
418	2025-07-31 09:25:19.206537	page_view	1
423	2025-07-31 09:25:28.858956	page_view	1
426	2025-07-31 09:25:30.864098	page_view	1
1255	2025-07-31 12:40:33.470904	active	1
1260	2025-07-31 12:48:09.188486	active	1
1268	2025-07-31 12:52:43.045498	active	1
1303	2025-07-31 12:55:54.188569	page_view	1
1312	2025-07-31 12:59:11.860178	active	1
1313	2025-07-31 12:59:49.731348	active	1
1414	2025-07-31 15:30:57.259513	page_view	4
1423	2025-07-31 15:31:08.922839	page_view	4
415	2025-07-31 09:25:17.678298	page_view	1
420	2025-07-31 09:25:20.360091	page_view	1
424	2025-07-31 09:25:28.986928	page_view	1
1263	2025-07-31 12:52:14.648973	active	2
1264	2025-07-31 12:52:24.159299	page_view	4
1269	2025-07-31 12:53:00.611447	page_view	4
1277	2025-07-31 12:53:28.283007	page_view	4
1285	2025-07-31 12:53:42.514444	page_view	4
1289	2025-07-31 12:55:07.249822	page_view	4
1294	2025-07-31 12:55:11.663336	page_view	4
1296	2025-07-31 12:55:17.967444	page_view	4
1302	2025-07-31 12:55:22.18045	page_view	4
1304	2025-07-31 12:57:39.677092	active	2
1307	2025-07-31 12:57:43.693401	page_view	4
1415	2025-07-31 15:30:57.314879	page_view	4
1420	2025-07-31 15:31:08.538245	page_view	4
1427	2025-07-31 15:32:14.550748	page_view	4
416	2025-07-31 09:25:17.578564	page_view	1
419	2025-07-31 09:25:20.23641	page_view	1
422	2025-07-31 09:25:28.360258	page_view	1
427	2025-07-31 09:25:31.564186	page_view	1
1265	2025-07-31 12:52:28.593514	page_view	2
1266	2025-07-31 12:52:33.639874	page_view	4
1274	2025-07-31 12:53:08.453491	page_view	4
1279	2025-07-31 12:53:28.521903	page_view	4
1281	2025-07-31 12:53:42.04749	page_view	4
1291	2025-07-31 12:55:07.814554	page_view	4
1295	2025-07-31 12:55:17.891718	page_view	4
1301	2025-07-31 12:55:22.068909	page_view	4
1305	2025-07-31 12:57:43.676253	page_view	4
1310	2025-07-31 12:57:47.62153	page_view	4
1416	2025-07-31 15:30:57.334858	page_view	4
1422	2025-07-31 15:31:08.736702	page_view	4
1425	2025-07-31 15:31:51.00271	page_view	2
1429	2025-07-31 15:36:08.101662	active	2
1433	2025-07-31 15:37:34.135245	page_view	4
1437	2025-07-31 15:37:50.883987	page_view	4
1443	2025-07-31 15:39:07.183581	active	2
417	2025-07-31 09:25:18.173973	page_view	1
425	2025-07-31 09:25:29.093829	page_view	1
428	2025-07-31 09:25:32.013171	page_view	1
1267	2025-07-31 12:52:33.858693	page_view	4
1270	2025-07-31 12:53:00.611447	page_view	4
1272	2025-07-31 12:53:08.25675	page_view	4
1278	2025-07-31 12:53:28.392985	page_view	4
1283	2025-07-31 12:53:42.070198	page_view	4
1286	2025-07-31 12:53:46.143767	page_view	4
1288	2025-07-31 12:55:07.249822	page_view	4
1298	2025-07-31 12:55:18.907069	page_view	4
1306	2025-07-31 12:57:43.690173	page_view	4
1311	2025-07-31 12:57:47.605012	page_view	4
1417	2025-07-31 15:30:57.620477	page_view	4
1421	2025-07-31 15:31:08.538245	page_view	4
1424	2025-07-31 15:31:13.090543	page_view	4
1426	2025-07-31 15:31:54.557767	active	2
1435	2025-07-31 15:37:41.169069	page_view	4
1438	2025-07-31 15:37:50.883987	page_view	4
421	2025-07-31 09:25:28.298413	page_view	1
429	2025-07-31 09:25:56.923411	active	2
430	2025-07-31 09:25:58.794764	page_view	1
431	2025-07-31 09:25:58.764849	page_view	1
432	2025-07-31 09:25:58.810722	page_view	1
433	2025-07-31 09:25:59.479158	page_view	1
434	2025-07-31 09:26:00.511907	page_view	1
435	2025-07-31 09:26:01.501605	page_view	1
436	2025-07-31 09:26:01.766774	page_view	1
437	2025-07-31 09:26:02.299348	page_view	1
438	2025-07-31 09:26:02.833099	page_view	1
439	2025-07-31 09:26:16.373089	page_view	1
440	2025-07-31 09:26:16.400043	page_view	1
441	2025-07-31 09:26:17.08234	page_view	1
442	2025-07-31 09:26:17.148165	page_view	1
443	2025-07-31 09:26:17.748199	page_view	1
444	2025-07-31 09:26:18.995261	page_view	1
445	2025-07-31 09:26:19.503561	page_view	1
446	2025-07-31 09:26:19.633214	page_view	1
447	2025-07-31 09:26:20.183188	page_view	1
448	2025-07-31 09:26:21.408105	page_view	1
449	2025-07-31 09:26:32.893422	order	1
450	2025-07-31 09:26:40.872305	page_view	1
451	2025-07-31 09:26:40.88527	page_view	1
452	2025-07-31 09:26:40.956078	page_view	1
453	2025-07-31 09:26:41.600195	page_view	1
454	2025-07-31 09:26:42.216296	page_view	1
455	2025-07-31 09:26:44.231578	page_view	1
456	2025-07-31 09:26:44.334301	page_view	1
457	2025-07-31 09:26:44.764336	page_view	1
458	2025-07-31 09:26:44.984475	page_view	1
459	2025-07-31 09:26:45.052432	page_view	1
460	2025-07-31 09:26:47.422898	page_view	1
461	2025-07-31 09:26:52.979281	page_view	1
462	2025-07-31 09:26:53.000222	page_view	1
463	2025-07-31 09:26:53.556737	page_view	1
464	2025-07-31 09:26:53.754231	page_view	1
465	2025-07-31 09:26:55.624588	page_view	1
466	2025-07-31 09:26:56.175103	page_view	1
467	2025-07-31 09:26:56.653197	page_view	1
468	2025-07-31 09:26:56.902546	page_view	1
469	2025-07-31 09:26:57.936071	page_view	1
470	2025-07-31 09:27:00.871258	page_view	1
471	2025-07-31 09:27:01.099647	page_view	1
472	2025-07-31 09:27:01.275178	page_view	1
473	2025-07-31 09:27:06.335929	active	2
474	2025-07-31 09:27:42.548784	active	2
475	2025-07-31 09:28:24.627658	active	2
476	2025-07-31 09:28:25.527732	login	1
477	2025-07-31 09:28:29.958813	page_view	1
478	2025-07-31 09:28:30.755084	page_view	1
479	2025-07-31 09:28:32.496999	active	1
480	2025-07-31 09:28:44.775386	page_view	1
481	2025-07-31 09:28:52.831077	active	2
482	2025-07-31 09:29:12.876523	page_view	1
483	2025-07-31 09:29:12.883503	page_view	1
484	2025-07-31 09:29:22.30416	page_view	1
485	2025-07-31 09:29:28.9794	active	2
486	2025-07-31 09:29:58.616517	active	2
487	2025-07-31 09:30:28.790261	active	2
488	2025-07-31 09:31:00.730955	active	2
489	2025-07-31 09:31:18.72156	page_view	2
490	2025-07-31 09:31:41.234088	page_view	2
491	2025-07-31 09:31:42.140492	active	2
492	2025-07-31 09:32:21.656026	active	2
493	2025-07-31 09:32:52.475556	active	2
494	2025-07-31 09:33:21.879183	active	2
495	2025-07-31 09:33:52.166098	active	2
496	2025-07-31 09:34:27.000395	active	2
497	2025-07-31 09:35:47.713244	active	2
498	2025-07-31 09:36:19.175358	active	2
499	2025-07-31 09:36:51.525331	active	2
500	2025-07-31 09:37:22.293365	active	2
501	2025-07-31 09:38:01.474864	page_view	1
502	2025-07-31 09:38:01.518745	page_view	1
503	2025-07-31 09:38:02.775761	page_view	1
504	2025-07-31 09:38:03.690458	page_view	1
505	2025-07-31 09:38:06.002447	page_view	1
506	2025-07-31 09:38:48.438741	active	2
507	2025-07-31 09:39:19.01729	active	2
508	2025-07-31 09:39:51.847992	active	2
509	2025-07-31 09:40:02.990091	page_view	5
510	2025-07-31 09:40:35.956584	active	2
511	2025-07-31 09:41:05.82931	active	2
512	2025-07-31 09:41:42.755227	active	2
513	2025-07-31 09:42:40.955794	login	1
514	2025-07-31 09:42:48.485586	page_view	1
515	2025-07-31 09:42:49.77073	active	1
516	2025-07-31 09:43:14.451327	page_view	1
517	2025-07-31 09:43:46.971675	active	2
518	2025-07-31 09:45:50.444209	active	2
519	2025-07-31 09:46:58.429119	active	2
520	2025-07-31 09:47:02.741146	page_view	1
521	2025-07-31 09:47:03.659597	page_view	1
522	2025-07-31 09:47:31.135304	active	2
523	2025-07-31 09:48:03.865558	active	2
524	2025-07-31 09:48:34.664145	active	2
525	2025-07-31 09:51:33.328345	active	2
526	2025-07-31 09:52:03.614824	active	2
527	2025-07-31 09:52:40.318029	active	2
528	2025-07-31 09:53:14.230918	active	2
529	2025-07-31 09:54:34.503311	page_view	1
530	2025-07-31 09:54:37.09569	active	1
531	2025-07-31 09:54:48.32653	active	2
532	2025-07-31 09:55:23.568146	active	2
533	2025-07-31 09:55:38.922087	active	1
534	2025-07-31 09:56:00.273968	active	2
535	2025-07-31 09:56:07.182283	page_view	5
536	2025-07-31 09:56:23.982676	active	1
537	2025-07-31 09:56:35.52126	active	2
538	2025-07-31 09:56:54.063558	active	1
539	2025-07-31 09:57:07.771973	active	2
540	2025-07-31 09:57:24.09986	active	1
541	2025-07-31 09:57:43.908376	active	2
542	2025-07-31 09:57:54.309825	active	1
543	2025-07-31 09:58:34.430282	active	2
544	2025-07-31 09:59:12.37651	active	2
545	2025-07-31 09:59:56.054691	active	2
546	2025-07-31 10:00:37.303423	active	1
547	2025-07-31 10:01:34.507496	active	2
548	2025-07-31 10:02:08.866705	active	2
549	2025-07-31 10:02:38.839336	active	2
550	2025-07-31 10:03:08.838703	active	2
551	2025-07-31 10:03:26.118826	active	1
552	2025-07-31 10:03:48.892838	active	2
553	2025-07-31 10:04:18.987221	active	2
554	2025-07-31 10:04:23.306647	active	1
555	2025-07-31 10:04:50.380873	active	2
556	2025-07-31 10:04:59.286636	active	1
567	2025-07-31 10:13:17.485173	page_view	5
576	2025-07-31 10:15:39.559768	page_view	4
581	2025-07-31 10:16:43.692544	active	2
583	2025-07-31 10:18:03.010362	page_view	4
588	2025-07-31 10:18:16.435241	page_view	4
603	2025-07-31 10:21:28.983366	page_view	4
608	2025-07-31 10:22:05.546569	page_view	4
617	2025-07-31 10:23:09.635682	page_view	4
620	2025-07-31 10:23:52.759657	page_view	4
1271	2025-07-31 12:53:00.618782	page_view	4
1275	2025-07-31 12:53:08.634109	page_view	4
1276	2025-07-31 12:53:28.278989	page_view	4
1284	2025-07-31 12:53:42.317784	page_view	4
1290	2025-07-31 12:55:07.44734	page_view	4
1293	2025-07-31 12:55:11.409501	page_view	4
1297	2025-07-31 12:55:18.317093	page_view	4
1309	2025-07-31 12:57:44.091083	page_view	4
1418	2025-07-31 15:30:57.620477	page_view	4
1419	2025-07-31 15:31:08.538245	page_view	4
1428	2025-07-31 15:32:14.555753	page_view	4
1430	2025-07-31 15:36:45.08845	active	2
1432	2025-07-31 15:37:34.132768	page_view	4
1439	2025-07-31 15:37:50.903443	page_view	4
1442	2025-07-31 15:38:56.321666	page_view	2
557	2025-07-31 10:06:41.297643	active	2
558	2025-07-31 10:07:12.118477	active	2
559	2025-07-31 10:07:48.05631	active	2
562	2025-07-31 10:09:45.082104	active	2
563	2025-07-31 10:10:53.173936	active	2
565	2025-07-31 10:11:30.898201	active	2
568	2025-07-31 10:13:30.675617	active	2
570	2025-07-31 10:15:20.132562	login	4
586	2025-07-31 10:18:03.394315	page_view	4
590	2025-07-31 10:18:16.53152	page_view	4
597	2025-07-31 10:18:51.218362	page_view	4
598	2025-07-31 10:21:22.833125	page_view	4
601	2025-07-31 10:21:28.56559	page_view	4
611	2025-07-31 10:22:42.869728	page_view	4
618	2025-07-31 10:23:19.938004	active	2
622	2025-07-31 10:23:52.846032	page_view	4
1273	2025-07-31 12:53:08.268071	page_view	4
1280	2025-07-31 12:53:28.626091	page_view	4
1282	2025-07-31 12:53:42.034643	page_view	4
1292	2025-07-31 12:55:09.96081	page_view	4
1299	2025-07-31 12:55:20.622655	page_view	4
1308	2025-07-31 12:57:43.877544	page_view	4
1431	2025-07-31 15:37:28.47596	page_view	4
1434	2025-07-31 15:37:41.165147	page_view	4
560	2025-07-31 10:08:36.292606	active	2
571	2025-07-31 10:15:24.785035	page_view	4
574	2025-07-31 10:15:31.082099	page_view	4
579	2025-07-31 10:15:39.788362	page_view	4
584	2025-07-31 10:18:02.987544	page_view	4
592	2025-07-31 10:18:16.754505	page_view	4
595	2025-07-31 10:18:42.070857	page_view	4
600	2025-07-31 10:21:22.923561	page_view	4
606	2025-07-31 10:21:59.834495	page_view	4
612	2025-07-31 10:22:42.904241	page_view	4
614	2025-07-31 10:23:09.37033	page_view	4
621	2025-07-31 10:23:52.787136	page_view	4
1314	2025-07-31 13:07:34.40864	page_view	4
1436	2025-07-31 15:37:41.282621	page_view	4
1440	2025-07-31 15:37:51.066828	page_view	4
1441	2025-07-31 15:38:36.612499	active	2
561	2025-07-31 10:09:09.698622	active	2
564	2025-07-31 10:10:55.97323	active	1
566	2025-07-31 10:12:26.841631	active	2
569	2025-07-31 10:14:48.012987	active	1
572	2025-07-31 10:15:24.842099	page_view	4
573	2025-07-31 10:15:31.057349	page_view	4
575	2025-07-31 10:15:31.148668	page_view	4
577	2025-07-31 10:15:39.564029	page_view	4
578	2025-07-31 10:15:39.564029	page_view	4
580	2025-07-31 10:15:40.381325	active	1
582	2025-07-31 10:18:02.987544	page_view	4
585	2025-07-31 10:18:03.23173	page_view	4
587	2025-07-31 10:18:06.105359	active	1
589	2025-07-31 10:18:16.483161	page_view	4
591	2025-07-31 10:18:16.646598	page_view	4
593	2025-07-31 10:18:19.182199	page_view	4
594	2025-07-31 10:18:40.775503	active	1
596	2025-07-31 10:18:51.133913	page_view	4
599	2025-07-31 10:21:22.835128	page_view	4
602	2025-07-31 10:21:28.606795	page_view	4
604	2025-07-31 10:21:29.084032	page_view	4
605	2025-07-31 10:21:50.760067	active	1
607	2025-07-31 10:22:05.43935	page_view	4
609	2025-07-31 10:22:20.861337	active	1
610	2025-07-31 10:22:42.792567	page_view	4
613	2025-07-31 10:22:52.818094	active	1
615	2025-07-31 10:23:09.37033	page_view	4
616	2025-07-31 10:23:09.38731	page_view	4
619	2025-07-31 10:23:23.219465	active	1
623	2025-07-31 10:23:52.949294	page_view	4
624	2025-07-31 10:23:53.05884	page_view	4
625	2025-07-31 10:23:53.834744	active	1
626	2025-07-31 10:23:57.278407	page_view	4
627	2025-07-31 10:23:57.389991	page_view	4
628	2025-07-31 10:23:57.573949	page_view	4
629	2025-07-31 10:23:58.023933	page_view	4
630	2025-07-31 10:23:59.319834	page_view	4
631	2025-07-31 10:24:00.011967	page_view	4
632	2025-07-31 10:24:12.845358	page_view	4
633	2025-07-31 10:24:12.845358	page_view	4
634	2025-07-31 10:24:12.86851	page_view	4
635	2025-07-31 10:24:13.059043	page_view	4
636	2025-07-31 10:24:13.276493	page_view	4
637	2025-07-31 10:24:15.413747	page_view	4
638	2025-07-31 10:24:15.533728	page_view	4
639	2025-07-31 10:24:23.889096	active	1
640	2025-07-31 10:24:25.943276	page_view	4
641	2025-07-31 10:24:25.968398	page_view	4
642	2025-07-31 10:24:26.033633	page_view	4
643	2025-07-31 10:24:26.130677	page_view	4
644	2025-07-31 10:24:26.243311	page_view	4
645	2025-07-31 10:24:28.562185	page_view	4
646	2025-07-31 10:24:28.674198	page_view	4
647	2025-07-31 10:24:28.841366	page_view	4
648	2025-07-31 10:24:32.088665	page_view	4
649	2025-07-31 10:24:32.127206	page_view	4
650	2025-07-31 10:24:32.206407	page_view	4
651	2025-07-31 10:24:32.454993	page_view	4
652	2025-07-31 10:24:32.875138	page_view	4
653	2025-07-31 10:24:34.817421	page_view	4
654	2025-07-31 10:24:34.817421	page_view	4
655	2025-07-31 10:24:35.118643	page_view	4
656	2025-07-31 10:24:35.236613	page_view	4
657	2025-07-31 10:24:39.069209	page_view	4
658	2025-07-31 10:24:39.102537	page_view	4
659	2025-07-31 10:24:39.349381	page_view	4
660	2025-07-31 10:24:40.048694	page_view	4
661	2025-07-31 10:24:40.483114	page_view	4
662	2025-07-31 10:24:41.690202	page_view	4
663	2025-07-31 10:24:41.871513	page_view	4
664	2025-07-31 10:24:42.061222	page_view	4
665	2025-07-31 10:24:42.857223	page_view	4
666	2025-07-31 10:24:43.209865	page_view	4
667	2025-07-31 10:24:54.679605	active	1
668	2025-07-31 10:24:58.982435	page_view	4
669	2025-07-31 10:24:59.001285	page_view	4
670	2025-07-31 10:24:59.109263	page_view	4
671	2025-07-31 10:24:59.22306	page_view	4
672	2025-07-31 10:24:59.229882	page_view	4
673	2025-07-31 10:25:01.707067	page_view	4
674	2025-07-31 10:25:01.942313	page_view	4
675	2025-07-31 10:25:01.973302	page_view	4
676	2025-07-31 10:25:02.127288	page_view	4
677	2025-07-31 10:25:02.505369	page_view	4
678	2025-07-31 10:25:04.573444	page_view	4
679	2025-07-31 10:25:23.710552	page_view	4
680	2025-07-31 10:25:23.671518	page_view	4
681	2025-07-31 10:25:23.769586	page_view	4
682	2025-07-31 10:25:23.920892	page_view	4
683	2025-07-31 10:25:24.037513	page_view	4
684	2025-07-31 10:25:24.755937	active	1
685	2025-07-31 10:25:26.401003	page_view	4
686	2025-07-31 10:25:26.465538	page_view	4
687	2025-07-31 10:25:26.614884	page_view	4
688	2025-07-31 10:25:26.752651	page_view	4
689	2025-07-31 10:25:27.015793	page_view	4
690	2025-07-31 10:25:29.131945	page_view	4
691	2025-07-31 10:25:29.244703	page_view	4
692	2025-07-31 10:26:30.588434	page_view	4
693	2025-07-31 10:26:30.588434	page_view	4
694	2025-07-31 10:26:30.685753	page_view	4
695	2025-07-31 10:26:30.822584	page_view	4
696	2025-07-31 10:26:30.93473	page_view	4
697	2025-07-31 10:26:33.488105	page_view	4
698	2025-07-31 10:26:33.603115	page_view	4
699	2025-07-31 10:26:33.629653	page_view	4
700	2025-07-31 10:26:33.936198	page_view	4
701	2025-07-31 10:26:34.237079	page_view	4
702	2025-07-31 10:26:36.167255	page_view	4
703	2025-07-31 10:26:36.347731	page_view	4
704	2025-07-31 10:26:36.613138	page_view	4
705	2025-07-31 10:26:38.911939	page_view	4
706	2025-07-31 10:26:39.107565	page_view	4
707	2025-07-31 10:26:39.294006	page_view	4
708	2025-07-31 10:26:39.431758	page_view	4
709	2025-07-31 10:26:41.281081	page_view	4
710	2025-07-31 10:26:41.680151	page_view	4
711	2025-07-31 10:26:41.908544	page_view	4
712	2025-07-31 10:26:42.241773	page_view	4
713	2025-07-31 10:26:42.589361	page_view	1
714	2025-07-31 10:26:42.425283	page_view	4
715	2025-07-31 10:26:44.209493	page_view	4
725	2025-07-31 10:27:08.287174	page_view	4
728	2025-07-31 10:27:10.776385	page_view	4
734	2025-07-31 10:27:13.641624	page_view	4
738	2025-07-31 10:27:16.305167	page_view	4
745	2025-07-31 10:27:19.721761	page_view	4
1315	2025-07-31 13:07:49.884602	page_view	4
1319	2025-07-31 13:08:00.217084	page_view	4
1322	2025-07-31 13:08:24.626022	page_view	4
1444	2025-07-31 15:55:53.550609	active	1
716	2025-07-31 10:26:44.499262	page_view	4
724	2025-07-31 10:27:08.06841	page_view	4
730	2025-07-31 10:27:11.079362	page_view	4
733	2025-07-31 10:27:13.525512	page_view	4
740	2025-07-31 10:27:16.818503	page_view	4
744	2025-07-31 10:27:19.387594	page_view	4
748	2025-07-31 10:27:22.194049	page_view	4
1316	2025-07-31 13:07:49.935544	page_view	4
1317	2025-07-31 13:08:00.072871	page_view	4
1321	2025-07-31 13:08:15.417583	order	4
1325	2025-07-31 13:08:24.950499	page_view	4
1328	2025-07-31 13:22:08.687067	active	1
1445	2025-07-31 20:32:55.446275	page_view	2
717	2025-07-31 10:26:44.786389	page_view	4
726	2025-07-31 10:27:08.403039	page_view	4
731	2025-07-31 10:27:11.31764	page_view	4
735	2025-07-31 10:27:13.944335	page_view	4
739	2025-07-31 10:27:16.533258	page_view	4
743	2025-07-31 10:27:19.255057	page_view	4
749	2025-07-31 10:27:22.556526	page_view	4
1318	2025-07-31 13:08:00.077414	page_view	4
1324	2025-07-31 13:08:24.726062	page_view	4
1446	2025-07-31 20:33:18.64658	active	2
718	2025-07-31 10:26:45.007523	page_view	4
722	2025-07-31 10:27:07.985381	page_view	4
729	2025-07-31 10:27:10.878139	page_view	4
736	2025-07-31 10:27:15.205632	page_view	4
741	2025-07-31 10:27:18.028782	page_view	4
746	2025-07-31 10:27:20.955212	page_view	4
1320	2025-07-31 13:08:10.544708	page_view	1
1323	2025-07-31 13:08:24.664397	page_view	4
1327	2025-07-31 13:19:31.027529	active	1
1447	2025-07-31 20:34:10.907715	active	2
1448	2025-07-31 20:34:18.370464	page_view	2
1459	2025-07-31 20:49:53.749788	page_view	4
719	2025-07-31 10:26:45.327087	page_view	4
720	2025-07-31 10:27:00.807089	page_view	1
723	2025-07-31 10:27:08.019584	page_view	4
727	2025-07-31 10:27:10.726758	page_view	4
732	2025-07-31 10:27:13.380437	page_view	4
737	2025-07-31 10:27:16.230858	page_view	4
742	2025-07-31 10:27:19.016001	page_view	4
747	2025-07-31 10:27:21.640803	page_view	4
1326	2025-07-31 13:18:50.116094	active	1
1449	2025-07-31 20:34:28.040532	active	2
1458	2025-07-31 20:49:46.992461	page_view	4
1462	2025-07-31 20:50:50.026763	page_view	4
721	2025-07-31 10:27:00.875902	page_view	1
750	2025-07-31 10:28:36.921134	page_view	4
751	2025-07-31 10:28:47.482616	page_view	4
752	2025-07-31 10:29:02.218363	page_view	4
753	2025-07-31 10:29:03.76563	page_view	4
754	2025-07-31 10:29:03.880514	page_view	4
755	2025-07-31 10:30:59.961297	page_view	1
756	2025-07-31 10:30:59.961297	page_view	1
757	2025-07-31 10:31:00.635512	page_view	1
758	2025-07-31 10:31:02.827288	page_view	4
759	2025-07-31 10:31:05.977403	page_view	4
760	2025-07-31 10:31:05.999159	page_view	4
761	2025-07-31 10:31:29.345564	page_view	1
762	2025-07-31 10:31:29.391443	page_view	1
763	2025-07-31 10:31:29.956006	page_view	1
764	2025-07-31 10:31:30.805685	page_view	1
765	2025-07-31 10:31:31.368666	page_view	4
766	2025-07-31 10:31:31.470058	page_view	4
767	2025-07-31 10:31:32.20835	page_view	4
768	2025-07-31 10:31:32.323452	page_view	4
769	2025-07-31 10:31:39.815337	page_view	4
770	2025-07-31 10:31:39.847222	page_view	4
771	2025-07-31 10:31:42.580128	page_view	1
772	2025-07-31 10:31:43.153594	page_view	1
773	2025-07-31 10:31:43.714479	page_view	1
774	2025-07-31 10:31:44.399646	page_view	1
775	2025-07-31 10:31:43.80324	page_view	1
776	2025-07-31 10:32:13.516416	page_view	2
777	2025-07-31 10:32:18.11902	active	2
778	2025-07-31 10:32:48.178404	active	2
779	2025-07-31 10:33:18.159619	active	2
780	2025-07-31 10:33:48.818759	page_view	4
781	2025-07-31 10:34:01.248369	page_view	4
782	2025-07-31 10:34:01.33255	page_view	4
783	2025-07-31 10:35:48.896477	active	2
784	2025-07-31 10:36:35.793392	page_view	4
785	2025-07-31 10:36:35.82698	page_view	4
786	2025-07-31 10:36:35.894451	page_view	4
787	2025-07-31 10:37:18.185163	order	4
788	2025-07-31 10:37:25.348123	page_view	4
789	2025-07-31 10:37:25.410289	page_view	4
790	2025-07-31 10:37:25.444009	page_view	4
791	2025-07-31 10:37:25.584303	page_view	4
792	2025-07-31 10:37:55.266679	page_view	4
793	2025-07-31 10:37:55.306257	page_view	4
794	2025-07-31 10:37:55.369839	page_view	4
795	2025-07-31 10:37:55.500512	page_view	4
796	2025-07-31 10:37:55.714292	page_view	4
797	2025-07-31 10:37:58.763866	page_view	4
798	2025-07-31 10:37:59.027286	page_view	4
799	2025-07-31 10:37:59.333925	page_view	4
800	2025-07-31 10:37:59.797549	page_view	4
801	2025-07-31 10:38:01.243275	page_view	4
802	2025-07-31 10:38:39.83554	page_view	4
803	2025-07-31 10:38:45.048674	page_view	4
804	2025-07-31 10:38:45.915943	page_view	4
805	2025-07-31 10:38:48.577242	page_view	4
806	2025-07-31 10:38:49.791323	page_view	4
807	2025-07-31 10:38:53.347795	page_view	4
808	2025-07-31 10:38:55.985117	page_view	4
809	2025-07-31 10:38:56.001247	page_view	4
810	2025-07-31 10:39:01.638898	page_view	4
811	2025-07-31 10:39:01.669221	page_view	4
812	2025-07-31 10:39:01.669221	page_view	4
813	2025-07-31 10:39:06.107676	active	2
814	2025-07-31 10:39:28.925155	page_view	4
815	2025-07-31 10:39:28.953536	page_view	4
816	2025-07-31 10:39:29.033395	page_view	4
817	2025-07-31 10:39:40.396235	page_view	4
818	2025-07-31 10:39:40.404732	page_view	4
819	2025-07-31 10:39:40.491829	page_view	4
820	2025-07-31 10:39:40.624706	page_view	4
821	2025-07-31 10:39:43.361584	page_view	4
822	2025-07-31 10:39:43.555963	page_view	4
823	2025-07-31 10:39:43.704193	page_view	4
824	2025-07-31 10:39:44.037971	page_view	4
825	2025-07-31 10:39:45.901341	page_view	4
826	2025-07-31 10:39:53.658317	page_view	4
827	2025-07-31 10:39:53.658317	page_view	4
828	2025-07-31 10:39:53.695002	page_view	4
829	2025-07-31 10:39:53.943378	page_view	4
830	2025-07-31 10:39:54.050214	page_view	4
831	2025-07-31 10:40:02.502633	page_view	4
832	2025-07-31 10:40:02.518894	page_view	4
833	2025-07-31 10:40:02.740254	page_view	4
834	2025-07-31 10:40:03.837116	page_view	4
835	2025-07-31 10:40:04.702126	page_view	4
836	2025-07-31 10:40:05.690867	page_view	4
837	2025-07-31 10:41:22.511866	page_view	4
838	2025-07-31 10:41:22.511866	page_view	4
839	2025-07-31 10:41:22.516165	page_view	4
840	2025-07-31 10:41:22.940753	page_view	4
841	2025-07-31 10:41:23.004239	page_view	4
842	2025-07-31 10:41:25.693913	page_view	4
843	2025-07-31 10:41:25.801428	page_view	4
844	2025-07-31 10:41:33.816933	page_view	4
845	2025-07-31 10:41:33.779383	page_view	4
846	2025-07-31 10:41:33.860536	page_view	4
847	2025-07-31 10:41:34.103781	page_view	4
848	2025-07-31 10:41:35.765059	page_view	4
849	2025-07-31 10:41:37.055119	page_view	4
850	2025-07-31 10:41:37.157368	page_view	4
851	2025-07-31 10:41:37.411918	page_view	4
852	2025-07-31 10:42:06.417425	page_view	4
853	2025-07-31 10:42:06.461986	page_view	4
854	2025-07-31 10:42:06.530639	page_view	4
855	2025-07-31 10:42:06.698364	page_view	4
856	2025-07-31 10:42:06.812434	page_view	4
857	2025-07-31 10:42:09.695496	page_view	4
858	2025-07-31 10:42:09.82686	page_view	4
859	2025-07-31 10:42:09.991724	page_view	4
860	2025-07-31 10:42:10.157451	page_view	4
861	2025-07-31 10:42:17.193611	page_view	4
862	2025-07-31 10:42:17.304091	page_view	4
863	2025-07-31 10:42:17.715215	page_view	4
864	2025-07-31 10:42:18.519327	page_view	4
865	2025-07-31 10:42:18.748418	page_view	4
866	2025-07-31 10:42:20.425371	page_view	4
867	2025-07-31 10:42:20.787962	page_view	4
868	2025-07-31 10:42:21.081404	page_view	4
869	2025-07-31 10:42:21.889282	page_view	4
871	2025-07-31 10:42:30.189128	page_view	4
876	2025-07-31 10:42:33.465135	page_view	4
881	2025-07-31 10:42:36.75783	page_view	4
883	2025-07-31 10:42:48.152491	page_view	4
888	2025-07-31 10:42:51.984326	page_view	4
1329	2025-07-31 13:36:59.342892	active	1
1330	2025-07-31 13:37:29.325675	active	1
1331	2025-07-31 13:39:20.166929	active	1
1450	2025-07-31 20:34:39.792196	page_view	2
1452	2025-07-31 20:43:52.899129	active	2
1454	2025-07-31 20:45:11.330973	active	2
1456	2025-07-31 20:47:17.794223	active	2
1457	2025-07-31 20:49:24.664436	active	2
1460	2025-07-31 20:49:53.907634	page_view	4
870	2025-07-31 10:42:21.981174	page_view	4
874	2025-07-31 10:42:30.595895	page_view	4
879	2025-07-31 10:42:33.890938	page_view	4
884	2025-07-31 10:42:48.258508	page_view	4
889	2025-07-31 10:42:52.257143	page_view	4
1332	2025-07-31 13:51:32.404304	active	1
1334	2025-07-31 13:55:54.765039	page_view	1
1337	2025-07-31 13:55:58.983107	page_view	1
1341	2025-07-31 13:56:03.740985	page_view	1
1353	2025-07-31 13:57:28.362759	page_view	1
1451	2025-07-31 20:42:22.982376	active	2
1453	2025-07-31 20:44:40.967208	active	2
1461	2025-07-31 20:50:50.01998	page_view	4
872	2025-07-31 10:42:30.194808	page_view	4
878	2025-07-31 10:42:33.779599	page_view	4
885	2025-07-31 10:42:48.635073	page_view	4
890	2025-07-31 10:42:52.26459	page_view	4
1333	2025-07-31 13:55:50.681992	page_view	1
1336	2025-07-31 13:55:58.590645	page_view	1
1340	2025-07-31 13:56:03.632361	page_view	1
1348	2025-07-31 13:57:24.160438	page_view	1
1365	2025-07-31 14:03:43.584219	active	1
1367	2025-07-31 14:05:43.292059	active	1
1372	2025-07-31 14:10:53.181832	active	1
1377	2025-07-31 14:15:33.016737	page_view	1
1455	2025-07-31 20:46:06.687501	active	2
1463	2025-07-31 20:50:50.158694	page_view	4
873	2025-07-31 10:42:30.272862	page_view	4
877	2025-07-31 10:42:33.564104	page_view	4
882	2025-07-31 10:42:48.223176	page_view	4
887	2025-07-31 10:42:51.794499	page_view	4
1335	2025-07-31 13:55:55.198203	page_view	1
1338	2025-07-31 13:56:02.098016	page_view	1
1342	2025-07-31 13:56:05.647742	page_view	1
1345	2025-07-31 13:57:15.939041	page_view	1
1349	2025-07-31 13:57:24.184822	page_view	1
1352	2025-07-31 13:57:27.810017	page_view	1
1356	2025-07-31 13:57:33.82629	page_view	1
1359	2025-07-31 13:58:26.102337	page_view	1
1362	2025-07-31 14:02:52.537105	page_view	1
1363	2025-07-31 14:03:09.058652	page_view	1
1366	2025-07-31 14:04:13.638556	active	1
1464	2025-08-01 00:47:52.781726	active	3
1468	2025-08-01 00:48:21.186891	active	3
1470	2025-08-01 00:49:22.058022	active	3
1472	2025-08-01 00:50:24.270957	active	3
1474	2025-08-01 00:50:44.753428	active	3
1475	2025-08-01 00:51:03.517183	page_view	3
875	2025-07-31 10:42:31.99954	page_view	4
880	2025-07-31 10:42:35.883697	page_view	4
886	2025-07-31 10:42:49.195962	page_view	4
891	2025-07-31 10:42:53.138838	page_view	4
892	2025-07-31 10:42:55.897229	page_view	4
893	2025-07-31 10:42:56.081558	page_view	4
894	2025-07-31 10:43:07.654195	page_view	2
895	2025-07-31 10:44:27.145022	page_view	2
896	2025-07-31 10:45:38.8916	page_view	2
897	2025-07-31 10:46:02.724232	page_view	2
898	2025-07-31 10:46:25.295467	page_view	2
899	2025-07-31 10:47:14.009581	page_view	2
900	2025-07-31 10:47:46.979844	page_view	2
901	2025-07-31 10:48:35.939161	page_view	1
902	2025-07-31 10:48:51.016167	page_view	1
903	2025-07-31 10:48:51.083985	page_view	1
904	2025-07-31 10:49:50.710092	page_view	4
905	2025-07-31 10:49:50.747981	page_view	4
906	2025-07-31 10:52:27.837107	page_view	1
907	2025-07-31 10:54:35.026088	page_view	1
908	2025-07-31 10:54:38.748613	page_view	1
909	2025-07-31 10:54:39.35935	page_view	1
910	2025-07-31 10:55:01.360165	active	2
911	2025-07-31 10:57:40.169228	page_view	2
912	2025-07-31 10:57:51.221654	page_view	2
913	2025-07-31 10:57:56.345891	active	2
914	2025-07-31 10:58:09.020702	page_view	4
915	2025-07-31 10:58:19.236358	page_view	4
916	2025-07-31 10:58:19.372292	page_view	4
917	2025-07-31 10:58:47.957807	page_view	2
918	2025-07-31 10:58:51.999776	active	2
919	2025-07-31 10:59:12.931937	page_view	4
920	2025-07-31 10:59:12.948086	page_view	4
921	2025-07-31 10:59:29.181591	page_view	4
922	2025-07-31 10:59:29.230739	page_view	4
923	2025-07-31 10:59:29.231735	page_view	4
924	2025-07-31 10:59:44.785053	page_view	4
925	2025-07-31 10:59:44.802193	page_view	4
926	2025-07-31 10:59:44.814635	page_view	4
927	2025-07-31 10:59:44.979478	page_view	4
928	2025-07-31 11:00:01.731527	page_view	4
929	2025-07-31 11:00:01.762733	page_view	4
930	2025-07-31 11:00:01.800463	page_view	4
931	2025-07-31 11:00:01.916536	page_view	4
932	2025-07-31 11:00:01.969213	page_view	4
933	2025-07-31 11:00:16.782944	order	4
934	2025-07-31 11:00:23.093584	page_view	4
935	2025-07-31 11:00:23.093584	page_view	4
936	2025-07-31 11:00:23.146999	page_view	4
937	2025-07-31 11:00:23.379374	page_view	4
938	2025-07-31 11:00:23.495874	page_view	4
939	2025-07-31 11:00:25.971992	page_view	4
940	2025-07-31 11:00:29.78263	active	2
941	2025-07-31 11:05:37.430841	page_view	2
942	2025-07-31 11:05:39.499206	active	2
943	2025-07-31 11:06:09.26136	page_view	2
944	2025-07-31 11:06:23.886819	active	2
945	2025-07-31 11:09:49.943588	active	2
946	2025-07-31 11:14:15.35371	active	2
947	2025-07-31 11:14:30.863827	page_view	2
948	2025-07-31 11:14:32.995366	active	2
949	2025-07-31 11:14:51.468669	login	5
950	2025-07-31 11:15:31.62917	page_view	5
951	2025-07-31 11:15:48.741547	page_view	5
952	2025-07-31 11:15:48.802042	page_view	5
953	2025-07-31 11:15:53.540908	page_view	5
954	2025-07-31 11:15:53.610899	page_view	5
955	2025-07-31 11:15:53.757154	page_view	5
956	2025-07-31 11:15:58.835792	active	2
957	2025-07-31 11:16:28.776373	active	2
958	2025-07-31 11:17:11.94744	active	2
959	2025-07-31 11:17:41.968927	active	2
960	2025-07-31 11:17:48.833187	page_view	2
961	2025-07-31 11:18:12.013745	active	2
962	2025-07-31 11:18:41.996653	active	2
963	2025-07-31 11:18:53.744067	active	2
964	2025-07-31 11:19:23.784662	active	2
965	2025-07-31 11:19:31.988379	page_view	5
966	2025-07-31 11:19:37.500193	page_view	5
967	2025-07-31 11:19:37.519096	page_view	5
968	2025-07-31 11:19:40.799021	active	2
969	2025-07-31 11:20:12.349794	page_view	5
970	2025-07-31 11:20:12.349794	page_view	5
971	2025-07-31 11:20:12.381992	page_view	5
972	2025-07-31 11:20:27.561465	page_view	5
973	2025-07-31 11:20:27.775252	page_view	5
974	2025-07-31 11:20:27.893294	page_view	5
975	2025-07-31 11:20:28.8812	page_view	5
976	2025-07-31 11:20:38.248436	page_view	5
977	2025-07-31 11:20:38.305573	page_view	5
978	2025-07-31 11:20:38.631221	page_view	5
979	2025-07-31 11:20:38.935849	page_view	5
980	2025-07-31 11:20:40.196088	page_view	5
981	2025-07-31 11:20:59.59047	page_view	5
982	2025-07-31 11:20:59.593259	page_view	5
983	2025-07-31 11:20:59.662064	page_view	5
984	2025-07-31 11:20:59.803097	page_view	5
985	2025-07-31 11:20:59.93268	page_view	5
986	2025-07-31 11:21:02.579386	page_view	5
987	2025-07-31 11:21:26.757027	active	2
988	2025-07-31 11:21:34.915799	page_view	5
989	2025-07-31 11:21:34.927123	page_view	5
990	2025-07-31 11:21:35.000164	page_view	5
991	2025-07-31 11:21:35.118287	page_view	5
992	2025-07-31 11:21:35.269654	page_view	5
993	2025-07-31 11:21:37.799977	page_view	5
994	2025-07-31 11:21:37.945198	page_view	5
995	2025-07-31 11:22:07.012457	login	5
996	2025-07-31 11:22:10.650062	order	5
997	2025-07-31 11:22:24.673838	page_view	5
998	2025-07-31 11:22:26.835712	page_view	5
999	2025-07-31 11:22:26.950825	page_view	5
1000	2025-07-31 11:22:30.43088	active	2
1001	2025-07-31 11:22:42.289684	active	2
1002	2025-07-31 11:23:00.510309	active	2
1003	2025-07-31 11:23:12.297745	active	2
1004	2025-07-31 11:23:39.567115	active	2
1005	2025-07-31 11:25:54.407875	active	2
1006	2025-07-31 11:26:41.91658	active	2
1007	2025-07-31 11:26:53.010481	page_view	2
1008	2025-07-31 11:26:54.510191	active	2
1009	2025-07-31 11:28:19.578076	page_view	5
1010	2025-07-31 11:28:19.578076	page_view	5
1011	2025-07-31 11:28:36.144805	page_view	5
1020	2025-07-31 11:29:12.30444	page_view	5
1028	2025-07-31 11:29:27.725242	page_view	5
1031	2025-07-31 11:29:37.62104	login	5
1035	2025-07-31 11:29:43.430929	page_view	5
1339	2025-07-31 13:56:02.130474	page_view	1
1343	2025-07-31 13:56:06.588669	page_view	1
1347	2025-07-31 13:57:22.706205	page_view	1
1351	2025-07-31 13:57:26.781717	page_view	1
1355	2025-07-31 13:57:30.427926	page_view	1
1360	2025-07-31 14:02:29.912317	page_view	1
1364	2025-07-31 14:03:13.4783	active	1
1465	2025-08-01 00:47:56.836078	page_view	3
1012	2025-07-31 11:28:36.144805	page_view	5
1016	2025-07-31 11:28:57.2909	page_view	5
1030	2025-07-31 11:29:28.074685	page_view	5
1033	2025-07-31 11:29:43.123242	page_view	5
1037	2025-07-31 11:29:46.446022	page_view	5
1344	2025-07-31 13:57:15.867006	page_view	1
1346	2025-07-31 13:57:22.702217	page_view	1
1350	2025-07-31 13:57:26.046932	page_view	1
1354	2025-07-31 13:57:29.210081	page_view	1
1357	2025-07-31 13:57:34.38233	page_view	1
1358	2025-07-31 13:58:26.064107	page_view	1
1369	2025-07-31 14:08:46.470502	active	1
1370	2025-07-31 14:10:14.660322	active	1
1371	2025-07-31 14:10:51.490634	page_view	1
1376	2025-07-31 14:15:33.016737	page_view	1
1466	2025-08-01 00:47:58.053813	active	3
1473	2025-08-01 00:50:43.153042	page_view	3
1478	2025-08-01 00:52:21.617902	active	3
1013	2025-07-31 11:28:36.160428	page_view	5
1015	2025-07-31 11:28:57.259642	page_view	5
1023	2025-07-31 11:29:12.60231	page_view	5
1029	2025-07-31 11:29:27.962527	page_view	5
1036	2025-07-31 11:29:43.537929	page_view	5
1361	2025-07-31 14:02:31.744125	active	1
1368	2025-07-31 14:06:20.132726	active	1
1375	2025-07-31 14:15:12.494043	page_view	1
1467	2025-08-01 00:48:17.29946	page_view	3
1471	2025-08-01 00:49:53.697619	active	3
1476	2025-08-01 00:51:19.769404	active	3
1477	2025-08-01 00:51:50.928114	active	3
1014	2025-07-31 11:28:57.259642	page_view	5
1022	2025-07-31 11:29:12.413726	page_view	5
1026	2025-07-31 11:29:27.688963	page_view	5
1032	2025-07-31 11:29:43.131238	page_view	5
1373	2025-07-31 14:11:22.464172	active	1
1374	2025-07-31 14:13:24.756385	active	1
1469	2025-08-01 00:48:52.03725	active	3
1017	2025-07-31 11:28:57.476182	page_view	5
1018	2025-07-31 11:29:04.617262	page_view	2
1021	2025-07-31 11:29:12.343407	page_view	5
1027	2025-07-31 11:29:27.69049	page_view	5
1034	2025-07-31 11:29:43.123242	page_view	5
1378	2025-07-31 14:20:39.166187	page_view	2
1380	2025-07-31 14:21:40.013914	page_view	4
1388	2025-07-31 14:24:28.587621	page_view	4
1019	2025-07-31 11:29:09.030774	active	2
1379	2025-07-31 14:20:48.341633	page_view	4
1381	2025-07-31 14:21:40.013914	page_view	4
1382	2025-07-31 14:21:44.970459	page_view	4
1387	2025-07-31 14:24:28.419308	page_view	4
1024	2025-07-31 11:29:15.362537	page_view	2
1383	2025-07-31 14:21:44.970459	page_view	4
1025	2025-07-31 11:29:17.039393	active	2
1038	2025-07-31 11:31:01.4032	active	2
1039	2025-07-31 11:31:41.350435	active	2
1040	2025-07-31 11:32:03.290482	active	2
1041	2025-07-31 11:32:11.841326	active	2
1042	2025-07-31 11:32:37.056835	page_view	2
1043	2025-07-31 11:32:38.809752	active	2
1044	2025-07-31 11:32:52.935992	page_view	2
1045	2025-07-31 11:32:53.892032	active	2
1046	2025-07-31 11:33:25.467261	active	2
1047	2025-07-31 11:33:33.239005	page_view	2
1048	2025-07-31 11:33:35.692181	active	2
1049	2025-07-31 11:34:15.69309	page_view	2
1050	2025-07-31 11:34:36.884243	active	2
1051	2025-07-31 11:35:06.789971	active	2
1052	2025-07-31 11:35:22.474477	login	5
1053	2025-07-31 11:35:28.312023	page_view	5
1054	2025-07-31 11:35:36.754964	active	2
1055	2025-07-31 11:35:47.410615	page_view	5
1056	2025-07-31 11:35:49.849883	page_view	5
1057	2025-07-31 11:35:49.876627	page_view	5
1058	2025-07-31 11:36:52.166574	active	2
1059	2025-07-31 11:36:59.326573	page_view	2
1060	2025-07-31 11:37:01.003821	active	2
1061	2025-07-31 11:37:02.867226	active	2
1062	2025-07-31 11:37:20.426193	page_view	5
1063	2025-07-31 11:37:29.869866	page_view	5
1064	2025-07-31 11:37:29.913345	page_view	5
1065	2025-07-31 11:37:32.146975	active	2
1066	2025-07-31 11:37:33.604511	page_view	5
1067	2025-07-31 11:37:33.705861	page_view	5
1068	2025-07-31 11:37:34.106034	page_view	5
1069	2025-07-31 11:37:46.175754	page_view	5
1070	2025-07-31 11:37:46.208614	page_view	5
1071	2025-07-31 11:37:46.323072	page_view	5
1072	2025-07-31 11:37:46.493187	page_view	5
1073	2025-07-31 11:37:53.866404	order	5
1074	2025-07-31 11:38:01.892549	page_view	5
1075	2025-07-31 11:38:01.906156	page_view	5
1076	2025-07-31 11:38:02.008925	page_view	5
1077	2025-07-31 11:38:02.122676	page_view	5
1078	2025-07-31 11:38:02.143628	page_view	5
1079	2025-07-31 11:38:08.088693	page_view	5
1080	2025-07-31 11:38:08.183253	page_view	5
1081	2025-07-31 11:38:08.490057	page_view	5
1082	2025-07-31 11:38:09.264765	page_view	5
1083	2025-07-31 11:38:10.343836	active	2
1084	2025-07-31 11:38:09.733692	page_view	5
1085	2025-07-31 11:38:11.69539	page_view	5
1086	2025-07-31 11:38:35.403641	active	2
1087	2025-07-31 11:38:35.785408	page_view	4
1088	2025-07-31 11:38:39.053945	page_view	4
1089	2025-07-31 11:38:39.277347	page_view	4
1090	2025-07-31 11:38:40.483793	active	2
1091	2025-07-31 11:38:49.256427	page_view	4
1092	2025-07-31 11:39:39.411066	page_view	1
1093	2025-07-31 11:40:06.033991	login	4
1094	2025-07-31 11:40:11.433627	page_view	4
1095	2025-07-31 11:40:35.150245	page_view	2
1096	2025-07-31 11:40:37.681814	active	2
1097	2025-07-31 11:40:42.273372	page_view	2
1098	2025-07-31 11:41:15.945302	active	2
1099	2025-07-31 11:41:46.043962	active	2
1100	2025-07-31 11:42:16.705797	active	2
1101	2025-07-31 11:42:29.27086	page_view	2
1102	2025-07-31 11:42:32.081062	active	2
1103	2025-07-31 11:42:59.549341	active	2
1104	2025-07-31 11:43:38.407708	active	2
1105	2025-07-31 11:43:57.184322	active	2
1106	2025-07-31 11:44:11.535334	login	5
1107	2025-07-31 11:44:28.120534	page_view	5
1108	2025-07-31 11:44:43.505708	login	4
1109	2025-07-31 11:44:50.305317	page_view	4
1110	2025-07-31 11:44:50.27976	page_view	4
1111	2025-07-31 11:44:58.454745	page_view	4
1112	2025-07-31 11:44:58.467621	page_view	4
1113	2025-07-31 11:44:58.571424	page_view	4
1114	2025-07-31 11:45:23.825395	page_view	4
1115	2025-07-31 11:45:23.825395	page_view	4
1116	2025-07-31 11:45:23.825395	page_view	4
1117	2025-07-31 11:45:24.130875	page_view	4
1118	2025-07-31 11:45:37.824532	active	2
1119	2025-07-31 11:45:45.251198	page_view	2
1120	2025-07-31 11:45:47.427368	active	2
1121	2025-07-31 11:46:29.112987	login	1
1122	2025-07-31 11:46:34.441415	page_view	1
1123	2025-07-31 11:46:42.49312	active	2
1124	2025-07-31 11:46:52.469214	page_view	1
1125	2025-07-31 11:46:52.472209	page_view	1
1126	2025-07-31 11:46:53.130764	login	1
1127	2025-07-31 11:47:16.403616	login	3
1128	2025-07-31 11:47:23.81959	page_view	3
1129	2025-07-31 11:47:24.477399	page_view	3
1130	2025-07-31 11:47:25.375103	login	3
1131	2025-07-31 11:47:32.825897	active	3
1132	2025-07-31 11:47:32.953936	page_view	3
1133	2025-07-31 11:47:34.849365	page_view	3
1134	2025-07-31 11:48:04.50548	active	2
1135	2025-07-31 11:48:10.426916	active	3
1136	2025-07-31 11:48:14.949015	page_view	3
1137	2025-07-31 11:48:35.122159	page_view	1
1138	2025-07-31 11:48:35.156314	page_view	1
1139	2025-07-31 11:48:35.134127	page_view	1
1140	2025-07-31 11:48:35.458331	page_view	1
1141	2025-07-31 11:48:35.619487	page_view	1
1142	2025-07-31 11:48:38.783863	page_view	1
1143	2025-07-31 11:48:38.906885	page_view	1
1144	2025-07-31 11:48:39.417117	page_view	1
1145	2025-07-31 11:48:40.095496	active	3
1146	2025-07-31 11:48:40.219716	page_view	1
1147	2025-07-31 11:48:41.316227	page_view	1
1148	2025-07-31 11:48:42.296741	page_view	1
1149	2025-07-31 11:48:42.579992	page_view	1
1150	2025-07-31 11:50:00.361732	active	3
1151	2025-07-31 11:50:05.536091	page_view	3
1152	2025-07-31 11:50:50.186359	page_view	2
1153	2025-07-31 11:50:51.982413	active	3
1154	2025-07-31 11:50:55.156321	page_view	2
1155	2025-07-31 11:51:07.870771	page_view	2
1156	2025-07-31 11:51:11.433013	page_view	2
1157	2025-07-31 11:51:15.53289	login	1
1158	2025-07-31 11:51:21.141533	page_view	1
1159	2025-07-31 11:51:21.282815	page_view	1
1160	2025-07-31 11:51:30.15287	active	1
1161	2025-07-31 11:51:53.56872	page_view	1
1162	2025-07-31 11:51:56.09277	page_view	1
1384	2025-07-31 14:21:44.996254	page_view	4
1385	2025-07-31 14:24:28.308008	page_view	4
1163	2025-07-31 11:52:00.160407	active	1
1164	2025-07-31 11:52:45.42277	active	1
1165	2025-07-31 11:53:15.717188	active	1
1166	2025-07-31 11:53:46.868464	active	1
1167	2025-07-31 11:54:19.625193	active	1
1386	2025-07-31 14:24:28.400045	page_view	4
1168	2025-07-31 11:57:28.237881	active	2
1173	2025-07-31 11:58:29.026416	page_view	4
1389	2025-07-31 15:01:18.070934	page_view	1
1169	2025-07-31 11:57:50.743191	page_view	4
1170	2025-07-31 11:57:56.612429	page_view	4
1174	2025-07-31 11:58:29.071615	page_view	4
1390	2025-07-31 15:01:18.101232	page_view	1
1171	2025-07-31 11:57:56.77343	page_view	4
1172	2025-07-31 11:58:28.98395	page_view	4
1175	2025-07-31 11:59:27.100589	page_view	4
1176	2025-07-31 11:59:27.227472	page_view	4
1177	2025-07-31 11:59:27.256636	page_view	4
1178	2025-07-31 11:59:31.526311	page_view	4
1180	2025-07-31 12:02:47.382275	active	2
1181	2025-07-31 12:06:41.838244	active	2
1184	2025-07-31 12:15:28.08344	active	2
1186	2025-07-31 12:15:56.827711	page_view	4
1188	2025-07-31 12:15:57.117742	page_view	4
1191	2025-07-31 12:16:15.499332	page_view	4
1193	2025-07-31 12:16:15.751233	page_view	4
1197	2025-07-31 12:16:50.549868	page_view	4
1198	2025-07-31 12:16:50.592316	page_view	4
1202	2025-07-31 12:16:54.806486	page_view	4
1391	2025-07-31 15:01:18.233418	page_view	1
1393	2025-07-31 15:07:24.614841	page_view	1
1396	2025-07-31 15:08:40.594664	page_view	1
1399	2025-07-31 15:14:03.818813	active	1
1406	2025-07-31 15:21:59.175942	active	1
1179	2025-07-31 12:00:22.194979	active	1
1182	2025-07-31 12:12:40.654822	active	1
1183	2025-07-31 12:13:12.321524	active	1
1185	2025-07-31 12:15:56.79985	page_view	4
1187	2025-07-31 12:15:56.925393	page_view	4
1189	2025-07-31 12:15:57.338423	page_view	4
1190	2025-07-31 12:16:15.443035	page_view	4
1192	2025-07-31 12:16:15.532406	page_view	4
1194	2025-07-31 12:16:15.9032	page_view	4
1195	2025-07-31 12:16:19.557954	page_view	4
1196	2025-07-31 12:16:50.546328	page_view	4
1199	2025-07-31 12:16:50.88341	page_view	4
1200	2025-07-31 12:16:50.917716	page_view	4
1201	2025-07-31 12:16:54.609554	page_view	4
1203	2025-07-31 12:17:00.01249	page_view	4
1204	2025-07-31 12:17:00.01249	page_view	4
1205	2025-07-31 12:17:00.386574	page_view	4
1206	2025-07-31 12:17:01.801551	page_view	4
1207	2025-07-31 12:17:03.034241	page_view	4
1208	2025-07-31 12:17:03.986559	page_view	4
1209	2025-07-31 12:17:04.217219	page_view	4
1210	2025-07-31 12:17:04.751293	page_view	4
1211	2025-07-31 12:17:17.070763	page_view	4
1212	2025-07-31 12:17:17.049407	page_view	4
1213	2025-07-31 12:17:17.169624	page_view	4
1214	2025-07-31 12:17:17.336037	page_view	4
1215	2025-07-31 12:17:17.444107	page_view	4
1216	2025-07-31 12:17:21.29685	page_view	4
1217	2025-07-31 12:17:21.447706	page_view	4
1218	2025-07-31 12:17:21.589295	page_view	4
1219	2025-07-31 12:17:21.701446	page_view	4
1220	2025-07-31 12:17:28.049285	page_view	4
1221	2025-07-31 12:17:28.049285	page_view	4
1222	2025-07-31 12:17:28.168243	page_view	4
1223	2025-07-31 12:17:28.342259	page_view	4
1224	2025-07-31 12:17:28.373081	page_view	4
1225	2025-07-31 12:17:32.420692	active	1
1226	2025-07-31 12:17:32.307397	page_view	4
1227	2025-07-31 12:17:32.425956	page_view	4
1228	2025-07-31 12:17:32.527789	page_view	4
1229	2025-07-31 12:17:32.960224	page_view	4
1230	2025-07-31 12:17:33.225854	page_view	4
1231	2025-07-31 12:17:37.654285	active	2
1232	2025-07-31 12:17:39.407868	page_view	4
1233	2025-07-31 12:17:39.439858	page_view	4
1234	2025-07-31 12:17:39.521443	page_view	4
1235	2025-07-31 12:17:40.145109	page_view	4
1236	2025-07-31 12:17:41.783035	page_view	4
1237	2025-07-31 12:17:43.516987	page_view	4
1238	2025-07-31 12:17:43.6269	page_view	4
1239	2025-07-31 12:17:43.877492	page_view	4
1240	2025-07-31 12:17:44.393445	page_view	4
1241	2025-07-31 12:17:46.027382	page_view	4
1242	2025-07-31 12:17:47.783883	page_view	4
1392	2025-07-31 15:07:24.585638	page_view	1
.


--
-- Data for Name: user_coupon_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_coupon_usage (id, used_at, discount_id, user_id) FROM stdin;
1	2025-07-31 09:25:08.80548	1	1
2	2025-07-31 10:37:17.885386	1	4
3	2025-07-31 11:22:10.345667	1	5
.


--
-- Data for Name: user_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_order (id, delivery_fee, order_code, order_date, updated_date, address_id, delivery_method_id, delivery_service_id, discount_id, saved_card_id, user_id, user_discount_id) FROM stdin;
1	80.14	#I90145	2025-07-31 09:25:08.487981	2025-07-31 10:32:49.60955	4	N	2	1	1	1	N
2	193.06	#L69490	2025-07-31 09:26:32.275669	2025-07-31 10:33:18.962985	4	N	1	N	1	1	N
4	425.24	#N59822	2025-07-31 11:00:15.867171	2025-07-31 11:16:41.944482	8	N	3	N	2	4	N
5	407.87	#P98785	2025-07-31 11:22:09.998195	2025-07-31 11:22:09.998195	9	N	3	1	3	5	N
3	147.60	#M96813	2025-07-31 10:37:17.402569	2025-07-31 11:35:34.653561	5	N	1	1	2	4	N
6	407.87	#S16085	2025-07-31 11:37:53.167243	2025-07-31 11:37:53.167243	9	N	3	N	3	5	3
7	147.60	#U64281	2025-07-31 13:08:14.215114	2025-07-31 13:08:14.215114	5	N	1	N	2	4	N
.


--
-- Data for Name: user_order_has_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_order_has_product (id, quantity, unit_price, product_id, variant_id, user_order_id, status, discount_rule_id) FROM stdin;
1	2	1496000	9	N	1	1	N
2	3	2508000	3	4	2	1	N
3	1	2376000	11	70	3	1	N
4	1	1496000	9	N	3	1	N
5	1	1496000	9	N	4	1	N
6	1	2508000	3	4	4	1	N
7	1	1056000	4	58	5	1	N
8	1	1683000	2	3	6	1	9
9	1	1408000	10	67	7	1	N
.


--
-- Data for Name: user_point_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_point_history (id, created_at, points, status, order_id, user_id) FROM stdin;
1	2025-07-31 09:25:08.841174	2992	1	1	1
2	2025-07-31 09:26:32.534404	7524	1	2	1
3	2025-07-31 10:37:17.932964	3872	1	3	4
4	2025-07-31 11:00:16.474108	4004	1	4	4
5	2025-07-31 11:22:10.396415	1056	1	5	5
6	2025-07-31 11:37:53.549824	1683	1	6	5
7	2025-07-31 13:08:14.583817	1408	1	7	4
.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, end_time, ip_address, is_bounce, last_activity, page_count, session_id, start_time, user_agent, user_id) FROM stdin;
1	2025-07-31 09:38:01.535699	127.0.0.1	t	2025-07-31 09:29:22.282452	0	session_1753930758805_hf4s6ze2y	2025-07-31 09:29:22.282452	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1
2	2025-07-31 09:38:02.272827	127.0.0.1	t	2025-07-31 09:38:01.611498	0	session_1753931206005_73t9p1g6r	2025-07-31 09:38:01.611498	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1
7	2025-07-31 09:47:03.692096	127.0.0.1	t	2025-07-31 09:47:03.301649	1	session_1753931814022_97m8fm5i3	2025-07-31 09:47:02.847864	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1
9	2025-07-31 10:38:39.917471	127.0.0.1	t	2025-07-31 10:28:36.972207	0	session_1753934301275_hn688d6lv	2025-07-31 10:28:36.972207	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4
10	2025-07-31 10:38:45.978513	127.0.0.1	t	2025-07-31 10:38:45.085471	1	session_1753934903952_qmerfky7s	2025-07-31 10:38:39.998513	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	4
15	N	127.0.0.1	t	2025-07-31 11:39:39.464733	0	session_1753938509036_92n31xrun	2025-07-31 11:39:39.464733	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	1
.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, created_date, date_of_birth, email, gender, last_login, name, order_count, otp_code, otp_expiry, password, phone_number, profile_image, reset_token, status, total_points, is_verified, role_id, phone_verified) FROM stdin;
2	2025-07-30 21:57:11.447779	2001-12-02	ei4482847@gmail.com	female	2025-07-31 01:37:11.806364	Ei Kyaw	0	567376	2025-07-30 22:32:52.017274	$2a$10$7/E3aUqck4nduWe8RzTikuI2D/NRSS3ufiDtBMELuXQoVNPlcSDEu	N	/uploads/1753890804690_Image_7.jpg	N	ACTIVE	N	t	1	f
5	2025-07-31 00:08:43.170844	2004-10-12	kyaw112412@gmail.com	MALE	2025-07-31 11:44:14.836261	Kyaw Kyaw	2	448329	2025-07-31 00:18:43.11183	$2a$10$af2S10ePjK3rIKOnkReveOfmPC6C6aSO8Sb26yJ9aBY7176IhElWi	09298370027	/uploads/1753937936327_naafiri-glizzy-skin-lol-splash-art-8k-wallpaper-uhdpaper.com-20@5@e.jpg	N	ACTIVE	2739	t	6	f
3	2025-07-30 23:22:58.615455	2004-04-05	htooaungyeyint65@gmail.com	male	2025-07-31 11:47:28.794679	htoo aung	0	422851	2025-07-30 23:32:58.599789	$2a$10$Q2UpdMU0KpopwpNrOlugGeeqBfsvURXjBL5i9kW9oVtiw9GikMjc2	N	/upload/defaultProfile.png	N	ACTIVE	N	t	1	f
1	2025-07-30 21:20:42.800362	2006-05-11	isjustmarc06@gmail.com	MALE	2025-07-31 11:51:18.234153	pmk	2	039702	2025-07-30 21:30:42.668912	$2a$10$GOYlrhNzzZqhav0pgDefnunk1E2P7OtmRycr87RdMvhklhN6k7SDK	09966466855	/uploads/1753930750382_Screenshot_23-7-2025_145052_localhost.jpeg	N	ACTIVE	59999	t	1	f
4	2025-07-31 00:00:47.35014	2006-05-11	chomiemie17@gmail.com	MALE	2025-07-31 11:44:46.754699	Marc	3	539057	2025-07-31 00:10:47.262713	$2a$10$pzKLZPNLrAck6aA/fKy8guikgMp/3ZLEmyCAZOnutA4h4mKmis47W	09298370027	/uploads/1753934227213_wp7955474.webp	N	ACTIVE	9284	t	6	f
.


--
-- Data for Name: variant_attribute_value; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.variant_attribute_value (id, attribute_value_id, product_variants_id) FROM stdin;
1	1	1
2	2	2
3	2	3
4	4	4
7	1	7
9	1	9
10	3	10
12	3	12
13	4	13
15	4	16
16	4	15
18	4	19
19	6	18
22	6	21
23	7	22
24	7	25
25	7	24
26	7	26
27	7	27
28	7	28
51	4	11
54	7	20
67	7	23
68	1	5
69	3	6
70	4	8
71	6	14
72	7	17
73	8	58
74	10	59
75	1	60
76	14	61
77	10	62
78	16	63
79	1	64
80	1	65
81	4	66
82	14	67
83	1	68
84	12	69
85	14	70
86	1	71
87	14	72
88	2	73
.


--
-- Data for Name: verification_token; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_token (id, expiry_date, token, user_id) FROM stdin;
.


--
-- Data for Name: vip_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vip_tiers (id, benefits, color, description, icon, min_points, name, tier_order, weight) FROM stdin;
1	N	text-blue-400	Standard customers with no VIP benefits	user	0	Regular	0	0
2	N	text-gray-700	Entry VIP tier with basic benefits	star	10000	Silver	1	0
3	N	text-yellow-700	Premium tier with enhanced perks	award	100000	Gold	2	0
4	N	text-purple-700	Elite tier with premium benefits	crown	1000000	Platinum	3	0
.


--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist (id, status, wishlist_date, product_id, user_id) FROM stdin;
1	1	2025-07-31 10:21:34.891617	11	4
2	1	2025-07-31 10:42:45.10645	4	4
3	1	2025-07-31 11:15:42.289834	12	5
4	1	2025-07-31 20:50:40.816507	9	4
5	1	2025-07-31 20:50:41.118922	9	4
.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-07-30 14:07:49
20211116045059	2025-07-30 14:07:49
20211116050929	2025-07-30 14:07:49
20211116051442	2025-07-30 14:07:49
20211116212300	2025-07-30 14:07:49
20211116213355	2025-07-30 14:07:49
20211116213934	2025-07-30 14:07:49
20211116214523	2025-07-30 14:07:49
20211122062447	2025-07-30 14:07:49
20211124070109	2025-07-30 14:07:50
20211202204204	2025-07-30 14:07:50
20211202204605	2025-07-30 14:07:50
20211210212804	2025-07-30 14:07:50
20211228014915	2025-07-30 14:07:50
20220107221237	2025-07-30 14:07:50
20220228202821	2025-07-30 14:07:50
20220312004840	2025-07-30 14:07:50
20220603231003	2025-07-30 14:07:50
20220603232444	2025-07-30 14:07:50
20220615214548	2025-07-30 14:07:50
20220712093339	2025-07-30 14:07:50
20220908172859	2025-07-30 14:07:50
20220916233421	2025-07-30 14:07:50
20230119133233	2025-07-30 14:07:50
20230128025114	2025-07-30 14:07:50
20230128025212	2025-07-30 14:07:50
20230227211149	2025-07-30 14:07:50
20230228184745	2025-07-30 14:07:50
20230308225145	2025-07-30 14:07:50
20230328144023	2025-07-30 14:07:50
20231018144023	2025-07-30 14:07:50
20231204144023	2025-07-30 14:07:50
20231204144024	2025-07-30 14:07:50
20231204144025	2025-07-30 14:07:50
20240108234812	2025-07-30 14:07:50
20240109165339	2025-07-30 14:07:50
20240227174441	2025-07-30 14:07:50
20240311171622	2025-07-30 14:07:50
20240321100241	2025-07-30 14:07:50
20240401105812	2025-07-30 14:07:50
20240418121054	2025-07-30 14:07:50
20240523004032	2025-07-30 14:07:50
20240618124746	2025-07-30 14:07:50
20240801235015	2025-07-30 14:07:50
20240805133720	2025-07-30 14:07:50
20240827160934	2025-07-30 14:07:50
20240919163303	2025-07-30 14:07:50
20240919163305	2025-07-30 14:07:50
20241019105805	2025-07-30 14:07:50
20241030150047	2025-07-30 14:07:50
20241108114728	2025-07-30 14:07:50
20241121104152	2025-07-30 14:07:50
20241130184212	2025-07-30 14:07:50
20241220035512	2025-07-30 14:07:50
20241220123912	2025-07-30 14:07:50
20241224161212	2025-07-30 14:07:50
20250107150512	2025-07-30 14:07:50
20250110162412	2025-07-30 14:07:50
20250123174212	2025-07-30 14:07:50
20250128220012	2025-07-30 14:07:50
20250506224012	2025-07-30 14:07:50
20250523164012	2025-07-30 14:07:50
20250714121412	2025-07-30 14:07:51
.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-07-30 14:07:47.181036
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-07-30 14:07:47.191726
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-07-30 14:07:47.194529
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-07-30 14:07:47.23461
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-07-30 14:07:47.249922
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-07-30 14:07:47.252872
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-07-30 14:07:47.256513
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-07-30 14:07:47.259665
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-07-30 14:07:47.262414
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-07-30 14:07:47.265411
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-07-30 14:07:47.268987
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-07-30 14:07:47.272572
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-07-30 14:07:47.280484
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-07-30 14:07:47.283394
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-07-30 14:07:47.28635
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-07-30 14:07:47.308176
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-07-30 14:07:47.312027
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-07-30 14:07:47.315096
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-07-30 14:07:47.319184
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-07-30 14:07:47.323348
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-07-30 14:07:47.326822
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-07-30 14:07:47.333311
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-07-30 14:07:47.344651
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-07-30 14:07:47.354575
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-07-30 14:07:47.359875
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-07-30 14:07:47.363151
.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 150, true);


--
-- Name: address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.address_id_seq', 9, true);


--
-- Name: attribute_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attribute_id_seq', 1, true);


--
-- Name: attribute_value_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attribute_value_id_seq', 16, true);


--
-- Name: blocked_ips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocked_ips_id_seq', 1, true);


--
-- Name: brand_has_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brand_has_category_id_seq', 55, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brand_id_seq', 12, true);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_id_seq', 8, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 1, false);


--
-- Name: delivery_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_method_id_seq', 1, false);


--
-- Name: delivery_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_service_id_seq', 3, true);


--
-- Name: discount_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_event_id_seq', 1, false);


--
-- Name: discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_id_seq', 13, true);


--
-- Name: discount_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_rule_id_seq', 22, true);


--
-- Name: event_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_product_id_seq', 79, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 4, true);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_attempts_id_seq', 41, true);


--
-- Name: news_letter_subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_letter_subscriber_id_seq', 1, false);


--
-- Name: notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_id_seq', 98, true);


--
-- Name: order_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_status_id_seq', 16, true);


--
-- Name: otp_verification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_verification_id_seq', 8, true);


--
-- Name: permission_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permission_category_id_seq', 14, true);


--
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permission_id_seq', 59, true);


--
-- Name: policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.policies_id_seq', 1, false);


--
-- Name: product_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_discount_id_seq', 1, false);


--
-- Name: product_has_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_has_category_id_seq', 38, true);


--
-- Name: product_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_image_id_seq', 188, true);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 73, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 12, true);


--
-- Name: purchase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_id_seq', 1, false);


--
-- Name: purchase_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_products_id_seq', 1, false);


--
-- Name: refresh_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_token_id_seq', 5, true);


--
-- Name: refunds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refunds_id_seq', 1, false);


--
-- Name: reset_password_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reset_password_request_id_seq', 1, false);


--
-- Name: return_request_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.return_request_image_id_seq', 1, false);


--
-- Name: return_request_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.return_request_products_id_seq', 1, false);


--
-- Name: return_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.return_requests_id_seq', 3, true);


--
-- Name: revenue_target_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.revenue_target_id_seq', 1, true);


--
-- Name: review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_id_seq', 2, true);


--
-- Name: review_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_media_id_seq', 2, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_id_seq', 6, true);


--
-- Name: role_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permission_id_seq', 59, true);


--
-- Name: role_permission_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permission_log_id_seq', 2, true);


--
-- Name: saved_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_cards_id_seq', 3, true);


--
-- Name: security_policy_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.security_policy_rule_id_seq', 3, true);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.status_id_seq', 7, true);


--
-- Name: test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_id_seq', 1, false);


--
-- Name: user_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_activity_id_seq', 1478, true);


--
-- Name: user_coupon_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_coupon_usage_id_seq', 3, true);


--
-- Name: user_order_has_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_order_has_product_id_seq', 9, true);


--
-- Name: user_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_order_id_seq', 7, true);


--
-- Name: user_point_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_point_history_id_seq', 7, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: variant_attribute_value_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.variant_attribute_value_id_seq', 88, true);


--
-- Name: verification_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.verification_token_id_seq', 1, false);


--
-- Name: vip_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vip_tiers_id_seq', 1, false);


--
-- Name: wishlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wishlist_id_seq', 5, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: address address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address
    ADD CONSTRAINT address_pkey PRIMARY KEY (id);


--
-- Name: appeals appeals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_pkey PRIMARY KEY (id);


--
-- Name: attribute attribute_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute
    ADD CONSTRAINT attribute_pkey PRIMARY KEY (id);


--
-- Name: attribute_value attribute_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_value
    ADD CONSTRAINT attribute_value_pkey PRIMARY KEY (id);


--
-- Name: blacklist_entries blacklist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklist_entries
    ADD CONSTRAINT blacklist_entries_pkey PRIMARY KEY (id);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);


--
-- Name: brand_has_category brand_has_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_has_category
    ADD CONSTRAINT brand_has_category_pkey PRIMARY KEY (id);


--
-- Name: brand brand_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand
    ADD CONSTRAINT brand_pkey PRIMARY KEY (id);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: delivery_method delivery_method_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_method
    ADD CONSTRAINT delivery_method_pkey PRIMARY KEY (id);


--
-- Name: delivery_service delivery_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_service
    ADD CONSTRAINT delivery_service_pkey PRIMARY KEY (id);


--
-- Name: discount_event discount_event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_event
    ADD CONSTRAINT discount_event_pkey PRIMARY KEY (id);


--
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (id);


--
-- Name: discount_rule discount_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT discount_rule_pkey PRIMARY KEY (id);


--
-- Name: event_product event_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_product
    ADD CONSTRAINT event_product_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: news_letter_subscriber news_letter_subscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_letter_subscriber
    ADD CONSTRAINT news_letter_subscriber_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: order_status order_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT order_status_pkey PRIMARY KEY (id);


--
-- Name: otp_verification otp_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verification
    ADD CONSTRAINT otp_verification_pkey PRIMARY KEY (id);


--
-- Name: permission_category permission_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_category
    ADD CONSTRAINT permission_category_pkey PRIMARY KEY (id);


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: product_discount product_discount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT product_discount_pkey PRIMARY KEY (id);


--
-- Name: product_has_category product_has_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_has_category
    ADD CONSTRAINT product_has_category_pkey PRIMARY KEY (id);


--
-- Name: product_image product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_pkey PRIMARY KEY (id);


--
-- Name: purchase_products purchase_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_products
    ADD CONSTRAINT purchase_products_pkey PRIMARY KEY (id);


--
-- Name: refresh_token refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: reset_password_request reset_password_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reset_password_request
    ADD CONSTRAINT reset_password_request_pkey PRIMARY KEY (id);


--
-- Name: return_request_image return_request_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_request_image
    ADD CONSTRAINT return_request_image_pkey PRIMARY KEY (id);


--
-- Name: return_request_products return_request_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_request_products
    ADD CONSTRAINT return_request_products_pkey PRIMARY KEY (id);


--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- Name: revenue_target revenue_target_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_target
    ADD CONSTRAINT revenue_target_pkey PRIMARY KEY (id);


--
-- Name: review_media review_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_pkey PRIMARY KEY (id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- Name: role_permission_log role_permission_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission_log
    ADD CONSTRAINT role_permission_log_pkey PRIMARY KEY (id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: saved_cards saved_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_cards
    ADD CONSTRAINT saved_cards_pkey PRIMARY KEY (id);


--
-- Name: security_policy_rule security_policy_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_policy_rule
    ADD CONSTRAINT security_policy_rule_pkey PRIMARY KEY (id);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (id);


--
-- Name: test test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: delivery_service uk1vtd4p26rmq26ac77mi956t48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_service
    ADD CONSTRAINT uk1vtd4p26rmq26ac77mi956t48 UNIQUE (address_id);


--
-- Name: news_letter_subscriber uk3vbob384yxw68fygp0mwae7vb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_letter_subscriber
    ADD CONSTRAINT uk3vbob384yxw68fygp0mwae7vb UNIQUE (email);


--
-- Name: delivery_method uk52t456hatfdmbdb8ghk7woc31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_method
    ADD CONSTRAINT uk52t456hatfdmbdb8ghk7woc31 UNIQUE (name);


--
-- Name: users uk6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: vip_tiers uka067a2kaklgxolbhh23wa64g; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vip_tiers
    ADD CONSTRAINT uka067a2kaklgxolbhh23wa64g UNIQUE (name);


--
-- Name: user_sessions ukbjoac5vd2jt3pnrfrdeb49014; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT ukbjoac5vd2jt3pnrfrdeb49014 UNIQUE (session_id);


--
-- Name: permission uke7p7xo1fna7sch077bidykjtt; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT uke7p7xo1fna7sch077bidykjtt UNIQUE (key);


--
-- Name: refresh_token ukf95ixxe7pa48ryn1awmh2evt7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT ukf95ixxe7pa48ryn1awmh2evt7 UNIQUE (user_id);


--
-- Name: permission_category ukhogfescx9t0h7dorq2lt4u8iw; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_category
    ADD CONSTRAINT ukhogfescx9t0h7dorq2lt4u8iw UNIQUE (key);


--
-- Name: discount uki14w897ofrtv43vbx44rtv01u; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT uki14w897ofrtv43vbx44rtv01u UNIQUE (code);


--
-- Name: refunds ukpugytmqwnet9smivxxv2gfv1o; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT ukpugytmqwnet9smivxxv2gfv1o UNIQUE (return_request_id);


--
-- Name: verification_token ukq6jibbenp7o9v6tq178xg88hg; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_token
    ADD CONSTRAINT ukq6jibbenp7o9v6tq178xg88hg UNIQUE (user_id);


--
-- Name: status ukreccgx9nr0a8dwv201t44l6pd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT ukreccgx9nr0a8dwv201t44l6pd UNIQUE (name);


--
-- Name: role_permission ukt49nxpqax9cveurs8f61sns2d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT ukt49nxpqax9cveurs8f61sns2d UNIQUE (role_id, permission_id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_coupon_usage user_coupon_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coupon_usage
    ADD CONSTRAINT user_coupon_usage_pkey PRIMARY KEY (id);


--
-- Name: user_order_has_product user_order_has_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order_has_product
    ADD CONSTRAINT user_order_has_product_pkey PRIMARY KEY (id);


--
-- Name: user_order user_order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT user_order_pkey PRIMARY KEY (id);


--
-- Name: user_point_history user_point_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_point_history
    ADD CONSTRAINT user_point_history_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_attribute_value variant_attribute_value_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attribute_value
    ADD CONSTRAINT variant_attribute_value_pkey PRIMARY KEY (id);


--
-- Name: verification_token verification_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_token
    ADD CONSTRAINT verification_token_pkey PRIMARY KEY (id);


--
-- Name: vip_tiers vip_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vip_tiers
    ADD CONSTRAINT vip_tiers_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: product_image fk1n91c4vdhw8pa4frngs4qbbvs; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT fk1n91c4vdhw8pa4frngs4qbbvs FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: delivery_service fk2f7wy5mxxavu9sxbaxqqm4px1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_service
    ADD CONSTRAINT fk2f7wy5mxxavu9sxbaxqqm4px1 FOREIGN KEY (address_id) REFERENCES public.address(id);


--
-- Name: category fk2y94svpmqttx80mshyny85wqr; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT fk2y94svpmqttx80mshyny85wqr FOREIGN KEY (parent_id) REFERENCES public.category(id);


--
-- Name: verification_token fk3asw9wnv76uxu3kr1ekq4i1ld; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_token
    ADD CONSTRAINT fk3asw9wnv76uxu3kr1ekq4i1ld FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_order_has_product fk3dqb0nlhsb6toa7c9uj4ae2qm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order_has_product
    ADD CONSTRAINT fk3dqb0nlhsb6toa7c9uj4ae2qm FOREIGN KEY (user_order_id) REFERENCES public.user_order(id);


--
-- Name: permission fk3ti9yayw8tlmcdoi7awsppnqa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT fk3ti9yayw8tlmcdoi7awsppnqa FOREIGN KEY (permission_category_id) REFERENCES public.permission_category(id);


--
-- Name: product_has_category fk3xfgteioo2s646d7ok4lo83en; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_has_category
    ADD CONSTRAINT fk3xfgteioo2s646d7ok4lo83en FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: user_order fk443h4uc3sc6nv6m2du0dt3j6e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fk443h4uc3sc6nv6m2du0dt3j6e FOREIGN KEY (delivery_method_id) REFERENCES public.delivery_method(id);


--
-- Name: users fk4qu1gr772nnf6ve5af002rwya; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk4qu1gr772nnf6ve5af002rwya FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- Name: attribute_value fk59xqw12tl928rqcdu2h9o6mau; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attribute_value
    ADD CONSTRAINT fk59xqw12tl928rqcdu2h9o6mau FOREIGN KEY (attribute_id) REFERENCES public.attribute(id);


--
-- Name: review fk6cpw2nlklblpvc7hyt7ko6v3e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT fk6cpw2nlklblpvc7hyt7ko6v3e FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: address fk6i66ijb8twgcqtetl8eeeed6v; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.address
    ADD CONSTRAINT fk6i66ijb8twgcqtetl8eeeed6v FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wishlist fk6p7qhvy1bfkri13u29x6pu8au; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT fk6p7qhvy1bfkri13u29x6pu8au FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: return_requests fk6pd9hi2rbbct43io2pgcma1sh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT fk6pd9hi2rbbct43io2pgcma1sh FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_order_has_product fk7oa35siw2w93bovvbsanca15n; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order_has_product
    ADD CONSTRAINT fk7oa35siw2w93bovvbsanca15n FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: product_discount fk8q5g6698ts6uqig91bmm3ukb7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT fk8q5g6698ts6uqig91bmm3ukb7 FOREIGN KEY (discount_id) REFERENCES public.discount(id);


--
-- Name: user_point_history fk99iqi31h9tq0p0nhsi4smlvw7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_point_history
    ADD CONSTRAINT fk99iqi31h9tq0p0nhsi4smlvw7 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: brand_has_category fk9s1lt567qap9m61a7102v4lw0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_has_category
    ADD CONSTRAINT fk9s1lt567qap9m61a7102v4lw0 FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: review fka5cmgpp2plp5oai84fkmbi63e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT fka5cmgpp2plp5oai84fkmbi63e FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: role_permission fka6jx8n8xkesmjmv6jqug6bg68; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fka6jx8n8xkesmjmv6jqug6bg68 FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- Name: user_coupon_usage fkai678gklmolcfoy9qq8lnn1ij; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coupon_usage
    ADD CONSTRAINT fkai678gklmolcfoy9qq8lnn1ij FOREIGN KEY (discount_id) REFERENCES public.discount(id);


--
-- Name: user_order_has_product fkb2nv8p5y7vsejc1fm1kqgb0gw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order_has_product
    ADD CONSTRAINT fkb2nv8p5y7vsejc1fm1kqgb0gw FOREIGN KEY (discount_rule_id) REFERENCES public.discount_rule(id);


--
-- Name: discount_rule fkb461d8wlwftywps1h2t565vro; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkb461d8wlwftywps1h2t565vro FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: user_order fkbbwlke5ei3gh1ki65yiiojmck; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fkbbwlke5ei3gh1ki65yiiojmck FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: return_request_products fkbyipkk1i4f0gdk9ba7kukqtue; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_request_products
    ADD CONSTRAINT fkbyipkk1i4f0gdk9ba7kukqtue FOREIGN KEY (order_product_id) REFERENCES public.user_order_has_product(id);


--
-- Name: saved_cards fkcje8fip8twvi6pfpd8ld34n5b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_cards
    ADD CONSTRAINT fkcje8fip8twvi6pfpd8ld34n5b FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: review_media fkerxk5xtek33im3r3nd8qoprik; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT fkerxk5xtek33im3r3nd8qoprik FOREIGN KEY (review_id) REFERENCES public.review(id);


--
-- Name: role_permission fkf8yllw1ecvwqy3ehyxawqa1qp; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fkf8yllw1ecvwqy3ehyxawqa1qp FOREIGN KEY (permission_id) REFERENCES public.permission(id);


--
-- Name: return_request_image fkfm0j12bimrf39wonrmdcqnqmo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_request_image
    ADD CONSTRAINT fkfm0j12bimrf39wonrmdcqnqmo FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id);


--
-- Name: discount_rule fkfnqfca5ndswkdldgrf2y30xo2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkfnqfca5ndswkdldgrf2y30xo2 FOREIGN KEY (vip_role) REFERENCES public.vip_tiers(id);


--
-- Name: discount_rule fkg4i6gaaai1dubh4c7e7s109de; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkg4i6gaaai1dubh4c7e7s109de FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_order fkgqvgnf1m0wd539nu6bq4m3ggt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fkgqvgnf1m0wd539nu6bq4m3ggt FOREIGN KEY (saved_card_id) REFERENCES public.saved_cards(id);


--
-- Name: product_has_category fkgruwv22p4ro4j7404sgbkkkqf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_has_category
    ADD CONSTRAINT fkgruwv22p4ro4j7404sgbkkkqf FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: variant_attribute_value fkhltuts8vms5ki15g770knr9cd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attribute_value
    ADD CONSTRAINT fkhltuts8vms5ki15g770knr9cd FOREIGN KEY (attribute_value_id) REFERENCES public.attribute_value(id);


--
-- Name: events fkipp0ue6bqm0rej7mqyio8pao4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fkipp0ue6bqm0rej7mqyio8pao4 FOREIGN KEY (discount_id) REFERENCES public.discount(id);


--
-- Name: event_product fkjm43yywayh25xybx3pqal8t0g; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_product
    ADD CONSTRAINT fkjm43yywayh25xybx3pqal8t0g FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: refresh_token fkjtx87i0jvq2svedphegvdwcuy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT fkjtx87i0jvq2svedphegvdwcuy FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_point_history fkka30fwslngjwmb0uf7082h9tw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_point_history
    ADD CONSTRAINT fkka30fwslngjwmb0uf7082h9tw FOREIGN KEY (order_id) REFERENCES public.user_order(id);


--
-- Name: discount_rule fkkm4ix39o5la9xy5hl96tnq06g; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkkm4ix39o5la9xy5hl96tnq06g FOREIGN KEY (discount_id) REFERENCES public.discount(id);


--
-- Name: user_order_has_product fkl0k95uqslxoi74fhpmrksm4u9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order_has_product
    ADD CONSTRAINT fkl0k95uqslxoi74fhpmrksm4u9 FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: discount fkl2695ctmlp3c766hpphs04b7t; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT fkl2695ctmlp3c766hpphs04b7t FOREIGN KEY (event_id) REFERENCES public.discount_event(id);


--
-- Name: products fkl2cyj2st6mjygl2pgwd057ivu; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fkl2cyj2st6mjygl2pgwd057ivu FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: user_order fklguxu9qa64s58y51e1371sxks; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fklguxu9qa64s58y51e1371sxks FOREIGN KEY (address_id) REFERENCES public.address(id);


--
-- Name: user_order fklmh31vmys97ada61ivmj1hwef; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fklmh31vmys97ada61ivmj1hwef FOREIGN KEY (delivery_service_id) REFERENCES public.delivery_service(id);


--
-- Name: discount_rule fkne8jgofm4xfa6t34idi5kf2ww; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkne8jgofm4xfa6t34idi5kf2ww FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: notification fknk4ftb5am9ubmkv1661h15ds9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT fknk4ftb5am9ubmkv1661h15ds9 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: return_request_products fknmisyqihub5r5u84wo76bf0gg; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_request_products
    ADD CONSTRAINT fknmisyqihub5r5u84wo76bf0gg FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id);


--
-- Name: purchase fkoj7ky1v8cf4ibkk0s7alikp52; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT fkoj7ky1v8cf4ibkk0s7alikp52 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: return_requests fkokxtfwka9tv6bpr6vjk5amon4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT fkokxtfwka9tv6bpr6vjk5amon4 FOREIGN KEY (order_id) REFERENCES public.user_order(id);


--
-- Name: variant_attribute_value fkorcneau4tf7j15fmdx5m301uy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attribute_value
    ADD CONSTRAINT fkorcneau4tf7j15fmdx5m301uy FOREIGN KEY (product_variants_id) REFERENCES public.product_variants(id);


--
-- Name: product_variants fkosqitn4s405cynmhb87lkvuau; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT fkosqitn4s405cynmhb87lkvuau FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_has_category fkp5rudhlih9kal71lu36nq7b5l; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_has_category
    ADD CONSTRAINT fkp5rudhlih9kal71lu36nq7b5l FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: order_status fkpd5emq6sqv1spp2ncmsixphey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT fkpd5emq6sqv1spp2ncmsixphey FOREIGN KEY (refund_id) REFERENCES public.refunds(id);


--
-- Name: order_status fkpwi6fhp93jaakulewa55t7v34; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT fkpwi6fhp93jaakulewa55t7v34 FOREIGN KEY (order_id) REFERENCES public.user_order(id);


--
-- Name: purchase_products fkpxcrl6rhacdcbm59wh09t7cj9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_products
    ADD CONSTRAINT fkpxcrl6rhacdcbm59wh09t7cj9 FOREIGN KEY (products_id) REFERENCES public.products(id);


--
-- Name: refunds fkqehniyfpap07s8iex18ua37i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fkqehniyfpap07s8iex18ua37i FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id);


--
-- Name: purchase_products fkquuf4xmoqfcnww0m8dl69wef0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_products
    ADD CONSTRAINT fkquuf4xmoqfcnww0m8dl69wef0 FOREIGN KEY (purchase_id) REFERENCES public.purchase(id);


--
-- Name: event_product fkqxg4e8f1wecxbt1unog69jrbd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_product
    ADD CONSTRAINT fkqxg4e8f1wecxbt1unog69jrbd FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: order_status fkr96ucilj9slv2avvcxqs6y72u; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status
    ADD CONSTRAINT fkr96ucilj9slv2avvcxqs6y72u FOREIGN KEY (status_id) REFERENCES public.status(id);


--
-- Name: discount_rule fkrctga108qoisvfaj9b0yd7n8a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_rule
    ADD CONSTRAINT fkrctga108qoisvfaj9b0yd7n8a FOREIGN KEY (brand_id) REFERENCES public.brand(id);


--
-- Name: return_requests fkrtk052drly1gfq61vo1meold8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT fkrtk052drly1gfq61vo1meold8 FOREIGN KEY (order_product_id) REFERENCES public.user_order_has_product(id);


--
-- Name: product_discount fks99ri5d4jjoih5i1n2wk6992f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount
    ADD CONSTRAINT fks99ri5d4jjoih5i1n2wk6992f FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: brand_has_category fks9wbaympk4xonkmqutj8o50e0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_has_category
    ADD CONSTRAINT fks9wbaympk4xonkmqutj8o50e0 FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: product_image fks9y86c8x9iv5bb7vu3vdgna0y; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT fks9y86c8x9iv5bb7vu3vdgna0y FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: user_coupon_usage fksi31ffxfrc2iv5k1ei4p62hoi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coupon_usage
    ADD CONSTRAINT fksi31ffxfrc2iv5k1ei4p62hoi FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_order fksvclj4dtddellnq8mgdt90eq8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_order
    ADD CONSTRAINT fksvclj4dtddellnq8mgdt90eq8 FOREIGN KEY (discount_id) REFERENCES public.discount(id);


--
-- Name: login_attempts fktg9vhke4mlf5vij2rcvfk2dg2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT fktg9vhke4mlf5vij2rcvfk2dg2 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: refunds fktqlc3jl62cpmbsvvtxe7sgjsi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fktqlc3jl62cpmbsvvtxe7sgjsi FOREIGN KEY (receive_card_id) REFERENCES public.saved_cards(id);


--
-- Name: wishlist fktrd6335blsefl2gxpb8lr0gr7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT fktrd6335blsefl2gxpb8lr0gr7 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE activity_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.activity_logs TO anon;
GRANT ALL ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;


--
-- Name: SEQUENCE activity_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.activity_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.activity_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.activity_logs_id_seq TO service_role;


--
-- Name: TABLE address; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.address TO anon;
GRANT ALL ON TABLE public.address TO authenticated;
GRANT ALL ON TABLE public.address TO service_role;


--
-- Name: SEQUENCE address_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.address_id_seq TO anon;
GRANT ALL ON SEQUENCE public.address_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.address_id_seq TO service_role;


--
-- Name: TABLE appeals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.appeals TO anon;
GRANT ALL ON TABLE public.appeals TO authenticated;
GRANT ALL ON TABLE public.appeals TO service_role;


--
-- Name: TABLE attribute; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attribute TO anon;
GRANT ALL ON TABLE public.attribute TO authenticated;
GRANT ALL ON TABLE public.attribute TO service_role;


--
-- Name: SEQUENCE attribute_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.attribute_id_seq TO anon;
GRANT ALL ON SEQUENCE public.attribute_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.attribute_id_seq TO service_role;


--
-- Name: TABLE attribute_value; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attribute_value TO anon;
GRANT ALL ON TABLE public.attribute_value TO authenticated;
GRANT ALL ON TABLE public.attribute_value TO service_role;


--
-- Name: SEQUENCE attribute_value_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.attribute_value_id_seq TO anon;
GRANT ALL ON SEQUENCE public.attribute_value_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.attribute_value_id_seq TO service_role;


--
-- Name: TABLE blacklist_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blacklist_entries TO anon;
GRANT ALL ON TABLE public.blacklist_entries TO authenticated;
GRANT ALL ON TABLE public.blacklist_entries TO service_role;


--
-- Name: TABLE blocked_ips; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.blocked_ips TO anon;
GRANT ALL ON TABLE public.blocked_ips TO authenticated;
GRANT ALL ON TABLE public.blocked_ips TO service_role;


--
-- Name: SEQUENCE blocked_ips_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.blocked_ips_id_seq TO anon;
GRANT ALL ON SEQUENCE public.blocked_ips_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.blocked_ips_id_seq TO service_role;


--
-- Name: TABLE brand; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.brand TO anon;
GRANT ALL ON TABLE public.brand TO authenticated;
GRANT ALL ON TABLE public.brand TO service_role;


--
-- Name: TABLE brand_has_category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.brand_has_category TO anon;
GRANT ALL ON TABLE public.brand_has_category TO authenticated;
GRANT ALL ON TABLE public.brand_has_category TO service_role;


--
-- Name: SEQUENCE brand_has_category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.brand_has_category_id_seq TO anon;
GRANT ALL ON SEQUENCE public.brand_has_category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.brand_has_category_id_seq TO service_role;


--
-- Name: SEQUENCE brand_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.brand_id_seq TO anon;
GRANT ALL ON SEQUENCE public.brand_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.brand_id_seq TO service_role;


--
-- Name: TABLE category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.category TO anon;
GRANT ALL ON TABLE public.category TO authenticated;
GRANT ALL ON TABLE public.category TO service_role;


--
-- Name: SEQUENCE category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.category_id_seq TO anon;
GRANT ALL ON SEQUENCE public.category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.category_id_seq TO service_role;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;


--
-- Name: SEQUENCE contact_messages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO anon;
GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.contact_messages_id_seq TO service_role;


--
-- Name: TABLE delivery_method; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.delivery_method TO anon;
GRANT ALL ON TABLE public.delivery_method TO authenticated;
GRANT ALL ON TABLE public.delivery_method TO service_role;


--
-- Name: SEQUENCE delivery_method_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.delivery_method_id_seq TO anon;
GRANT ALL ON SEQUENCE public.delivery_method_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.delivery_method_id_seq TO service_role;


--
-- Name: TABLE delivery_service; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.delivery_service TO anon;
GRANT ALL ON TABLE public.delivery_service TO authenticated;
GRANT ALL ON TABLE public.delivery_service TO service_role;


--
-- Name: SEQUENCE delivery_service_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.delivery_service_id_seq TO anon;
GRANT ALL ON SEQUENCE public.delivery_service_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.delivery_service_id_seq TO service_role;


--
-- Name: TABLE discount; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discount TO anon;
GRANT ALL ON TABLE public.discount TO authenticated;
GRANT ALL ON TABLE public.discount TO service_role;


--
-- Name: TABLE discount_event; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discount_event TO anon;
GRANT ALL ON TABLE public.discount_event TO authenticated;
GRANT ALL ON TABLE public.discount_event TO service_role;


--
-- Name: SEQUENCE discount_event_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.discount_event_id_seq TO anon;
GRANT ALL ON SEQUENCE public.discount_event_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.discount_event_id_seq TO service_role;


--
-- Name: SEQUENCE discount_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.discount_id_seq TO anon;
GRANT ALL ON SEQUENCE public.discount_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.discount_id_seq TO service_role;


--
-- Name: TABLE discount_rule; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.discount_rule TO anon;
GRANT ALL ON TABLE public.discount_rule TO authenticated;
GRANT ALL ON TABLE public.discount_rule TO service_role;


--
-- Name: SEQUENCE discount_rule_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.discount_rule_id_seq TO anon;
GRANT ALL ON SEQUENCE public.discount_rule_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.discount_rule_id_seq TO service_role;


--
-- Name: TABLE event_product; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.event_product TO anon;
GRANT ALL ON TABLE public.event_product TO authenticated;
GRANT ALL ON TABLE public.event_product TO service_role;


--
-- Name: SEQUENCE event_product_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.event_product_id_seq TO anon;
GRANT ALL ON SEQUENCE public.event_product_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.event_product_id_seq TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: SEQUENCE events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.events_id_seq TO service_role;


--
-- Name: TABLE login_attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_attempts TO anon;
GRANT ALL ON TABLE public.login_attempts TO authenticated;
GRANT ALL ON TABLE public.login_attempts TO service_role;


--
-- Name: SEQUENCE login_attempts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.login_attempts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.login_attempts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.login_attempts_id_seq TO service_role;


--
-- Name: TABLE news_letter_subscriber; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.news_letter_subscriber TO anon;
GRANT ALL ON TABLE public.news_letter_subscriber TO authenticated;
GRANT ALL ON TABLE public.news_letter_subscriber TO service_role;


--
-- Name: SEQUENCE news_letter_subscriber_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.news_letter_subscriber_id_seq TO anon;
GRANT ALL ON SEQUENCE public.news_letter_subscriber_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.news_letter_subscriber_id_seq TO service_role;


--
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification TO anon;
GRANT ALL ON TABLE public.notification TO authenticated;
GRANT ALL ON TABLE public.notification TO service_role;


--
-- Name: SEQUENCE notification_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.notification_id_seq TO anon;
GRANT ALL ON SEQUENCE public.notification_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.notification_id_seq TO service_role;


--
-- Name: TABLE order_status; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_status TO anon;
GRANT ALL ON TABLE public.order_status TO authenticated;
GRANT ALL ON TABLE public.order_status TO service_role;


--
-- Name: SEQUENCE order_status_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.order_status_id_seq TO anon;
GRANT ALL ON SEQUENCE public.order_status_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.order_status_id_seq TO service_role;


--
-- Name: TABLE otp_verification; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.otp_verification TO anon;
GRANT ALL ON TABLE public.otp_verification TO authenticated;
GRANT ALL ON TABLE public.otp_verification TO service_role;


--
-- Name: SEQUENCE otp_verification_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.otp_verification_id_seq TO anon;
GRANT ALL ON SEQUENCE public.otp_verification_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.otp_verification_id_seq TO service_role;


--
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.permission TO anon;
GRANT ALL ON TABLE public.permission TO authenticated;
GRANT ALL ON TABLE public.permission TO service_role;


--
-- Name: TABLE permission_category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.permission_category TO anon;
GRANT ALL ON TABLE public.permission_category TO authenticated;
GRANT ALL ON TABLE public.permission_category TO service_role;


--
-- Name: SEQUENCE permission_category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.permission_category_id_seq TO anon;
GRANT ALL ON SEQUENCE public.permission_category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.permission_category_id_seq TO service_role;


--
-- Name: SEQUENCE permission_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.permission_id_seq TO anon;
GRANT ALL ON SEQUENCE public.permission_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.permission_id_seq TO service_role;


--
-- Name: TABLE policies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.policies TO anon;
GRANT ALL ON TABLE public.policies TO authenticated;
GRANT ALL ON TABLE public.policies TO service_role;


--
-- Name: SEQUENCE policies_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.policies_id_seq TO anon;
GRANT ALL ON SEQUENCE public.policies_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.policies_id_seq TO service_role;


--
-- Name: TABLE product_discount; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_discount TO anon;
GRANT ALL ON TABLE public.product_discount TO authenticated;
GRANT ALL ON TABLE public.product_discount TO service_role;


--
-- Name: SEQUENCE product_discount_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.product_discount_id_seq TO anon;
GRANT ALL ON SEQUENCE public.product_discount_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.product_discount_id_seq TO service_role;


--
-- Name: TABLE product_has_category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_has_category TO anon;
GRANT ALL ON TABLE public.product_has_category TO authenticated;
GRANT ALL ON TABLE public.product_has_category TO service_role;


--
-- Name: SEQUENCE product_has_category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.product_has_category_id_seq TO anon;
GRANT ALL ON SEQUENCE public.product_has_category_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.product_has_category_id_seq TO service_role;


--
-- Name: TABLE product_image; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_image TO anon;
GRANT ALL ON TABLE public.product_image TO authenticated;
GRANT ALL ON TABLE public.product_image TO service_role;


--
-- Name: SEQUENCE product_image_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.product_image_id_seq TO anon;
GRANT ALL ON SEQUENCE public.product_image_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.product_image_id_seq TO service_role;


--
-- Name: TABLE product_variants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.product_variants TO anon;
GRANT ALL ON TABLE public.product_variants TO authenticated;
GRANT ALL ON TABLE public.product_variants TO service_role;


--
-- Name: SEQUENCE product_variants_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.product_variants_id_seq TO anon;
GRANT ALL ON SEQUENCE public.product_variants_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.product_variants_id_seq TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: SEQUENCE products_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.products_id_seq TO anon;
GRANT ALL ON SEQUENCE public.products_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.products_id_seq TO service_role;


--
-- Name: TABLE purchase; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.purchase TO anon;
GRANT ALL ON TABLE public.purchase TO authenticated;
GRANT ALL ON TABLE public.purchase TO service_role;


--
-- Name: SEQUENCE purchase_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.purchase_id_seq TO anon;
GRANT ALL ON SEQUENCE public.purchase_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.purchase_id_seq TO service_role;


--
-- Name: TABLE purchase_products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.purchase_products TO anon;
GRANT ALL ON TABLE public.purchase_products TO authenticated;
GRANT ALL ON TABLE public.purchase_products TO service_role;


--
-- Name: SEQUENCE purchase_products_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.purchase_products_id_seq TO anon;
GRANT ALL ON SEQUENCE public.purchase_products_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.purchase_products_id_seq TO service_role;


--
-- Name: TABLE refresh_token; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refresh_token TO anon;
GRANT ALL ON TABLE public.refresh_token TO authenticated;
GRANT ALL ON TABLE public.refresh_token TO service_role;


--
-- Name: SEQUENCE refresh_token_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.refresh_token_id_seq TO anon;
GRANT ALL ON SEQUENCE public.refresh_token_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.refresh_token_id_seq TO service_role;


--
-- Name: TABLE refunds; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refunds TO anon;
GRANT ALL ON TABLE public.refunds TO authenticated;
GRANT ALL ON TABLE public.refunds TO service_role;


--
-- Name: SEQUENCE refunds_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.refunds_id_seq TO anon;
GRANT ALL ON SEQUENCE public.refunds_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.refunds_id_seq TO service_role;


--
-- Name: TABLE reset_password_request; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reset_password_request TO anon;
GRANT ALL ON TABLE public.reset_password_request TO authenticated;
GRANT ALL ON TABLE public.reset_password_request TO service_role;


--
-- Name: SEQUENCE reset_password_request_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.reset_password_request_id_seq TO anon;
GRANT ALL ON SEQUENCE public.reset_password_request_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.reset_password_request_id_seq TO service_role;


--
-- Name: TABLE return_request_image; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.return_request_image TO anon;
GRANT ALL ON TABLE public.return_request_image TO authenticated;
GRANT ALL ON TABLE public.return_request_image TO service_role;


--
-- Name: SEQUENCE return_request_image_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.return_request_image_id_seq TO anon;
GRANT ALL ON SEQUENCE public.return_request_image_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.return_request_image_id_seq TO service_role;


--
-- Name: TABLE return_request_products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.return_request_products TO anon;
GRANT ALL ON TABLE public.return_request_products TO authenticated;
GRANT ALL ON TABLE public.return_request_products TO service_role;


--
-- Name: SEQUENCE return_request_products_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.return_request_products_id_seq TO anon;
GRANT ALL ON SEQUENCE public.return_request_products_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.return_request_products_id_seq TO service_role;


--
-- Name: TABLE return_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.return_requests TO anon;
GRANT ALL ON TABLE public.return_requests TO authenticated;
GRANT ALL ON TABLE public.return_requests TO service_role;


--
-- Name: SEQUENCE return_requests_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.return_requests_id_seq TO anon;
GRANT ALL ON SEQUENCE public.return_requests_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.return_requests_id_seq TO service_role;


--
-- Name: TABLE revenue_target; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.revenue_target TO anon;
GRANT ALL ON TABLE public.revenue_target TO authenticated;
GRANT ALL ON TABLE public.revenue_target TO service_role;


--
-- Name: SEQUENCE revenue_target_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.revenue_target_id_seq TO anon;
GRANT ALL ON SEQUENCE public.revenue_target_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.revenue_target_id_seq TO service_role;


--
-- Name: TABLE review; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.review TO anon;
GRANT ALL ON TABLE public.review TO authenticated;
GRANT ALL ON TABLE public.review TO service_role;


--
-- Name: SEQUENCE review_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.review_id_seq TO anon;
GRANT ALL ON SEQUENCE public.review_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.review_id_seq TO service_role;


--
-- Name: TABLE review_media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.review_media TO anon;
GRANT ALL ON TABLE public.review_media TO authenticated;
GRANT ALL ON TABLE public.review_media TO service_role;


--
-- Name: SEQUENCE review_media_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.review_media_id_seq TO anon;
GRANT ALL ON SEQUENCE public.review_media_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.review_media_id_seq TO service_role;


--
-- Name: TABLE role; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role TO anon;
GRANT ALL ON TABLE public.role TO authenticated;
GRANT ALL ON TABLE public.role TO service_role;


--
-- Name: SEQUENCE role_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.role_id_seq TO anon;
GRANT ALL ON SEQUENCE public.role_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.role_id_seq TO service_role;


--
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role_permission TO anon;
GRANT ALL ON TABLE public.role_permission TO authenticated;
GRANT ALL ON TABLE public.role_permission TO service_role;


--
-- Name: SEQUENCE role_permission_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.role_permission_id_seq TO anon;
GRANT ALL ON SEQUENCE public.role_permission_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.role_permission_id_seq TO service_role;


--
-- Name: TABLE role_permission_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role_permission_log TO anon;
GRANT ALL ON TABLE public.role_permission_log TO authenticated;
GRANT ALL ON TABLE public.role_permission_log TO service_role;


--
-- Name: SEQUENCE role_permission_log_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.role_permission_log_id_seq TO anon;
GRANT ALL ON SEQUENCE public.role_permission_log_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.role_permission_log_id_seq TO service_role;


--
-- Name: TABLE saved_cards; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.saved_cards TO anon;
GRANT ALL ON TABLE public.saved_cards TO authenticated;
GRANT ALL ON TABLE public.saved_cards TO service_role;


--
-- Name: SEQUENCE saved_cards_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.saved_cards_id_seq TO anon;
GRANT ALL ON SEQUENCE public.saved_cards_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.saved_cards_id_seq TO service_role;


--
-- Name: TABLE security_policy_rule; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.security_policy_rule TO anon;
GRANT ALL ON TABLE public.security_policy_rule TO authenticated;
GRANT ALL ON TABLE public.security_policy_rule TO service_role;


--
-- Name: SEQUENCE security_policy_rule_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.security_policy_rule_id_seq TO anon;
GRANT ALL ON SEQUENCE public.security_policy_rule_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.security_policy_rule_id_seq TO service_role;


--
-- Name: TABLE status; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.status TO anon;
GRANT ALL ON TABLE public.status TO authenticated;
GRANT ALL ON TABLE public.status TO service_role;


--
-- Name: SEQUENCE status_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.status_id_seq TO anon;
GRANT ALL ON SEQUENCE public.status_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.status_id_seq TO service_role;


--
-- Name: TABLE test; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.test TO anon;
GRANT ALL ON TABLE public.test TO authenticated;
GRANT ALL ON TABLE public.test TO service_role;


--
-- Name: SEQUENCE test_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.test_id_seq TO anon;
GRANT ALL ON SEQUENCE public.test_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.test_id_seq TO service_role;


--
-- Name: TABLE user_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_activity TO anon;
GRANT ALL ON TABLE public.user_activity TO authenticated;
GRANT ALL ON TABLE public.user_activity TO service_role;


--
-- Name: SEQUENCE user_activity_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_activity_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_activity_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_activity_id_seq TO service_role;


--
-- Name: TABLE user_coupon_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_coupon_usage TO anon;
GRANT ALL ON TABLE public.user_coupon_usage TO authenticated;
GRANT ALL ON TABLE public.user_coupon_usage TO service_role;


--
-- Name: SEQUENCE user_coupon_usage_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_coupon_usage_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_coupon_usage_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_coupon_usage_id_seq TO service_role;


--
-- Name: TABLE user_order; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_order TO anon;
GRANT ALL ON TABLE public.user_order TO authenticated;
GRANT ALL ON TABLE public.user_order TO service_role;


--
-- Name: TABLE user_order_has_product; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_order_has_product TO anon;
GRANT ALL ON TABLE public.user_order_has_product TO authenticated;
GRANT ALL ON TABLE public.user_order_has_product TO service_role;


--
-- Name: SEQUENCE user_order_has_product_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_order_has_product_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_order_has_product_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_order_has_product_id_seq TO service_role;


--
-- Name: SEQUENCE user_order_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_order_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_order_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_order_id_seq TO service_role;


--
-- Name: TABLE user_point_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_point_history TO anon;
GRANT ALL ON TABLE public.user_point_history TO authenticated;
GRANT ALL ON TABLE public.user_point_history TO service_role;


--
-- Name: SEQUENCE user_point_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_point_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_point_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_point_history_id_seq TO service_role;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sessions TO anon;
GRANT ALL ON TABLE public.user_sessions TO authenticated;
GRANT ALL ON TABLE public.user_sessions TO service_role;


--
-- Name: SEQUENCE user_sessions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_sessions_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;


--
-- Name: TABLE variant_attribute_value; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.variant_attribute_value TO anon;
GRANT ALL ON TABLE public.variant_attribute_value TO authenticated;
GRANT ALL ON TABLE public.variant_attribute_value TO service_role;


--
-- Name: SEQUENCE variant_attribute_value_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.variant_attribute_value_id_seq TO anon;
GRANT ALL ON SEQUENCE public.variant_attribute_value_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.variant_attribute_value_id_seq TO service_role;


--
-- Name: TABLE verification_token; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.verification_token TO anon;
GRANT ALL ON TABLE public.verification_token TO authenticated;
GRANT ALL ON TABLE public.verification_token TO service_role;


--
-- Name: SEQUENCE verification_token_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.verification_token_id_seq TO anon;
GRANT ALL ON SEQUENCE public.verification_token_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.verification_token_id_seq TO service_role;


--
-- Name: TABLE vip_tiers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vip_tiers TO anon;
GRANT ALL ON TABLE public.vip_tiers TO authenticated;
GRANT ALL ON TABLE public.vip_tiers TO service_role;


--
-- Name: SEQUENCE vip_tiers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.vip_tiers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.vip_tiers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.vip_tiers_id_seq TO service_role;


--
-- Name: TABLE wishlist; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wishlist TO anon;
GRANT ALL ON TABLE public.wishlist TO authenticated;
GRANT ALL ON TABLE public.wishlist TO service_role;


--
-- Name: SEQUENCE wishlist_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wishlist_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wishlist_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wishlist_id_seq TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE
BEGIN EXTENSION'
-- The sign-up trigger is the only caller; it must not be reachable via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

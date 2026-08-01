-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
create table fortunes (
  id       bigint generated always as identity primary key,
  drawn_at timestamptz not null default now(), -- 날짜
  name     text        not null,               -- 이름
  content  text        not null                -- 운세 내용
);

-- 브라우저에서 publishable key로 직접 읽고 쓰므로 RLS 정책 필요
alter table fortunes enable row level security;

-- ponytail: 데모용 전체 공개. 본인 기록만 보이게 하려면 로그인 붙이고 auth.uid() 조건 추가.
create policy "누구나 읽기" on fortunes for select using (true);
create policy "누구나 저장" on fortunes for insert with check (true);


-- ============================================================
-- 2단계: 로그인. 위 블록을 이미 실행했다면 여기서부터만 붙여넣으세요.
-- ============================================================
alter table fortunes add column user_id uuid references auth.users(id) default auth.uid();

-- 로그인한 사람만 저장 가능하고, 남의 이름으로는 못 넣는다
drop policy "누구나 저장" on fortunes;
create policy "본인 것만 저장" on fortunes
  for insert to authenticated with check (auth.uid() = user_id);

-- 읽기는 계속 전체 공개 — 그래야 '오늘 뽑은 사람 수' 카운터가 동작한다.
-- ponytail: 내 기록만 보이게 하려면 위 읽기 정책을 auth.uid() = user_id 로 바꾸고
--           카운터는 security definer 함수(RPC)로 빼야 한다. 지금은 공용 기록이라 그대로 둠.

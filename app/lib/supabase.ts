import { createClient } from "@supabase/supabase-js";

// 세션 저장/1시간마다 토큰 갱신을 라이브러리에 맡긴다. 직접 굴리면 만료 시점에 조용히 깨진다.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

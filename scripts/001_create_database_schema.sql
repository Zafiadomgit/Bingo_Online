-- Crear tabla de usuarios (perfiles públicos)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Crear tabla de juegos de bingo
CREATE TABLE IF NOT EXISTS public.bingo_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_cards INTEGER NOT NULL DEFAULT 100,
  card_price INTEGER NOT NULL DEFAULT 500, -- precio en centavos
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_number INTEGER,
  numbers_called INTEGER[] DEFAULT '{}',
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS para bingo_games
ALTER TABLE public.bingo_games ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bingo_games (todos pueden ver)
CREATE POLICY "bingo_games_select_all" ON public.bingo_games FOR SELECT TO authenticated USING (true);

-- Crear tabla de cartones de bingo
CREATE TABLE IF NOT EXISTS public.bingo_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.bingo_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_number INTEGER NOT NULL,
  numbers INTEGER[25] NOT NULL, -- 5x5 grid de números
  marked_positions BOOLEAN[25] DEFAULT ARRAY[false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, card_number)
);

-- Habilitar RLS para bingo_cards
ALTER TABLE public.bingo_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bingo_cards
CREATE POLICY "bingo_cards_select_own" ON public.bingo_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bingo_cards_insert_own" ON public.bingo_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bingo_cards_update_own" ON public.bingo_cards FOR UPDATE USING (auth.uid() = user_id);

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.bingo_games(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- cantidad en centavos
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method TEXT NOT NULL DEFAULT 'credits',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS para payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payments
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Crear función para auto-crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    1000 -- créditos iniciales gratis
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para auto-crear perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Crear función para generar números de cartón de bingo
CREATE OR REPLACE FUNCTION public.generate_bingo_card_numbers()
RETURNS INTEGER[]
LANGUAGE plpgsql
AS $$
DECLARE
  card_numbers INTEGER[25];
  b_numbers INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  i_numbers INTEGER[] := ARRAY[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  n_numbers INTEGER[] := ARRAY[31,32,33,34,35,36,37,38,39,40,41,42,43,44,45];
  g_numbers INTEGER[] := ARRAY[46,47,48,49,50,51,52,53,54,55,56,57,58,59,60];
  o_numbers INTEGER[] := ARRAY[61,62,63,64,65,66,67,68,69,70,71,72,73,74,75];
  i INTEGER;
BEGIN
  -- Columna B (posiciones 1-5)
  FOR i IN 1..5 LOOP
    card_numbers[i] := b_numbers[floor(random() * array_length(b_numbers, 1)) + 1];
    b_numbers := array_remove(b_numbers, card_numbers[i]);
  END LOOP;
  
  -- Columna I (posiciones 6-10)
  FOR i IN 6..10 LOOP
    card_numbers[i] := i_numbers[floor(random() * array_length(i_numbers, 1)) + 1];
    i_numbers := array_remove(i_numbers, card_numbers[i]);
  END LOOP;
  
  -- Columna N (posiciones 11-15, con espacio libre en 13)
  FOR i IN 11..15 LOOP
    IF i = 13 THEN
      card_numbers[i] := 0; -- Espacio libre
    ELSE
      card_numbers[i] := n_numbers[floor(random() * array_length(n_numbers, 1)) + 1];
      n_numbers := array_remove(n_numbers, card_numbers[i]);
    END IF;
  END LOOP;
  
  -- Columna G (posiciones 16-20)
  FOR i IN 16..20 LOOP
    card_numbers[i] := g_numbers[floor(random() * array_length(g_numbers, 1)) + 1];
    g_numbers := array_remove(g_numbers, card_numbers[i]);
  END LOOP;
  
  -- Columna O (posiciones 21-25)
  FOR i IN 21..25 LOOP
    card_numbers[i] := o_numbers[floor(random() * array_length(o_numbers, 1)) + 1];
    o_numbers := array_remove(o_numbers, card_numbers[i]);
  END LOOP;
  
  RETURN card_numbers;
END;
$$;

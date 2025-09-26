-- Crear un juego de ejemplo para pruebas
INSERT INTO public.bingo_games (name, max_cards, card_price, status)
VALUES ('Juego de Bingo #1', 50, 500, 'waiting')
ON CONFLICT DO NOTHING;

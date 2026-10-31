BEGIN;

INSERT INTO categorias (nome)
VALUES
  ('Eletrônicos'),
  ('Moda'),
  ('Casa & Decoração'),
  ('Esportes'),
  ('Beleza')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (nome, email, senha_hash, telefone, avatar_url, funcao)
VALUES
  (
    'Mariana Costa Silva',
    'marianasilva@example.com',
    crypt('Lumina123!', gen_salt('bf', 12)),
    '(11) 98765-4321',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop&auto=format',
    'Vendedora Pró'
  ),
  (
    'Loja Oficial Lumina',
    'loja@lumina.example.com',
    crypt('LojaLumina123!', gen_salt('bf', 12)),
    '(11) 4000-1234',
    NULL,
    'Loja Oficial'
  )
ON CONFLICT DO NOTHING;

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Headphone Noise Cancelling Pro',
  'Cancelamento de ruído ativo, áudio espacial e conforto para ouvir cada detalhe.',
  1499.00, 1899.00,
  'https://images.unsplash.com/photo-1761005654347-f5907893edb7?w=900&h=900&fit=crop&auto=format',
  4.9, 128, 340, 12, 'Ativo', 'MAIS VENDIDO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Headphone Noise Cancelling Pro');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Kit Café Cerâmica Artesanal',
  'Conjunto completo em cerâmica artesanal para transformar a pausa do café.',
  289.00, 389.00,
  'https://images.unsplash.com/photo-1740416113078-f2d140bf3552?w=900&h=900&fit=crop&auto=format',
  4.8, 85, 215, 23, 'Ativo', 'RECOMENDADO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Casa & Decoração'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Kit Café Cerâmica Artesanal');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Aura Watch Série 9',
  'Tecnologia de ponta em um design atemporal. Sinta a diferença.',
  4299.00, 4999.00,
  'https://images.unsplash.com/photo-1696688713460-de12ac76ebc6?w=1400&h=900&fit=crop&auto=format',
  4.7, 203, 189, 8, 'Ativo', 'LANÇAMENTO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Aura Watch Série 9');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Mochila Canvas Premium',
  'Design robusto e elegante para o dia a dia urbano, com material resistente à água.',
  349.00, 499.00,
  'https://images.unsplash.com/photo-1550253594-356b2f788907?w=900&h=900&fit=crop&auto=format',
  4.6, 67, 134, 45, 'Ativo', 'NOVO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Moda'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Mochila Canvas Premium');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Lumina Pro X1 Titanium 256GB',
  'Câmera profissional e desempenho de última geração em acabamento de titânio.',
  5299.00, 5999.00,
  'https://images.unsplash.com/photo-1664482828500-b4c2341cbfd2?w=900&h=900&fit=crop&auto=format',
  4.9, 128, 421, 15, 'Ativo', 'NOVO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Lumina Pro X1 Titanium 256GB');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status, selo
)
SELECT
  u.id, c.id,
  'Aura Flow 5G Azul Meia-Noite',
  'Performance 5G com design sofisticado em azul meia-noite exclusivo.',
  3850.00, NULL,
  'https://images.unsplash.com/photo-1607027340850-44448bd87dcb?w=900&h=900&fit=crop&auto=format',
  4.7, 89, 98, 20, 'Ativo', 'RECOMENDADO'
FROM usuarios u, categorias c
WHERE u.email = 'loja@lumina.example.com' AND c.nome = 'Eletrônicos'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Aura Flow 5G Azul Meia-Noite');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status
)
SELECT
  u.id, c.id,
  'Vaso de Cerâmica Nórdico',
  'Design escandinavo para decoração de ambientes modernos.',
  149.90,
  'https://images.unsplash.com/photo-1509490927285-34bd4d057c88?w=900&h=900&fit=crop&auto=format',
  4.5, 34, 78, 30, 'Ativo'
FROM usuarios u, categorias c
WHERE u.email = 'marianasilva@example.com' AND c.nome = 'Casa & Decoração'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Vaso de Cerâmica Nórdico');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status
)
SELECT
  u.id, c.id,
  'Garrafa Térmica Slim Pro',
  'Mantém bebidas quentes por 12h e frias por 24h.',
  289.00,
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&h=900&fit=crop&auto=format',
  4.8, 56, 167, 18, 'Ativo'
FROM usuarios u, categorias c
WHERE u.email = 'marianasilva@example.com' AND c.nome = 'Esportes'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Garrafa Térmica Slim Pro');

INSERT INTO produtos (
  usuario_id, categoria_id, nome, descricao, preco, preco_original, imagem_url,
  avaliacao_media, total_avaliacoes, quantidade_vendas, estoque, status
)
SELECT
  u.id, c.id,
  'Conjunto Bowls Bambu Natural',
  'Kit com quatro tigelas de bambu sustentável.',
  115.50, 159.00,
  'https://images.unsplash.com/photo-1740416113078-f2d140bf3552?w=900&h=900&fit=crop&auto=format',
  4.3, 22, 45, 0, 'Inativo'
FROM usuarios u, categorias c
WHERE u.email = 'marianasilva@example.com' AND c.nome = 'Casa & Decoração'
  AND NOT EXISTS (SELECT 1 FROM produtos p WHERE p.nome = 'Conjunto Bowls Bambu Natural');

COMMIT;

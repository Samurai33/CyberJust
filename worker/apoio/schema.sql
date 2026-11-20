-- Total agregado de apoios e o dia em que a contagem começou. Nada por pessoa.
CREATE TABLE IF NOT EXISTS totais (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  apoios INTEGER NOT NULL DEFAULT 0 CHECK (apoios >= 0),
  desde TEXT NOT NULL
);
INSERT OR IGNORE INTO totais (id, apoios, desde) VALUES (1, 0, date('now'));

-- SHA-256 do id de cada pagamento já contado (o Asaas avisa CONFIRMED e RECEIVED do mesmo pagamento de cartão).
CREATE TABLE IF NOT EXISTS vistos (
  hash TEXT PRIMARY KEY
);

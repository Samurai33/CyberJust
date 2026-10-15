-- Uma linha só: o total agregado e o dia em que a contagem começou. Nada por pessoa.
CREATE TABLE IF NOT EXISTS contador (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  desde TEXT NOT NULL
);
INSERT OR IGNORE INTO contador (id, total, desde) VALUES (1, 0, date('now'));

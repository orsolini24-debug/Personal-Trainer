/**
 * Database alimenti italiani — valori per 100 g/ml
 * Fonte: INRAN (Istituto Nazionale di Ricerca per gli Alimenti e la Nutrizione)
 *        + valori standard internazionali USDA
 */
export type Food = {
  name: string
  kcal: number
  p: number   // proteine g
  c: number   // carboidrati g
  f: number   // grassi g
  tags?: string[]   // parole chiave extra per la ricerca
}

export const FOODS: Food[] = [
  // ── CEREALI & PASTA ───────────────────────────────────────────────────────
  { name: 'Pasta di semola (cruda)', kcal: 353, p: 12.5, c: 70.2, f: 1.4, tags: ['pasta', 'spaghetti', 'penne', 'rigatoni', 'fusilli'] },
  { name: 'Pasta integrale (cruda)', kcal: 335, p: 13.4, c: 63.6, f: 2.5, tags: ['pasta integrale'] },
  { name: 'Pasta di semola (cotta)', kcal: 158, p: 5.8, c: 30.6, f: 0.9 },
  { name: 'Riso bianco (crudo)',     kcal: 358, p: 7.5,  c: 79.3, f: 0.4, tags: ['riso'] },
  { name: 'Riso integrale (crudo)',  kcal: 350, p: 7.9,  c: 73.1, f: 2.7, tags: ['riso integrale'] },
  { name: 'Riso bianco (cotto)',     kcal: 130, p: 2.7,  c: 28.2, f: 0.3 },
  { name: 'Pane comune',            kcal: 275, p: 8.1,  c: 53.8, f: 0.5, tags: ['pane bianco', 'michetta', 'filone'] },
  { name: 'Pane integrale',         kcal: 224, p: 8.5,  c: 40.5, f: 1.9, tags: ['pane integrale'] },
  { name: 'Pane di segale',         kcal: 219, p: 5.9,  c: 45.2, f: 1.7 },
  { name: 'Fette biscottate',       kcal: 410, p: 8.8,  c: 75.3, f: 8.4 },
  { name: 'Fette biscottate integrali', kcal: 382, p: 9.5, c: 68.1, f: 6.9 },
  { name: 'Avena (fiocchi)',        kcal: 389, p: 16.9, c: 66.3, f: 6.9, tags: ['porridge', 'oats', 'fiocchi davena'] },
  { name: 'Mais (farina)',          kcal: 362, p: 8.7,  c: 76.0, f: 3.6, tags: ['polenta', 'farina di mais'] },
  { name: 'Orzo perlato (crudo)',   kcal: 352, p: 9.9,  c: 70.2, f: 2.1 },
  { name: 'Grano saraceno',        kcal: 343, p: 13.2, c: 63.0, f: 3.4, tags: ['buckwheat'] },
  { name: 'Quinoa (cotta)',        kcal: 120, p: 4.4,  c: 21.3, f: 1.9 },
  { name: 'Couscous (cotto)',      kcal: 112, p: 3.8,  c: 23.2, f: 0.2 },
  { name: 'Crackers',             kcal: 428, p: 8.0,  c: 69.8, f: 12.0 },
  { name: 'Gallette di riso',     kcal: 387, p: 7.3,  c: 80.8, f: 2.8 },

  // ── CARNI ─────────────────────────────────────────────────────────────────
  { name: 'Petto di pollo (cotto)',   kcal: 165, p: 31.0, c: 0.0, f: 3.6, tags: ['pollo', 'chicken breast'] },
  { name: 'Petto di pollo (crudo)',   kcal: 110, p: 23.1, c: 0.0, f: 1.2, tags: ['pollo crudo'] },
  { name: 'Coscia di pollo (cotta)',  kcal: 209, p: 25.9, c: 0.0, f: 10.9, tags: ['pollo coscia'] },
  { name: 'Tacchino petto (cotto)',   kcal: 135, p: 29.9, c: 0.0, f: 1.6, tags: ['tacchino', 'turkey'] },
  { name: 'Tacchino petto (crudo)',   kcal: 104, p: 22.0, c: 0.5, f: 1.1 },
  { name: 'Manzo (bistecca magra)',   kcal: 179, p: 26.1, c: 0.0, f: 7.9, tags: ['carne bovina', 'bistecca', 'manzo'] },
  { name: 'Manzo (macinato 5% grassi)', kcal: 137, p: 21.4, c: 0.0, f: 5.4, tags: ['macinato', 'carne macinata'] },
  { name: 'Manzo (macinato 20% grassi)', kcal: 254, p: 17.2, c: 0.0, f: 20.0 },
  { name: 'Maiale (lonza)',          kcal: 143, p: 21.5, c: 0.0, f: 5.9, tags: ['maiale', 'lonza', 'pork'] },
  { name: 'Maiale (costine)',        kcal: 233, p: 18.0, c: 0.0, f: 17.9 },
  { name: 'Agnello (coscia)',        kcal: 206, p: 26.7, c: 0.0, f: 10.7, tags: ['agnello'] },
  { name: 'Vitello (fesa)',          kcal: 107, p: 19.6, c: 0.0, f: 2.9, tags: ['vitello'] },
  { name: 'Prosciutto crudo',        kcal: 268, p: 25.5, c: 0.3, f: 17.8, tags: ['prosciutto'] },
  { name: 'Prosciutto cotto',        kcal: 136, p: 18.0, c: 1.3, f: 6.0 },
  { name: 'Bresaola',               kcal: 174, p: 31.0, c: 0.5, f: 4.3 },
  { name: 'Mortadella',             kcal: 311, p: 14.7, c: 1.5, f: 28.0 },
  { name: 'Salame',                 kcal: 387, p: 20.6, c: 1.2, f: 33.6 },
  { name: 'Speck',                  kcal: 263, p: 25.0, c: 0.5, f: 17.3 },
  { name: 'Wurstel di pollo',       kcal: 195, p: 11.0, c: 3.0, f: 15.0 },

  // ── PESCE ─────────────────────────────────────────────────────────────────
  { name: 'Tonno al naturale (sgocciolato)', kcal: 103, p: 23.3, c: 0.0, f: 0.8, tags: ['tonno', 'tuna'] },
  { name: 'Tonno sott\'olio (sgocciolato)', kcal: 198, p: 21.5, c: 0.0, f: 12.5 },
  { name: 'Salmone (cotto)',         kcal: 208, p: 20.4, c: 0.0, f: 13.4, tags: ['salmone', 'salmon'] },
  { name: 'Salmone (crudo)',         kcal: 142, p: 19.8, c: 0.0, f: 6.3 },
  { name: 'Merluzzo (cotto)',        kcal: 105, p: 22.8, c: 0.0, f: 0.9, tags: ['merluzzo', 'cod', 'baccalà'] },
  { name: 'Branzino (cotto)',        kcal: 124, p: 23.6, c: 0.0, f: 3.0, tags: ['branzino', 'spigola'] },
  { name: 'Orata (cotta)',           kcal: 121, p: 21.8, c: 0.0, f: 3.6, tags: ['orata', 'dorada'] },
  { name: 'Trota (cotta)',           kcal: 190, p: 26.6, c: 0.0, f: 8.9, tags: ['trota'] },
  { name: 'Sardine sott\'olio',      kcal: 208, p: 24.6, c: 0.0, f: 11.5 },
  { name: 'Gamberetti (cotti)',      kcal: 99,  p: 20.9, c: 0.2, f: 1.7, tags: ['gamberi', 'shrimp'] },
  { name: 'Calamari (cotti)',        kcal: 92,  p: 15.6, c: 3.1, f: 1.4 },
  { name: 'Polpo (cotto)',           kcal: 82,  p: 14.9, c: 2.2, f: 1.0 },
  { name: 'Cozze (cotte)',           kcal: 86,  p: 11.9, c: 3.7, f: 2.2 },

  // ── UOVA & LATTICINI ──────────────────────────────────────────────────────
  { name: 'Uovo intero (crudo)',     kcal: 147, p: 12.6, c: 0.7, f: 10.6, tags: ['uova', 'egg'] },
  { name: 'Albume (crudo)',          kcal: 52,  p: 10.9, c: 0.7, f: 0.2, tags: ['albumi', 'egg white'] },
  { name: 'Tuorlo (crudo)',          kcal: 352, p: 16.4, c: 0.3, f: 31.9 },
  { name: 'Latte intero',            kcal: 64,  p: 3.2,  c: 4.7, f: 3.6, tags: ['latte', 'milk'] },
  { name: 'Latte parzialmente scremato', kcal: 46, p: 3.5, c: 4.9, f: 1.5 },
  { name: 'Latte scremato',          kcal: 36,  p: 3.6,  c: 5.1, f: 0.2 },
  { name: 'Yogurt greco (0%)',       kcal: 57,  p: 10.0, c: 3.6, f: 0.3, tags: ['yogurt greco magro'] },
  { name: 'Yogurt greco (2%)',       kcal: 73,  p: 9.9,  c: 3.5, f: 2.0, tags: ['yogurt greco'] },
  { name: 'Yogurt greco (5%)',       kcal: 97,  p: 9.0,  c: 3.4, f: 5.0 },
  { name: 'Yogurt bianco intero',    kcal: 61,  p: 3.5,  c: 4.7, f: 3.2, tags: ['yogurt'] },
  { name: 'Ricotta vaccina',         kcal: 146, p: 11.3, c: 3.1, f: 10.0, tags: ['ricotta'] },
  { name: 'Mozzarella',              kcal: 254, p: 18.0, c: 2.2, f: 19.5, tags: ['mozzarella'] },
  { name: 'Mozzarella light',        kcal: 152, p: 19.9, c: 2.4, f: 7.2 },
  { name: 'Parmigiano Reggiano',     kcal: 392, p: 33.0, c: 0.0, f: 28.4, tags: ['parmigiano', 'grana padano', 'grana'] },
  { name: 'Grana Padano',           kcal: 384, p: 33.0, c: 0.0, f: 28.0 },
  { name: 'Gorgonzola',             kcal: 330, p: 19.0, c: 0.0, f: 28.0 },
  { name: 'Formaggi freschi light',  kcal: 100, p: 11.4, c: 4.0, f: 4.4, tags: ['philadelphia light', 'formaggino light'] },
  { name: 'Cottage cheese',         kcal: 98,  p: 11.1, c: 3.4, f: 4.3 },
  { name: 'Fiocchi di latte',       kcal: 99,  p: 12.4, c: 2.7, f: 4.3, tags: ['fiocchi latte', 'quark'] },
  { name: 'Panna da cucina',        kcal: 337, p: 2.3,  c: 2.9, f: 35.0, tags: ['panna'] },
  { name: 'Burro',                  kcal: 758, p: 0.7,  c: 0.6, f: 83.4 },

  // ── LEGUMI ────────────────────────────────────────────────────────────────
  { name: 'Ceci (cotti)',            kcal: 164, p: 8.9,  c: 22.5, f: 2.6, tags: ['ceci'] },
  { name: 'Lenticchie (cotte)',     kcal: 116, p: 9.0,  c: 16.3, f: 0.5, tags: ['lenticchie'] },
  { name: 'Fagioli borlotti (cotti)', kcal: 93, p: 6.3, c: 12.1, f: 0.5, tags: ['fagioli', 'borlotti'] },
  { name: 'Fagioli neri (cotti)',   kcal: 132, p: 8.9,  c: 23.7, f: 0.5 },
  { name: 'Edamame (cotti)',        kcal: 121, p: 11.9, c: 8.9,  f: 5.2, tags: ['soia verde'] },
  { name: 'Tofu compatto',          kcal: 76,  p: 8.0,  c: 1.9,  f: 4.2, tags: ['tofu', 'soia'] },
  { name: 'Piselli (cotti)',        kcal: 84,  p: 5.4,  c: 14.5, f: 0.2, tags: ['piselli'] },
  { name: 'Fave (cotte)',           kcal: 72,  p: 7.6,  c: 8.8,  f: 0.3, tags: ['fave'] },

  // ── VERDURE ───────────────────────────────────────────────────────────────
  { name: 'Spinaci (cotti)',        kcal: 23,  p: 2.9,  c: 1.4,  f: 0.5, tags: ['spinaci'] },
  { name: 'Broccoli (cotti)',       kcal: 35,  p: 2.4,  c: 4.8,  f: 0.4, tags: ['broccoli'] },
  { name: 'Zucchine (cotte)',       kcal: 17,  p: 1.2,  c: 2.5,  f: 0.2, tags: ['zucchine', 'zucchina'] },
  { name: 'Pomodori',              kcal: 18,  p: 0.9,  c: 3.5,  f: 0.2, tags: ['pomodoro', 'tomato'] },
  { name: 'Insalata mista',        kcal: 15,  p: 1.3,  c: 1.8,  f: 0.2, tags: ['lattuga', 'insalata', 'rucola'] },
  { name: 'Cetrioli',              kcal: 12,  p: 0.6,  c: 2.2,  f: 0.1, tags: ['cetriolo'] },
  { name: 'Peperoni',              kcal: 27,  p: 1.0,  c: 5.5,  f: 0.3, tags: ['peperone', 'pepper'] },
  { name: 'Carote',                kcal: 35,  p: 0.9,  c: 7.1,  f: 0.2, tags: ['carota'] },
  { name: 'Sedano',                kcal: 14,  p: 0.7,  c: 2.2,  f: 0.2 },
  { name: 'Cavolo cappuccio',      kcal: 25,  p: 1.3,  c: 4.2,  f: 0.2, tags: ['cavolo'] },
  { name: 'Funghi champignon',     kcal: 22,  p: 3.1,  c: 1.7,  f: 0.3, tags: ['funghi', 'mushroom'] },
  { name: 'Asparagi (cotti)',      kcal: 22,  p: 2.3,  c: 1.8,  f: 0.2, tags: ['asparagi'] },
  { name: 'Melanzane (cotte)',     kcal: 35,  p: 0.8,  c: 5.7,  f: 0.2, tags: ['melanzane'] },
  { name: 'Cipolla',              kcal: 40,  p: 1.1,  c: 8.6,  f: 0.1, tags: ['cipolle'] },
  { name: 'Aglio',                kcal: 149, p: 6.4,  c: 31.0, f: 0.5 },
  { name: 'Patate (cotte)',       kcal: 93,  p: 2.0,  c: 21.1, f: 0.1, tags: ['patate', 'potato'] },
  { name: 'Patate dolci (cotte)', kcal: 90,  p: 2.0,  c: 20.7, f: 0.1, tags: ['patata dolce', 'sweet potato'] },

  // ── FRUTTA ────────────────────────────────────────────────────────────────
  { name: 'Banana',               kcal: 89,  p: 1.1,  c: 22.8, f: 0.3, tags: ['banane'] },
  { name: 'Mela',                 kcal: 52,  p: 0.3,  c: 13.8, f: 0.2, tags: ['mele', 'apple'] },
  { name: 'Arancia',              kcal: 47,  p: 0.9,  c: 11.0, f: 0.1, tags: ['arance', 'orange'] },
  { name: 'Pera',                 kcal: 57,  p: 0.4,  c: 15.3, f: 0.1, tags: ['pere'] },
  { name: 'Uva',                  kcal: 69,  p: 0.7,  c: 17.1, f: 0.2 },
  { name: 'Fragole',              kcal: 32,  p: 0.7,  c: 7.7,  f: 0.3, tags: ['fragola', 'strawberry'] },
  { name: 'Mirtilli',             kcal: 57,  p: 0.7,  c: 14.5, f: 0.3, tags: ['mirtillo', 'blueberry'] },
  { name: 'Ananas',               kcal: 50,  p: 0.5,  c: 13.1, f: 0.1, tags: ['pineapple'] },
  { name: 'Mango',                kcal: 60,  p: 0.8,  c: 15.0, f: 0.4 },
  { name: 'Kiwi',                 kcal: 61,  p: 1.1,  c: 14.7, f: 0.5 },
  { name: 'Pompelmo',             kcal: 42,  p: 0.8,  c: 10.7, f: 0.1 },
  { name: 'Avocado',              kcal: 160, p: 2.0,  c: 8.5,  f: 14.7 },
  { name: 'Dattero secco',        kcal: 277, p: 1.8,  c: 74.9, f: 0.2, tags: ['datteri'] },
  { name: 'Uvetta',               kcal: 299, p: 3.1,  c: 79.2, f: 0.5, tags: ['uva passa'] },

  // ── FRUTTA SECCA & SEMI ───────────────────────────────────────────────────
  { name: 'Mandorle',             kcal: 579, p: 21.2, c: 21.7, f: 49.9, tags: ['mandorla', 'almond'] },
  { name: 'Noci',                 kcal: 654, p: 15.2, c: 13.7, f: 65.2, tags: ['noce', 'walnut'] },
  { name: 'Nocciole',             kcal: 628, p: 15.0, c: 16.7, f: 60.8, tags: ['nocciola', 'hazelnut'] },
  { name: 'Anacardi',             kcal: 553, p: 18.2, c: 30.2, f: 43.8, tags: ['anacardo', 'cashew'] },
  { name: 'Burro di arachidi',    kcal: 588, p: 25.1, c: 20.0, f: 50.4, tags: ['peanut butter', 'arachidi'] },
  { name: 'Semi di chia',         kcal: 486, p: 16.5, c: 42.1, f: 30.7, tags: ['chia'] },
  { name: 'Semi di lino',         kcal: 534, p: 18.3, c: 28.9, f: 42.2, tags: ['lino', 'flax'] },
  { name: 'Semi di zucca',        kcal: 559, p: 30.2, c: 10.7, f: 49.1 },

  // ── OLI & CONDIMENTI ──────────────────────────────────────────────────────
  { name: 'Olio d\'oliva extravergine', kcal: 884, p: 0.0, c: 0.0, f: 100.0, tags: ['olio oliva', 'evo', 'olio'] },
  { name: 'Olio di semi di girasole',  kcal: 884, p: 0.0, c: 0.0, f: 100.0, tags: ['olio girasole'] },
  { name: 'Maionese',             kcal: 680, p: 1.0,  c: 2.0,  f: 75.0 },
  { name: 'Ketchup',              kcal: 101, p: 1.7,  c: 25.0, f: 0.1 },
  { name: 'Senape',               kcal: 66,  p: 4.4,  c: 5.8,  f: 3.5 },
  { name: 'Salsa di soia',        kcal: 53,  p: 8.1,  c: 4.8,  f: 0.6 },
  { name: 'Aceto balsamico',      kcal: 88,  p: 0.5,  c: 17.0, f: 0.0 },

  // ── DOLCI & SNACK ─────────────────────────────────────────────────────────
  { name: 'Cioccolato fondente (70%)', kcal: 598, p: 7.0, c: 46.0, f: 42.6, tags: ['cioccolato', 'dark chocolate'] },
  { name: 'Cioccolato al latte',  kcal: 535, p: 7.7,  c: 59.2, f: 29.7 },
  { name: 'Miele',                kcal: 304, p: 0.3,  c: 82.4, f: 0.0 },
  { name: 'Marmellata',           kcal: 250, p: 0.6,  c: 65.0, f: 0.0 },
  { name: 'Biscotti secchi',      kcal: 454, p: 7.5,  c: 70.0, f: 16.0 },
  { name: 'Cornetto / brioche',   kcal: 370, p: 6.5,  c: 49.0, f: 16.0 },

  // ── BEVANDE ───────────────────────────────────────────────────────────────
  { name: 'Caffè espresso',       kcal: 2,   p: 0.1,  c: 0.0,  f: 0.0, tags: ['caffe', 'espresso', 'coffee'] },
  { name: 'Latte di soia',        kcal: 33,  p: 3.3,  c: 1.8,  f: 1.8, tags: ['soia latte'] },
  { name: 'Latte di mandorla',    kcal: 24,  p: 0.6,  c: 3.2,  f: 1.1 },
  { name: 'Latte di avena',       kcal: 47,  p: 1.0,  c: 7.9,  f: 1.5 },
  { name: 'Succo d\'arancia',     kcal: 45,  p: 0.7,  c: 10.4, f: 0.2, tags: ['succo arancia', 'orange juice'] },
  { name: 'Acqua',                kcal: 0,   p: 0.0,  c: 0.0,  f: 0.0 },

  // ── INTEGRATORI ───────────────────────────────────────────────────────────
  { name: 'Whey Protein (polvere)', kcal: 380, p: 75.0, c: 8.0,  f: 5.0, tags: ['whey', 'proteine del siero', 'protein powder', 'proteina'] },
  { name: 'Caseina (polvere)',     kcal: 375, p: 80.0, c: 5.0,  f: 3.0, tags: ['casein', 'caseina'] },
  { name: 'Creatina',             kcal: 0,   p: 0.0,  c: 0.0,  f: 0.0 },
  { name: 'Maltodestrine',        kcal: 387, p: 0.1,  c: 95.0, f: 0.0, tags: ['malto', 'carbs'] },
  { name: 'Barretta proteica media', kcal: 350, p: 28.0, c: 35.0, f: 8.0, tags: ['barretta', 'protein bar'] },

  // ── PIATTI PRONTI ITALIANI ────────────────────────────────────────────────
  { name: 'Pizza margherita (forno)', kcal: 250, p: 11.0, c: 33.0, f: 8.0, tags: ['pizza'] },
  { name: 'Risotto al pomodoro',  kcal: 142, p: 3.8,  c: 28.0, f: 2.0, tags: ['risotto'] },
  { name: 'Minestrone di verdure', kcal: 45,  p: 2.5,  c: 6.5,  f: 1.0, tags: ['minestrone', 'zuppa'] },
  { name: 'Pasta al ragù (porzione)', kcal: 185, p: 8.0,  c: 26.0, f: 5.5, tags: ['ragù', 'bolognese'] },
]

/**
 * Cerca alimenti nel database locale.
 * Supporta match parziale, insensibile a maiuscole/diacritici.
 */
export function searchFoods(query: string, limit = 6): Food[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const words = q.split(/\s+/).filter(Boolean)

  const scored = FOODS.map(food => {
    const haystack = normalize(food.name + ' ' + (food.tags?.join(' ') ?? ''))
    let score = 0

    // Match esatto del nome
    if (haystack.startsWith(q)) score += 100
    // Match parziale nel nome
    if (haystack.includes(q)) score += 50
    // Ogni parola della query che compare
    for (const w of words) {
      if (haystack.includes(w)) score += 20
      if (normalize(food.name).startsWith(w)) score += 30
    }

    return { food, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.food)
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // rimuove diacritici (à → a)
    .replace(/['']/g, '')
}

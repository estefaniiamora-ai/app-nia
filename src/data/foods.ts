/* ===========================================================
   Tabla de alimentos — valores por cada 100 g (o 100 ml).
   Son valores promedio de referencia, suficientes para llevar
   un control diario. No reemplazan la etiqueta del producto.
   =========================================================== */

export interface FoodPortion {
  label: string   // '1 huevo', '1 taza'
  grams: number
}

export interface Food {
  id: string
  name: string
  emoji: string
  group: FoodGroup
  /** por 100 g */
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** porciones típicas para no tener que pesar */
  portions?: FoodPortion[]
}

export type FoodGroup =
  | 'proteina'
  | 'carbo'
  | 'fruta'
  | 'verdura'
  | 'lacteo'
  | 'grasa'
  | 'bebida'
  | 'antojo'

export const FOOD_GROUPS: { key: FoodGroup; label: string; emoji: string }[] = [
  { key: 'proteina', label: 'Proteínas', emoji: '🍗' },
  { key: 'carbo', label: 'Carbohidratos', emoji: '🍚' },
  { key: 'fruta', label: 'Frutas', emoji: '🍎' },
  { key: 'verdura', label: 'Verduras', emoji: '🥦' },
  { key: 'lacteo', label: 'Lácteos', emoji: '🥛' },
  { key: 'grasa', label: 'Grasas', emoji: '🥑' },
  { key: 'bebida', label: 'Bebidas', emoji: '🥤' },
  { key: 'antojo', label: 'Antojos', emoji: '🍫' },
]

export const FOODS: Food[] = [
  /* ---------- Proteínas ---------- */
  { id: 'pollo_pechuga', name: 'Pechuga de pollo', emoji: '🍗', group: 'proteina', kcal: 165, protein: 31, carbs: 0, fat: 3.6, portions: [{ label: '1 pechuga', grams: 150 }, { label: '1 porción', grams: 120 }] },
  { id: 'pollo_muslo', name: 'Muslo de pollo', emoji: '🍗', group: 'proteina', kcal: 209, protein: 26, carbs: 0, fat: 11, portions: [{ label: '1 muslo', grams: 110 }] },
  { id: 'huevo', name: 'Huevo', emoji: '🥚', group: 'proteina', kcal: 143, protein: 13, carbs: 1.1, fat: 9.5, portions: [{ label: '1 huevo', grams: 50 }, { label: '2 huevos', grams: 100 }] },
  { id: 'clara_huevo', name: 'Clara de huevo', emoji: '🥚', group: 'proteina', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, portions: [{ label: '1 clara', grams: 33 }] },
  { id: 'carne_res', name: 'Carne de res magra', emoji: '🥩', group: 'proteina', kcal: 217, protein: 26, carbs: 0, fat: 12, portions: [{ label: '1 bistec', grams: 130 }] },
  { id: 'carne_cerdo', name: 'Cerdo (lomo)', emoji: '🥩', group: 'proteina', kcal: 242, protein: 27, carbs: 0, fat: 14, portions: [{ label: '1 porción', grams: 120 }] },
  { id: 'pescado_tilapia', name: 'Tilapia / pescado blanco', emoji: '🐟', group: 'proteina', kcal: 96, protein: 20, carbs: 0, fat: 1.7, portions: [{ label: '1 filete', grams: 130 }] },
  { id: 'salmon', name: 'Salmón', emoji: '🐟', group: 'proteina', kcal: 208, protein: 20, carbs: 0, fat: 13, portions: [{ label: '1 filete', grams: 130 }] },
  { id: 'atun_agua', name: 'Atún en agua', emoji: '🐟', group: 'proteina', kcal: 116, protein: 26, carbs: 0, fat: 1, portions: [{ label: '1 lata', grams: 140 }] },
  { id: 'camaron', name: 'Camarón', emoji: '🦐', group: 'proteina', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, portions: [{ label: '1 porción', grams: 100 }] },
  { id: 'jamon', name: 'Jamón de pavo', emoji: '🥓', group: 'proteina', kcal: 104, protein: 17, carbs: 2.5, fat: 3, portions: [{ label: '1 tajada', grams: 25 }] },
  { id: 'salchicha', name: 'Salchicha', emoji: '🌭', group: 'proteina', kcal: 290, protein: 11, carbs: 3, fat: 26, portions: [{ label: '1 salchicha', grams: 45 }] },
  { id: 'lentejas', name: 'Lentejas cocidas', emoji: '🫘', group: 'proteina', kcal: 116, protein: 9, carbs: 20, fat: 0.4, portions: [{ label: '1 taza', grams: 200 }] },
  { id: 'frijoles', name: 'Fríjoles cocidos', emoji: '🫘', group: 'proteina', kcal: 127, protein: 8.7, carbs: 23, fat: 0.5, portions: [{ label: '1 taza', grams: 180 }] },
  { id: 'garbanzos', name: 'Garbanzos cocidos', emoji: '🫘', group: 'proteina', kcal: 164, protein: 8.9, carbs: 27, fat: 2.6, portions: [{ label: '1 taza', grams: 165 }] },
  { id: 'proteina_polvo', name: 'Proteína en polvo', emoji: '🥤', group: 'proteina', kcal: 380, protein: 78, carbs: 8, fat: 4, portions: [{ label: '1 scoop', grams: 30 }] },

  /* ---------- Carbohidratos ---------- */
  { id: 'arroz_blanco', name: 'Arroz blanco cocido', emoji: '🍚', group: 'carbo', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, portions: [{ label: '1 taza', grams: 160 }, { label: '1 porción', grams: 120 }] },
  { id: 'arroz_integral', name: 'Arroz integral cocido', emoji: '🍚', group: 'carbo', kcal: 123, protein: 2.7, carbs: 26, fat: 1, portions: [{ label: '1 taza', grams: 160 }] },
  { id: 'pasta', name: 'Pasta cocida', emoji: '🍝', group: 'carbo', kcal: 131, protein: 5, carbs: 25, fat: 1.1, portions: [{ label: '1 taza', grams: 140 }] },
  { id: 'papa', name: 'Papa cocida', emoji: '🥔', group: 'carbo', kcal: 87, protein: 2, carbs: 20, fat: 0.1, portions: [{ label: '1 papa mediana', grams: 150 }] },
  { id: 'papa_frita', name: 'Papas fritas', emoji: '🍟', group: 'carbo', kcal: 312, protein: 3.4, carbs: 41, fat: 15, portions: [{ label: '1 porción', grams: 120 }] },
  { id: 'yuca', name: 'Yuca cocida', emoji: '🥔', group: 'carbo', kcal: 160, protein: 1.4, carbs: 38, fat: 0.3, portions: [{ label: '1 porción', grams: 120 }] },
  { id: 'platano', name: 'Plátano cocido', emoji: '🍌', group: 'carbo', kcal: 122, protein: 1.3, carbs: 32, fat: 0.4, portions: [{ label: '1 tajada', grams: 40 }] },
  { id: 'arepa', name: 'Arepa', emoji: '🫓', group: 'carbo', kcal: 210, protein: 4.5, carbs: 44, fat: 1.8, portions: [{ label: '1 arepa', grams: 80 }] },
  { id: 'pan_tajado', name: 'Pan tajado', emoji: '🍞', group: 'carbo', kcal: 265, protein: 9, carbs: 49, fat: 3.2, portions: [{ label: '1 tajada', grams: 28 }] },
  { id: 'pan_integral', name: 'Pan integral', emoji: '🍞', group: 'carbo', kcal: 247, protein: 13, carbs: 41, fat: 3.4, portions: [{ label: '1 tajada', grams: 30 }] },
  { id: 'avena', name: 'Avena en hojuelas', emoji: '🥣', group: 'carbo', kcal: 389, protein: 17, carbs: 66, fat: 7, portions: [{ label: '1/2 taza', grams: 40 }] },
  { id: 'tortilla_maiz', name: 'Tortilla de maíz', emoji: '🌮', group: 'carbo', kcal: 218, protein: 5.7, carbs: 45, fat: 2.9, portions: [{ label: '1 tortilla', grams: 30 }] },
  { id: 'quinoa', name: 'Quinua cocida', emoji: '🌾', group: 'carbo', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, portions: [{ label: '1 taza', grams: 185 }] },
  { id: 'granola', name: 'Granola', emoji: '🥣', group: 'carbo', kcal: 471, protein: 10, carbs: 64, fat: 20, portions: [{ label: '1/2 taza', grams: 45 }] },
  { id: 'empanada', name: 'Empanada', emoji: '🥟', group: 'carbo', kcal: 290, protein: 7, carbs: 30, fat: 16, portions: [{ label: '1 empanada', grams: 90 }] },

  /* ---------- Frutas ---------- */
  { id: 'banano', name: 'Banano', emoji: '🍌', group: 'fruta', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, portions: [{ label: '1 banano', grams: 120 }] },
  { id: 'manzana', name: 'Manzana', emoji: '🍎', group: 'fruta', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, portions: [{ label: '1 manzana', grams: 180 }] },
  { id: 'naranja', name: 'Naranja', emoji: '🍊', group: 'fruta', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, portions: [{ label: '1 naranja', grams: 150 }] },
  { id: 'fresa', name: 'Fresas', emoji: '🍓', group: 'fruta', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, portions: [{ label: '1 taza', grams: 150 }] },
  { id: 'papaya', name: 'Papaya', emoji: '🍈', group: 'fruta', kcal: 43, protein: 0.5, carbs: 11, fat: 0.3, portions: [{ label: '1 taza', grams: 145 }] },
  { id: 'mango', name: 'Mango', emoji: '🥭', group: 'fruta', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, portions: [{ label: '1 mango', grams: 200 }] },
  { id: 'piña', name: 'Piña', emoji: '🍍', group: 'fruta', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, portions: [{ label: '1 taza', grams: 165 }] },
  { id: 'uvas', name: 'Uvas', emoji: '🍇', group: 'fruta', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, portions: [{ label: '1 taza', grams: 150 }] },
  { id: 'sandia', name: 'Sandía', emoji: '🍉', group: 'fruta', kcal: 30, protein: 0.6, carbs: 8, fat: 0.2, portions: [{ label: '1 taza', grams: 150 }] },
  { id: 'aguacate', name: 'Aguacate', emoji: '🥑', group: 'grasa', kcal: 160, protein: 2, carbs: 9, fat: 15, portions: [{ label: '1/2 aguacate', grams: 100 }] },

  /* ---------- Verduras ---------- */
  { id: 'brocoli', name: 'Brócoli', emoji: '🥦', group: 'verdura', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, portions: [{ label: '1 taza', grams: 90 }] },
  { id: 'zanahoria', name: 'Zanahoria', emoji: '🥕', group: 'verdura', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, portions: [{ label: '1 zanahoria', grams: 70 }] },
  { id: 'tomate', name: 'Tomate', emoji: '🍅', group: 'verdura', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, portions: [{ label: '1 tomate', grams: 120 }] },
  { id: 'lechuga', name: 'Lechuga', emoji: '🥬', group: 'verdura', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, portions: [{ label: '1 taza', grams: 50 }] },
  { id: 'espinaca', name: 'Espinaca', emoji: '🥬', group: 'verdura', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, portions: [{ label: '1 taza', grams: 30 }] },
  { id: 'pepino', name: 'Pepino', emoji: '🥒', group: 'verdura', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, portions: [{ label: '1 taza', grams: 120 }] },
  { id: 'cebolla', name: 'Cebolla', emoji: '🧅', group: 'verdura', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, portions: [{ label: '1/2 cebolla', grams: 60 }] },
  { id: 'ensalada_mixta', name: 'Ensalada mixta', emoji: '🥗', group: 'verdura', kcal: 25, protein: 1.2, carbs: 5, fat: 0.3, portions: [{ label: '1 plato', grams: 150 }] },

  /* ---------- Lácteos ---------- */
  { id: 'leche_entera', name: 'Leche entera', emoji: '🥛', group: 'lacteo', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, portions: [{ label: '1 vaso', grams: 240 }] },
  { id: 'leche_deslactosada', name: 'Leche deslactosada', emoji: '🥛', group: 'lacteo', kcal: 47, protein: 3.4, carbs: 4.7, fat: 1.5, portions: [{ label: '1 vaso', grams: 240 }] },
  { id: 'yogurt_natural', name: 'Yogurt natural', emoji: '🥣', group: 'lacteo', kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, portions: [{ label: '1 vaso', grams: 200 }] },
  { id: 'yogurt_griego', name: 'Yogurt griego', emoji: '🥣', group: 'lacteo', kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, portions: [{ label: '1 vaso', grams: 170 }] },
  { id: 'queso_campesino', name: 'Queso campesino', emoji: '🧀', group: 'lacteo', kcal: 240, protein: 18, carbs: 3, fat: 17, portions: [{ label: '1 tajada', grams: 30 }] },
  { id: 'queso_mozzarella', name: 'Queso mozzarella', emoji: '🧀', group: 'lacteo', kcal: 280, protein: 22, carbs: 2.2, fat: 20, portions: [{ label: '1 tajada', grams: 30 }] },

  /* ---------- Grasas ---------- */
  { id: 'aceite_oliva', name: 'Aceite de oliva', emoji: '🫒', group: 'grasa', kcal: 884, protein: 0, carbs: 0, fat: 100, portions: [{ label: '1 cucharada', grams: 14 }] },
  { id: 'mantequilla', name: 'Mantequilla', emoji: '🧈', group: 'grasa', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, portions: [{ label: '1 cucharada', grams: 14 }] },
  { id: 'mani', name: 'Maní', emoji: '🥜', group: 'grasa', kcal: 567, protein: 26, carbs: 16, fat: 49, portions: [{ label: '1 puñado', grams: 30 }] },
  { id: 'almendras', name: 'Almendras', emoji: '🌰', group: 'grasa', kcal: 579, protein: 21, carbs: 22, fat: 50, portions: [{ label: '1 puñado', grams: 30 }] },
  { id: 'mantequilla_mani', name: 'Mantequilla de maní', emoji: '🥜', group: 'grasa', kcal: 588, protein: 25, carbs: 20, fat: 50, portions: [{ label: '1 cucharada', grams: 16 }] },

  /* ---------- Bebidas ---------- */
  { id: 'agua', name: 'Agua', emoji: '💧', group: 'bebida', kcal: 0, protein: 0, carbs: 0, fat: 0, portions: [{ label: '1 vaso', grams: 250 }] },
  { id: 'cafe_negro', name: 'Café negro', emoji: '☕', group: 'bebida', kcal: 2, protein: 0.1, carbs: 0, fat: 0, portions: [{ label: '1 pocillo', grams: 200 }] },
  { id: 'cafe_leche', name: 'Café con leche', emoji: '☕', group: 'bebida', kcal: 45, protein: 2.4, carbs: 4, fat: 2.2, portions: [{ label: '1 pocillo', grams: 200 }] },
  { id: 'jugo_natural', name: 'Jugo natural', emoji: '🧃', group: 'bebida', kcal: 45, protein: 0.5, carbs: 11, fat: 0.1, portions: [{ label: '1 vaso', grams: 250 }] },
  { id: 'gaseosa', name: 'Gaseosa', emoji: '🥤', group: 'bebida', kcal: 42, protein: 0, carbs: 11, fat: 0, portions: [{ label: '1 vaso', grams: 250 }, { label: '1 lata', grams: 330 }] },
  { id: 'cerveza', name: 'Cerveza', emoji: '🍺', group: 'bebida', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, portions: [{ label: '1 lata', grams: 330 }] },

  /* ---------- Antojos ---------- */
  { id: 'chocolatina', name: 'Chocolatina', emoji: '🍫', group: 'antojo', kcal: 535, protein: 7.6, carbs: 59, fat: 30, portions: [{ label: '1 chocolatina', grams: 45 }] },
  { id: 'helado', name: 'Helado', emoji: '🍦', group: 'antojo', kcal: 207, protein: 3.5, carbs: 24, fat: 11, portions: [{ label: '1 bola', grams: 70 }] },
  { id: 'galletas', name: 'Galletas', emoji: '🍪', group: 'antojo', kcal: 480, protein: 6, carbs: 65, fat: 21, portions: [{ label: '1 paquete', grams: 40 }] },
  { id: 'torta', name: 'Torta / ponqué', emoji: '🍰', group: 'antojo', kcal: 350, protein: 4.5, carbs: 50, fat: 15, portions: [{ label: '1 porción', grams: 100 }] },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', group: 'antojo', kcal: 266, protein: 11, carbs: 33, fat: 10, portions: [{ label: '1 porción', grams: 110 }] },
  { id: 'hamburguesa', name: 'Hamburguesa', emoji: '🍔', group: 'antojo', kcal: 254, protein: 13, carbs: 22, fat: 12, portions: [{ label: '1 hamburguesa', grams: 220 }] },
  { id: 'papas_paquete', name: 'Papas de paquete', emoji: '🥔', group: 'antojo', kcal: 536, protein: 7, carbs: 53, fat: 34, portions: [{ label: '1 paquete', grams: 40 }] },
]

/** Quita tildes y pasa a minúsculas, para buscar sin preocuparse. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Busca alimentos por nombre (sin importar tildes ni mayúsculas). */
export function searchFoods(query: string, limit = 40): Food[] {
  const q = normalize(query.trim())
  if (!q) return FOODS.slice(0, limit)
  const starts: Food[] = []
  const contains: Food[] = []
  for (const f of FOODS) {
    const n = normalize(f.name)
    if (n.startsWith(q)) starts.push(f)
    else if (n.includes(q)) contains.push(f)
  }
  return [...starts, ...contains].slice(0, limit)
}

export function foodById(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id)
}

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** Calcula los nutrientes de `grams` gramos de un alimento (enteros). */
export function macrosFor(food: Food, grams: number): Macros {
  const k = grams / 100
  return {
    kcal: Math.round(food.kcal * k),
    protein: Math.round(food.protein * k),
    carbs: Math.round(food.carbs * k),
    fat: Math.round(food.fat * k),
  }
}

/** Suma los nutrientes de varios registros. */
export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

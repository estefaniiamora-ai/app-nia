# Nia — app de finanzas personales de Stefania

> ⚠️ **Antes de nada:** si quien escribe es **Stefania**, activa la skill `/iniciar` y sigue sus reglas
> (`.claude/skills/iniciar/SKILL.md`). Ella no sabe programar: nada de tecnicismos, nada de código,
> nada de terminal. Este archivo es la parte técnica, para ti.

## Qué es

PWA (React 18 + TypeScript + Vite 5) para llevar finanzas personales, con seguimiento del ciclo
menstrual, registro de gym, control de nutrientes, clases de inglés y un conejito virtual con racha, skins y tienda.
Interfaz en español, tema rosa pastel. Nació móvil; `src/styles/desktop.css` la adapta a computador
(menú lateral, contenido ancho, hojas centradas) solo con media queries.

- **Datos / auth:** Firebase (Firestore + Auth con Google). Proyecto `app-nia-1f70a`.
- **Hosting:** Vercel — cada push a `main` despliega solo.
- **Config de Firebase:** está en claro en `src/firebase/config.ts` a propósito (config de cliente,
  no es secreta). No hace falta `.env`.

## Comandos

Node 22 está instalado en `~/.local/lib/node` (no es del sistema). En cada shell nuevo:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

| Acción                    | Comando           |
| ------------------------- | ----------------- |
| Servidor local            | `npm run dev` → http://localhost:5173 |
| Verificar que compila     | `npm run build`   |
| Ver el build de producción| `npm run preview` |

**Regla:** `npm run build` tiene que pasar **antes** de cada push. `tsc -b` corre ahí, así que es el
único chequeo de tipos del proyecto (no hay tests ni linter).

## Estructura

```
src/
  screens/      pantallas (Home, Movements, Accounts, Ciclo, Shop, Stats, Notes, Settings…)
  components/   UI reutilizable; Cat/ es el gatico y sus skins
  data/         capa de datos: provider.ts (interfaz) + firebaseProvider.ts + localProvider.ts,
                types.ts (modelos), shop.ts, seed.ts, selectors.ts, reminders.ts, tokens.ts,
                foods.ts (tabla de alimentos por 100 g) y parseComida.ts (entiende frases
                tipo "2 huevos y una arepa" sin internet)
  store/        store.tsx — contexto global de la app
  firebase/     config.ts y AuthProvider.tsx
  lib/          utilidades (cycle, date, money, emoji, id) y notificaciones.ts
                (recordatorios locales; sin servidor, con respaldo dentro de la app)
  styles/       global.css y ui.css (variables de tema)
```

Rutas en `src/App.tsx`: `/`, `/movimientos`, `/cuentas`, `/ajustes`, `/configuracion`, `/tienda`,
`/estadisticas`, `/notas`, `/ciclo`, `/gym`, `/comida`, `/ingles`, `/recordatorios`.

## Convenciones que hay que respetar

- **Los montos se guardan en centavos (enteros).** Nunca uses decimales para dinero; formatea con
  `lib/money.ts`. Misma idea en el gym: los pesos van en **gramos** (`weightG`), no en kilos con coma.
- **Los datos son de la vida real de Stefania.** No borres ni migres documentos de Firestore sin
  autorización explícita. Los borrados en la app son lógicos (`archived`, `deleted`), no físicos.
- **Compatibilidad hacia atrás:** varios campos son opcionales porque hay registros viejos sin ellos
  (`currency` ausente = `'COP'`, `kind` ausente = `'normal'`). Al agregar campos, hazlos opcionales y
  dales valor por defecto al leer.
- **Toda la UI y los comentarios van en español.**
- Los cambios de datos pasan por `DataProvider` (`src/data/provider.ts`); no llames a Firestore
  directo desde una pantalla.
- Estilos: CSS plano por componente, con las variables de tema de `src/styles/ui.css`. No hay
  framework de CSS.

## Publicar

`main` es la rama de producción y va directo a Vercel. Flujo:

```bash
npm run build && git add -A && git commit -m "..." && git push origin main
```

Mensajes de commit en español y descriptivos. Stiven autorizó publicar automáticamente los cambios
que pida Stefania; pide confirmación solo si el cambio borra datos o es difícil de revertir.

## Soporte

Si algo se complica de verdad o Stefania se pierde: **Zeven, 3208435143**.

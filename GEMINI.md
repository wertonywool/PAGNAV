# Guía Maestra para Añadir Estilos en PagNav 2.0

Este documento sirve como instrucción definitiva para añadir nuevos temas al ecosistema PagNav asegurando consistencia visual y funcional.

## Estructura del Proyecto (Arquitectura Atómica)
- `css/variables.css`: Control de escalas y gaps responsivos.
- `css/header.css`: Estilos de la barra superior.
- `css/grid.css`: Lógica de celdas (1x1, 2x2, etc).
- `css/cards.css`: Estilo base de las tarjetas.
- `css/actions.css`: **IMPORTANTE:** Aquí se definen las formas y colores únicos de los botones de acción (Borrar, Editar, Info) por cada tema.
- `css/customizer.css`: **IMPORTANTE:** Aquí se definen los círculos de previsualización de color para el panel.
- `css/themes/`: Carpeta donde reside el archivo `.css` individual de cada tema.

---

## Pasos para Agregar un Nuevo Estilo

### Paso 1: Crear el archivo del tema
Crear `css/themes/[nombre_tema].css`. Debe contener:
- Variables `:root` (`--accent`, `--bg-main`, `--text-main`, etc.).
- Fuentes personalizadas (Google Fonts).
- Overrides de `.nav-card` (bordes, sombras, animaciones).
- Estilos para `.card-title` y `.logo-icon`.

### Paso 2: Registrar en el Panel (index.html)
Insertar el botón dentro de la categoría correspondiente en `index.html`:
```html
<div class="theme-option">
    <button class="preset-btn" data-theme="[nombre_tema]"></button>
    <span class="theme-name">[Nombre Visual]</span>
</div>
```

### Paso 3: Añadir Previsualización de Color (css/customizer.css)
Añadir el gradiente que representa al tema:
```css
.preset-btn[data-theme="[nombre_tema]"] { 
    background: linear-gradient(135deg, [Color1], [Color2]); 
    border-color: [ColorBorde]; 
}
```

### Paso 4: Personalizar Botones de Acción (css/actions.css)
Definir cómo se ven los botones de borrar, editar e info para ese tema específico:
```css
.theme-[nombre_tema] .card-btn {
    border-radius: [valor];
    background: [color];
    /* Otras propiedades únicas */
}
.theme-[nombre_tema] .delete-btn { ... }
.theme-[nombre_tema] .edit-btn { ... }
.theme-[nombre_tema] .info-badge { ... }
```

---

## Mandato para la IA
Cuando el usuario diga "Agrega el estilo [X]", la IA debe realizar los 4 pasos anteriores de forma quirúrgica, manteniendo la limpieza del CSS modular y asegurando que el diseño sea responsivo (especialmente la escala de iconos en móviles).

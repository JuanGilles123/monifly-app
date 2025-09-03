# Instrucciones para crear íconos de modo oscuro

## Íconos que necesitas crear:

Para que la app se vea perfecta tanto en modo claro como oscuro, necesitas crear versiones específicas de estos íconos:

### 1. **favicon-dark.ico** (Favicon para modo oscuro)
- Versión del favicon actual pero optimizada para fondos oscuros
- Puede ser el logo en colores claros o con bordes que contrasten en fondos oscuros

### 2. **apple-touch-icon-dark.png** (Ícono de iOS para modo oscuro)
- Tamaño: 180x180 píxeles
- Versión del ícono de iOS pero optimizada para fondos oscuros
- Este es especialmente importante para iPhone/iPad

### 3. **logo192-dark.png** y **logo512-dark.png** (PWA icons para modo oscuro)
- Tamaños: 192x192 y 512x512 píxeles
- Versiones de los logos actuales pero optimizadas para fondos oscuros

## Cómo hacer las versiones oscuras:

### Opción 1: Texto/logo claro sobre fondo transparente
- Si tu logo actual tiene texto/elementos oscuros, hazlos blancos o colores claros
- Mantén el fondo transparente
- Esto hace que se vea bien sobre fondos oscuros

### Opción 2: Agregar borde o contorno
- Mantén los colores originales pero agrega un borde claro
- Esto asegura que el logo sea visible en cualquier fondo

### Opción 3: Versión invertida
- Invierte los colores del logo actual
- Fondo oscuro → claro, texto claro → oscuro

## Ubicación de los archivos:

Guarda todos estos archivos en la carpeta `public/`:

```
public/
├── favicon.ico (existente)
├── favicon-dark.ico (nuevo)
├── apple-touch-icon.png (existente)
├── apple-touch-icon-dark.png (nuevo)
├── logo192.png (existente)
├── logo192-dark.png (nuevo)
├── logo512.png (existente)
└── logo512-dark.png (nuevo)
```

## ¿Cómo funciona?

Una vez que agregues estos archivos:

1. **Navegadores de escritorio**: Automáticamente usarán `favicon-dark.ico` cuando esté en modo oscuro
2. **iPhone/iPad**: Usarán `apple-touch-icon-dark.png` cuando esté en modo oscuro
3. **PWA**: Usarán `logo192-dark.png` y `logo512-dark.png` para la app instalada en modo oscuro

La app ya está configurada para detectar automáticamente cuando el usuario cambia entre modo claro y oscuro, y cambiará los íconos dinámicamente.

## ¿Necesitas ayuda para crear los íconos?

Si no tienes herramientas de diseño, puedes:
1. Usar Canva, GIMP, o herramientas online gratuitas
2. Pedirle a algún diseñador que los haga
3. Usar herramientas de IA como DALL-E o Midjourney

¡Una vez que tengas estos archivos, simplemente ponlos en la carpeta `public/` y la funcionalidad ya está lista!

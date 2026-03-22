// Mostrar fallback SVG si la imagen falla en cargar
['dtector-1', 'dtector-2'].forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('error', () => {
        const svg = document.getElementById(id + '-fallback');
        if (svg) svg.style.display = 'block';
    });
    img.addEventListener('load', () => {
        const svg = document.getElementById(id + '-fallback');
        if (svg) svg.style.display = 'none';
    });
});

// Accesibilidad: focus visible para enlaces
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('show-focus');
});
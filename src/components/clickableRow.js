// Props para que una fila de tabla abra un detalle con clic, Enter o espacio.
export function clickableRow(onOpen, label, extraClass) {
  return {
    className: ['clickable', extraClass].filter(Boolean).join(' '),
    tabIndex: 0,
    title: label,
    'aria-label': label,
    onClick: onOpen,
    onKeyDown: (e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    },
  };
}

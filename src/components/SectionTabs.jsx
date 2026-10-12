import { useRef } from 'react';
import Icon from './Icon.jsx';

// Pestañas accesibles (patrón WAI-ARIA): flechas para moverse, Inicio/Fin para ir a los extremos.
export default function SectionTabs({ tabs, active, onChange, label }) {
  const refs = useRef({});

  function onKeyDown(e) {
    const index = tabs.findIndex((t) => t.id === active);
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        const showDot = !selected && tab.unseen > 0;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            className="tab"
            aria-selected={selected ? 'true' : 'false'}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
            <span className="count">{tab.count}</span>
            {showDot && (
              <span className="tab-dot" data-tone={tab.alert ? 'danger' : 'ok'}>
                <span className="sr-only">
                  {tab.unseen} {tab.unseen === 1 ? 'nuevo' : 'nuevos'}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

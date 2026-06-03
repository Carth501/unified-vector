import type { KeyboardEvent, ReactNode } from "react";
import "./panel.css";

type PanelProps = {
  panelId?: string;
  headingId: string;
  title: string;
  description?: string;
  eyebrow?: string;
  headerContent?: ReactNode;
  footer?: ReactNode;
  errorMessage?: string | null;
  onClick?: () => void;
  selected?: boolean;
  controlsId?: string;
  children: ReactNode;
};

export function Panel({
  panelId,
  headingId,
  title,
  description,
  eyebrow,
  headerContent,
  footer,
  errorMessage,
  onClick,
  selected = false,
  controlsId,
  children,
}: PanelProps) {
  const interactive = typeof onClick === "function";

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onClick();
  };

  const panelContentClassName = [
    "panel-content",
    interactive ? "panel-content-selectable" : "",
    selected ? "panel-content-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className="dashboard-panel"
      id={panelId}
      aria-labelledby={headingId}
    >
      <div className="card panel-card border-0 shadow h-100">
        <div className="card-body">
          <div
            className={panelContentClassName}
            onClick={interactive ? onClick : undefined}
            onKeyDown={interactive ? handleKeyDown : undefined}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-pressed={interactive ? selected : undefined}
            aria-controls={interactive ? controlsId : undefined}
          >
            <div className="panel-header">
              <div>
                {eyebrow ? <p className="panel-kicker">{eyebrow}</p> : null}
                <h2 className="panel-title" id={headingId}>
                  {title}
                </h2>
              </div>
              {headerContent}
            </div>

            {description ? <p className="panel-text">{description}</p> : null}

            {children}
          </div>

          {footer}

          {errorMessage ? (
            <p className="panel-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

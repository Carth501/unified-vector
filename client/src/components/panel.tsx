import type { ReactNode } from "react";

type PanelProps = {
  headingId: string;
  title: string;
  description?: string;
  eyebrow?: string;
  headerContent?: ReactNode;
  footer?: ReactNode;
  errorMessage?: string | null;
  children: ReactNode;
};

export function Panel({
  headingId,
  title,
  description,
  eyebrow,
  headerContent,
  footer,
  errorMessage,
  children,
}: PanelProps) {
  return (
    <article className="dashboard-panel" aria-labelledby={headingId}>
      <div className="card panel-card border-0 shadow-sm h-100">
        <div className="card-body">
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

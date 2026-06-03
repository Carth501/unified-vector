import { Panel } from "./panel";
import "./ScorePanel.css";

export type ScorePanelData = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  busy: boolean;
  errorMessage: string | null;
  onIncrement: () => void;
};

type ScorePanelProps = {
  data: ScorePanelData;
  index: number;
  width: number;
};

const scoreFormatter = new Intl.NumberFormat("en-US");

export function ScorePanel({ data, index, width }: ScorePanelProps) {
  const scoreDisplay =
    data.score === null ? "..." : scoreFormatter.format(data.score);
  const compactLayout = width < 420;
  const headingId = `${data.id}-heading-${index}`;

  return (
    <Panel
      headingId={headingId}
      title={data.title}
      description={data.description}
      errorMessage={data.errorMessage}
    >
      <div className="score-block">
        <span className="score-caption">Global score</span>
        <p className="score-value" aria-live="polite">
          {scoreDisplay}
        </p>
      </div>

      <div className="action-row centered">
        <button
          type="button"
          className={`btn btn-primary btn-lg ${compactLayout ? "w-100" : ""}`.trim()}
          onClick={data.onIncrement}
          disabled={data.busy}
        >
          Add a Point
        </button>
      </div>
    </Panel>
  );
}

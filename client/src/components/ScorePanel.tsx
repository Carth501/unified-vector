import { useLayoutEffect, useRef, useState } from "react";
import { Panel } from "./panel";
import "./ScorePanel.css";

export type ScorePanelData = {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  score: number | null;
  busy: boolean;
  errorMessage: string | null;
  descriptionCardId: string;
  onSelect: () => void;
  onIncrement: () => void;
};

type ScorePanelProps = {
  data: ScorePanelData;
  index: number;
  width: number;
};

const scoreFormatter = new Intl.NumberFormat("en-US");
const scientificScoreFormatter = new Intl.NumberFormat("en-US", {
  notation: "scientific",
  maximumFractionDigits: 3,
});

export function ScorePanel({ data, index, width }: ScorePanelProps) {
  const standardScoreDisplay =
    data.score === null ? "..." : scoreFormatter.format(data.score);
  const scientificScoreDisplay =
    data.score === null ? "..." : scientificScoreFormatter.format(data.score);
  const compactLayout = width < 420;
  const headingId = `${data.id}-heading-${index}`;
  const scoreBlockRef = useRef<HTMLDivElement | null>(null);
  const standardMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [useScientificNotation, setUseScientificNotation] = useState(false);

  useLayoutEffect(() => {
    if (!scoreBlockRef.current || !standardMeasureRef.current) {
      return;
    }

    const availableWidth = scoreBlockRef.current.clientWidth;
    const standardWidth = standardMeasureRef.current.scrollWidth;
    const shouldUseScientificNotation = standardWidth > availableWidth;

    setUseScientificNotation((currentValue) => {
      if (currentValue === shouldUseScientificNotation) {
        return currentValue;
      }

      return shouldUseScientificNotation;
    });
  }, [standardScoreDisplay, width]);

  const scoreDisplay = useScientificNotation
    ? scientificScoreDisplay
    : standardScoreDisplay;

  return (
    <Panel
      headingId={headingId}
      title={data.title}
      errorMessage={data.errorMessage}
      onClick={data.onSelect}
      selected={data.selected}
      controlsId={data.descriptionCardId}
      footer={
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
      }
    >
      <div className="score-block" ref={scoreBlockRef}>
        <span className="score-caption">Global score</span>
        <p className="score-value" aria-live="polite">
          {scoreDisplay}
        </p>
        <span
          className="score-value score-value-measure"
          aria-hidden="true"
          ref={standardMeasureRef}
        >
          {standardScoreDisplay}
        </span>
      </div>
    </Panel>
  );
}

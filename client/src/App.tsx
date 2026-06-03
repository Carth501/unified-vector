import { Masonry } from "masonic";
import { useEffect, useState } from "react";
import "./App.css";

type LiveStatus = "connecting" | "connected" | "reconnecting";

type DashboardPanel = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  busy: boolean;
  liveStatus: LiveStatus;
  errorMessage: string | null;
  onIncrement: () => void;
};

const scoreFormatter = new Intl.NumberFormat("en-US");

const liveStatusCopy: Record<
  LiveStatus,
  { label: string; className: string; detail: string }
> = {
  connecting: {
    label: "Connecting",
    className: "status-chip status-chip--connecting",
    detail: "Opening the live event stream.",
  },
  connected: {
    label: "Live",
    className: "status-chip status-chip--connected",
    detail: "Receiving shared score updates every second.",
  },
  reconnecting: {
    label: "Reconnecting",
    className: "status-chip status-chip--reconnecting",
    detail: "Trying to restore the live event stream.",
  },
};

const parseScorePayload = (value: unknown) => {
  const candidate = value as { score?: unknown };

  if (typeof candidate.score !== "number") {
    throw new Error("Received an invalid score payload.");
  }

  return candidate.score;
};

const readScoreResponse = async (response: Response) => {
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return parseScorePayload(payload);
};

function ScorePanel({
  data,
  index,
  width,
}: {
  data: DashboardPanel;
  index: number;
  width: number;
}) {
  const liveStatus = liveStatusCopy[data.liveStatus];
  const scoreDisplay =
    data.score === null ? "..." : scoreFormatter.format(data.score);
  const compactLayout = width < 420;
  const headingId = `${data.id}-heading-${index}`;

  return (
    <article className="dashboard-panel" aria-labelledby={headingId}>
      <div className="card panel-card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Global Pool</p>
              <h2 className="panel-title" id={headingId}>
                {data.title}
              </h2>
            </div>
            <span className={liveStatus.className}>{liveStatus.label}</span>
          </div>

          <p className="panel-text">{data.description}</p>

          <div className="score-block">
            <span className="score-caption">Current score</span>
            <p className="score-value" aria-live="polite">
              {scoreDisplay}
            </p>
          </div>

          <div className="action-row">
            <button
              type="button"
              className={`btn btn-primary btn-lg ${compactLayout ? "w-100" : ""}`.trim()}
              onClick={data.onIncrement}
              disabled={data.busy}
            >
              {data.busy ? "Adding..." : "Add a Point"}
            </button>
            <p className="action-note">
              Each click updates the shared pool for every connected player.
            </p>
          </div>

          <div className="panel-meta">
            <div className="panel-stat">
              <span>Transport</span>
              <strong>Server-Sent Events</strong>
            </div>
            <div className="panel-stat">
              <span>Cadence</span>
              <strong>1 second pushes</strong>
            </div>
            <div className="panel-stat">
              <span>Status</span>
              <strong>{liveStatus.detail}</strong>
            </div>
          </div>

          {data.errorMessage ? (
            <p className="panel-error" role="alert">
              {data.errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function App() {
  const [score, setScore] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const eventSource = new EventSource("/api/score/stream");

    const loadScore = async () => {
      try {
        const nextScore = await readScoreResponse(
          await fetch("/api/score", { signal: abortController.signal }),
        );

        setScore(nextScore);
        setErrorMessage(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the current global score.",
        );
      }
    };

    const handleScore = (event: Event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const nextScore = parseScorePayload(
          JSON.parse(messageEvent.data) as unknown,
        );

        setScore(nextScore);
        setErrorMessage(null);
      } catch {
        setErrorMessage("Received an invalid live score update.");
      }
    };

    eventSource.onopen = () => {
      setLiveStatus("connected");
    };

    eventSource.onerror = () => {
      setLiveStatus("reconnecting");
    };

    eventSource.addEventListener("score", handleScore);
    void loadScore();

    return () => {
      abortController.abort();
      eventSource.removeEventListener("score", handleScore);
      eventSource.close();
    };
  }, []);

  const handleIncrement = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextScore = await readScoreResponse(
        await fetch("/api/score/increment", { method: "POST" }),
      );

      setScore(nextScore);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add a point to the global pool.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const panels: DashboardPanel[] = [
    {
      id: "score-panel",
      title: "Shared score tracker",
      description:
        "Everyone contributes to one global counter. The button posts to the server, and the stream keeps every client in sync.",
      score,
      busy: isSubmitting,
      liveStatus,
      errorMessage,
      onIncrement: handleIncrement,
    },
  ];

  return (
    <main className="dashboard-shell">
      <section className="dashboard-intro">
        <p className="eyebrow">Cooperative incremental clicker</p>
        <h1>Unified Vector</h1>
        <p className="dashboard-lede">
          Every connected user adds to the same pool. The server keeps the score
          in memory, and the dashboard listens for live updates over a shared
          event stream.
        </p>
      </section>

      <section>
        <Masonry
          items={panels}
          render={ScorePanel}
          itemKey={(panel) => panel.id}
          columnWidth={340}
          columnGutter={24}
          rowGutter={24}
          maxColumnCount={3}
          itemHeightEstimate={380}
          className="dashboard-grid"
        />
      </section>
    </main>
  );
}

export default App;

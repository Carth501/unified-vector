import { Masonry } from "masonic";
import { useEffect, useState } from "react";
import "./App.css";
import { ScorePanel, type ScorePanelData } from "./components/ScorePanel";

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

function App() {
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const descriptionOverlayId = "panel-description-overlay";

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

    eventSource.addEventListener("score", handleScore);
    void loadScore();

    return () => {
      abortController.abort();
      eventSource.removeEventListener("score", handleScore);
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedPanelId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPanelId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPanelId]);

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

  const panels: ScorePanelData[] = [
    {
      id: "score-panel",
      title: "Shared score tracker",
      description:
        "Everyone contributes to one global counter. The button posts to the server, and the stream keeps every client in sync.",
      selected: selectedPanelId === "score-panel",
      score,
      busy: isSubmitting,
      errorMessage,
      descriptionCardId: descriptionOverlayId,
      onSelect: () => {
        setSelectedPanelId("score-panel");
      },
      onIncrement: handleIncrement,
    },
  ];

  const selectedPanel = panels.find((panel) => panel.id === selectedPanelId);

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

      {selectedPanel ? (
        <div
          className="description-overlay"
          id={descriptionOverlayId}
          onClick={() => {
            setSelectedPanelId(null);
          }}
        >
          <section
            className="description-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${descriptionOverlayId}-heading`}
            aria-describedby={`${descriptionOverlayId}-body`}
          >
            <h2
              className="description-card-title"
              id={`${descriptionOverlayId}-heading`}
            >
              {selectedPanel.title}
            </h2>
            <p
              className="description-card-body"
              id={`${descriptionOverlayId}-body`}
            >
              {selectedPanel.description}
            </p>
            <p className="description-card-hint">Click anywhere to close.</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;

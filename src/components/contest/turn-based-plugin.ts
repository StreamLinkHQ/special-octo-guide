/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContestPlugin, ContestContext, ParticipantId } from "@vidbloq/react";

export class TurnBasedContestPlugin implements ContestPlugin {
  name = "TurnBasedContest";
  version = "1.0.0";

  public turnDuration: number = 180;
  public autoAdvance: boolean = true;

  private turnState = {
    currentPerformer: null as ParticipantId | null,
    performanceQueue: [] as ParticipantId[],
    completedPerformers: new Set<ParticipantId>(),
    currentTurnStartTime: null as number | null,
  };

  private turnTimer: NodeJS.Timeout | null = null;
  private context: ContestContext | null = null;


  constructor(options?: { turnDuration?: number; autoAdvance?: boolean }) {
    if (options?.turnDuration) this.turnDuration = options.turnDuration;
    if (options?.autoAdvance !== undefined) this.autoAdvance = options.autoAdvance;
  }

  async onInitialize(context: ContestContext) {
    this.context = context;
  console.log("TurnBasedPlugin: Initialized with context", context);
  }

  async afterContestStart(state: any) {
    // if (!this.context) return;

    if (!this.context) {
    console.error("Plugin context not initialized!");
    return;
  }

    console.log("TurnBasedPlugin: afterContestStart called", state);

    console.log("afterContestStart - contestants:", state.contestants);

    // Get all contestants from the state
    const contestants = Array.from(state.contestants.values())
      .filter((c: any) => !c.isEliminated)
      .map((c: any) => c.participantId);

    if (contestants.length === 0) {
      console.warn("No contestants available for turn-based mode");
      return;
    }

    console.log("Initializing queue with contestants:", contestants);

    // Initialize the queue
    this.turnState.performanceQueue = this.shuffleArray(contestants);
    this.turnState.completedPerformers.clear();

    console.log(
      "Turn-based queue initialized with",
      contestants.length,
      "contestants:",
      this.turnState.performanceQueue
    );

    // Broadcast that the plugin is ready
    if (this.context) {
      this.context.actions.broadcast("turnBasedReady", {
        queueLength: this.turnState.performanceQueue.length,
        queue: this.turnState.performanceQueue,
      });
      
      // Auto-start the first turn after a short delay
      if (this.autoAdvance) {
        console.log("Auto-starting first turn in 2 seconds...");
        setTimeout(() => {
          this.startNextTurn();
        }, 2000);
      }
    }
  }

  private onAllTurnsComplete() {
    if (!this.context) return;

    console.log("All turns complete");

    // Emit event for the hook to listen to
    this.context.events.emit("allTurnsComplete" as any, {
      round: this.context.state.currentRound,
      performerCount: this.turnState.completedPerformers.size,
    });

    // Broadcast to all participants
    this.context.actions.broadcast("allTurnsComplete", {
      round: this.context.state.currentRound,
      performerCount: this.turnState.completedPerformers.size,
    });
  }

  public skipTurn(reason: string = "Host skip") {
    if (!this.context || !this.turnState.currentPerformer) return;

    console.log("Skipping turn for:", this.turnState.currentPerformer);

    this.context.actions.broadcast("turnSkipped", {
      participantId: this.turnState.currentPerformer,
      reason,
    });

    this.endCurrentTurn();
  }

  async onDestroy() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public startNextTurn() {
    if (!this.context) return;

    // End current turn if exists
    if (this.turnState.currentPerformer) {
      this.endCurrentTurn();
    }

    // Get next performer
    const nextPerformer = this.turnState.performanceQueue.shift();
    if (!nextPerformer) {
      console.log("No more performers in queue");
      this.onAllTurnsComplete();
      return;
    }

    console.log("Starting turn for participant:", nextPerformer);
    
    this.turnState.currentPerformer = nextPerformer;
    this.turnState.currentTurnStartTime = Date.now();

    // IMPORTANT: Don't include roomName - it's added by the broadcast function
    this.context.actions.broadcast('turnStart', {
      participantId: nextPerformer,
      duration: this.turnDuration,
      queue: this.turnState.performanceQueue,
      currentPerformer: nextPerformer, // Add this explicitly
    });

    // Set timer
    if (this.turnDuration > 0) {
      this.turnTimer = setTimeout(() => {
        this.handleTurnTimeout();
      }, this.turnDuration * 1000);
    }
  }

  public endCurrentTurn() {
    if (!this.context || !this.turnState.currentPerformer) return;

    console.log("Ending turn for:", this.turnState.currentPerformer);

    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }

    const duration = this.turnState.currentTurnStartTime
      ? (Date.now() - this.turnState.currentTurnStartTime) / 1000
      : 0;

    this.turnState.completedPerformers.add(this.turnState.currentPerformer);

    // Broadcast turn end
    this.context.actions.broadcast("turnEnd", {
      participantId: this.turnState.currentPerformer,
      duration,
    });

    this.turnState.currentPerformer = null;
    this.turnState.currentTurnStartTime = null;

    if (this.autoAdvance) {
      setTimeout(() => this.startNextTurn(), 2000);
    }
  }

  private handleTurnTimeout() {
    if (!this.context || !this.turnState.currentPerformer) return;

    console.log("Turn timeout for:", this.turnState.currentPerformer);

    this.context.actions.broadcast("turnTimeout", {
      participantId: this.turnState.currentPerformer,
    });

    this.endCurrentTurn();
  }

  public getTurnState() {
    return { ...this.turnState };
  }

  public getCurrentPerformer(): ParticipantId | null {
    return this.turnState.currentPerformer;
  }

  public isMyTurn(participantId: string): boolean {
    return this.turnState.currentPerformer === participantId;
  }
}
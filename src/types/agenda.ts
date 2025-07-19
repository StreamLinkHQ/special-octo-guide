// Enums from Prisma schema
export enum AgendaAction {
  Poll = 'Poll',
  Transaction = 'Transaction',
  Giveaway = 'Giveaway',
  Q_A = 'Q_A',
  Custom = 'Custom',
  Quiz = 'Quiz'
}

// Types based on Prisma schema and API
export interface BaseAgenda {
  id: string;
  timeStamp: number;
  action: AgendaAction;
  title: string;
  description?: string;
  duration?: number;
}

export interface PollAgenda extends BaseAgenda {
  action: AgendaAction.Poll;
  options: string[];
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  isMultiChoice: boolean;
  points: number;
}

interface QuizAgenda extends BaseAgenda {
  action: AgendaAction.Quiz;
  questions: QuizQuestion[];
}

interface TransactionAgenda extends BaseAgenda {
  action: AgendaAction.Transaction;
  assetType: string;
}

interface GiveawayAgenda extends BaseAgenda {
  action: AgendaAction.Giveaway;
  assetType: string;
}

interface QAAgenda extends BaseAgenda {
  action: AgendaAction.Q_A;
  topic?: string;
}

interface CustomAgenda extends BaseAgenda {
  action: AgendaAction.Custom;
  customData?: Record<string, unknown>;
}

// Union type for all agenda creation inputs
export type AgendaItem = PollAgenda | QuizAgenda | TransactionAgenda | GiveawayAgenda | QAAgenda | CustomAgenda;

export interface PollOption {
  id: string;
  text: string;
}

interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestionForm {
  id: string;
  questionText: string;
  isMultiChoice: boolean;
  points: number;
  correctAnswer: string;
  answers: QuizAnswer[];
}

export interface AgendaFormData {
  timeStamp: number;
  duration?: number;
  title: string;
  description?: string;
  
  // Poll specific
  pollOptions?: PollOption[];
  
  // Quiz specific
  quizQuestions?: QuizQuestionForm[];
  
  // Q&A specific
  topic?: string;
  
  // Custom specific
  customData?: Record<string, unknown>;
  
  // Asset Transfer specific
  assetType?: string;
}

// vidbloq/react specific types
export const AgendaActionDisplay = {
  [AgendaAction.Poll]: "Poll",
  [AgendaAction.Transaction]: "Transaction",
  [AgendaAction.Giveaway]: "Giveaway",
  [AgendaAction.Q_A]: "Q&A", // User-friendly display
  [AgendaAction.Custom]: "Custom",
  [AgendaAction.Quiz]: "Quiz",
};
export type StreamContextValue ={
  activeAgendaId: string | null;
  setActiveAgendaId: (id: string | null) => void;
  isActive: (agendaId: string) => boolean;
}
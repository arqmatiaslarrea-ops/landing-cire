
export enum ProblemType {
  MAINTENANCE = 'Mantenimiento / Deterioro',
  DEBTS = 'Deudas / Expensas',
  SUCCESSION = 'Sucesión / Trámites',
  OCCUPANTS = 'Ocupantes / Usufructo',
  LAWSUIT = 'Juicios / Conflictos',
  COMMERCIAL = 'Mala gestión comercial / inmobiliaria',
  OTHER = 'Otro problema'
}

export enum UrgencyType {
  IMMEDIATE = 'Inmediata (Menos de 30 días)',
  SHORT_TERM = 'Próximos 60 días',
  NOT_URGENT = 'Sin apuro inmediato'
}

export enum ExpectationType {
  REALISTIC = 'Priorizo velocidad y certeza',
  MARKET = 'Busco precio de mercado',
  FLEXIBLE = 'Abierto a negociar'
}

export interface FormData {
  problem: ProblemType | '';
  urgency: UrgencyType | '';
  expectation: ExpectationType | '';
  neighborhood: string;
  whatsapp: string;
  email: string;
}

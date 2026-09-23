export interface TemplateData {
  invitation: any;
  guestName: string;
  timeLeft: { d: number, h: number, m: number, s: number };
  messages: any[];
}

export interface TemplateForms {
  rsvp: { name: string, attendance: string, count: number, message: string };
  setRsvp: React.Dispatch<React.SetStateAction<any>>;
  submitRsvp: (e: React.FormEvent) => void;

  gbName: string;
  setGbName: React.Dispatch<React.SetStateAction<string>>;
  gbMessage: string;
  setGbMessage: React.Dispatch<React.SetStateAction<string>>;
  submitGuestbook: (e: React.FormEvent) => void;

  gift: { name: string, bank: string, amount: string, note: string };
  setGift: React.Dispatch<React.SetStateAction<any>>;
  submitGift: (e: React.FormEvent) => void;
}

export interface TemplateProps {
  data: TemplateData;
  forms: TemplateForms;
}

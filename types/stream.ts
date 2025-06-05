export interface DataPartValue {
  citations?: string[];
  type?: string;
  content?: string;
  finishReason?: string;
  elapsed_secs?: number;
  chatTitle?: string | null;
  messageId?: string;
}

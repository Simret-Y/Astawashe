/**
 * What this build can actually do.
 *
 * The UI checks these flags before offering a feature, so it never claims a
 * service exists when it does not. Flip a flag to `true` only when the
 * matching integration is implemented and tested end to end.
 *
 * Current state: frontend only, no backend. Everything below that needs a
 * server is `false`.
 */
export const capabilities = {
  /** Real outbound reminder calls / USSD / SMS at dose time (server1 /reminders + telecom provider). */
  reminderDelivery: false,
  /** Notifying a guardian after a missed dose. */
  guardianAlerts: false,
  /** Delivering messages to another person's device. Messages currently live in this browser session only. */
  messageDelivery: false,
  /** Persistence / sync across devices and reloads. */
  persistence: false,
  /** Speech recognition (patient answers by voice). Not implemented. */
  speechRecognition: false,
} as const;

/** Browser text-to-speech is used for the in-app "Listen" features when available. */
export const speechSynthesisAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

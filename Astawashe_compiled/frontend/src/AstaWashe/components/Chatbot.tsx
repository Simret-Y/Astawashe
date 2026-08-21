import { useState, useRef, useEffect } from "react";
import { askGeminiAssistant, type ChatMessage } from "../../lib/gemini";
import { getUserContextSummary } from "../../lib/userContext";
import {
  startListening,
  stopListening,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  type VoiceState,
  type VoiceLang,
} from "../../lib/voiceAssistant";
import "./chatbot.css";

type Message = {
  role: "user" | "bot";
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "How can AstaWashe help me remember my medication?",
  "What should I do if I miss a dose?",
  "What is my current reminder mode?",
  "How do AstaWashe reminders work?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [voiceState, setVoiceState] =
    useState<VoiceState>("IDLE");

  const [voiceLang, setVoiceLang] =
    useState<VoiceLang>("en-US");

  const [voiceNotice, setVoiceNotice] =
    useState("");

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text:
        "Hello! I'm the AstaWashe Assistant. " +
        "I can help you with medications, reminders, " +
        "adherence, and using the AstaWashe system.",
    },
  ]);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, voiceState]);

  /* =====================================================
     OPEN FROM OTHER BUTTONS
  ===================================================== */

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        target &&
        target.closest(".chatbot-open-btn")
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener(
      "click",
      handleGlobalClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleGlobalClick
      );
    };
  }, []);

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  /* =====================================================
     OPEN / CLOSE
  ===================================================== */

  const openChat = () => {
    setOpen(true);
  };

  const closeChat = () => {
    stopSpeaking();
    stopListening();
    setVoiceState("IDLE");
    setOpen(false);
  };

  /* =====================================================
     CLEAR CHAT
  ===================================================== */

  const handleClearChat = () => {
    stopSpeaking();
    stopListening();

    setVoiceState("IDLE");

    setMessages([
      {
        role: "bot",
        text:
          "Chat cleared. How can I help you with AstaWashe?",
      },
    ]);

    setInput("");
  };

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const sendMessage = async (
    overrideInput?: string,
    autoSpeak = false
  ) => {
    const textToSend =
      (overrideInput ?? input).trim();

    if (!textToSend || loading) {
      return;
    }

    stopSpeaking();

    const userMessage: Message = {
      role: "user",
      text: textToSend,
    };

    const updatedHistory = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedHistory);
    setInput("");
    setLoading(true);
    setVoiceState("THINKING");
    setVoiceNotice("");

    try {
      /* ===============================================
         GET REAL ASTAWASHE USER CONTEXT
      =============================================== */

      const userContext =
        await getUserContextSummary();

      const geminiHistory: ChatMessage[] =
        updatedHistory.map((message) => ({
          role:
            message.role === "user"
              ? "user"
              : "model",
          text: message.text,
        }));

      /* ===============================================
         GEMINI
      =============================================== */

      const reply =
        await askGeminiAssistant(
          geminiHistory,
          textToSend,
          userContext.formattedContext
        );

      setMessages((previous) => [
        ...previous,
        {
          role: "bot",
          text: reply,
        },
      ]);

      /* ===============================================
         VOICE RESPONSE
      =============================================== */

      if (autoSpeak) {
        speakText(
          reply,
          voiceLang,
          setVoiceState
        );
      } else {
        setVoiceState("IDLE");
      }
    } catch (error) {
      console.error(
        "AstaWashe Assistant error:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "bot",
          text:
            "I'm having trouble connecting right now. " +
            "Please try again in a moment.",
        },
      ]);

      setVoiceState("IDLE");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     MICROPHONE
  ===================================================== */

  const handleMicClick = () => {
    setVoiceNotice("");

    /* STOP SPEAKING */
    if (voiceState === "SPEAKING") {
      stopSpeaking(setVoiceState);
      return;
    }

    /* STOP LISTENING */
    if (voiceState === "LISTENING") {
      stopListening();
      setVoiceState("IDLE");
      return;
    }

    /* CHECK SUPPORT */
    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice(
        "Voice input is not supported in this browser."
      );

      return;
    }

    /* START LISTENING */

    startListening({
      lang: voiceLang,

      onResult: (transcript) => {
        setInput(transcript);

        sendMessage(
          transcript,
          true
        );
      },

      onError: (message) => {
        setVoiceNotice(message);
        setVoiceState("IDLE");
      },

      onStateChange: setVoiceState,
    });
  };

  /* =====================================================
     VOICE ICON
  ===================================================== */

  const voiceIcon =
    voiceState === "LISTENING"
      ? "●"
      : voiceState === "SPEAKING"
      ? "■"
      : "🎙";

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* =================================================
          FLOATING LAUNCHER
      ================================================= */}

      {!open && (
        <div className="chatbot-launcher">
          <button
            className="chatbot-open-btn"
            onClick={openChat}
          >
            <span className="launcher-icon">
              〰
            </span>

            <span>
              AstaWashe AI
            </span>
          </button>
        </div>
      )}

      {/* =================================================
          CHAT WINDOW
      ================================================= */}

      {open && (
        <div className="chatbot-window">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="chatbot-header">

            <div className="chatbot-title-area">

              <button
                className="new-conversation-btn"
                onClick={handleClearChat}
                title="New conversation"
              >
                New conversation
              </button>

              <span className="header-chevron">
                ⌄
              </span>

            </div>

            <div className="chatbot-header-actions">

              <button
                className="header-icon-btn"
                onClick={handleClearChat}
                title="New conversation"
              >
                ↗
              </button>

              <button
                className="header-icon-btn"
                title="More options"
              >
                ···
              </button>

              <button
                className="header-icon-btn close"
                onClick={closeChat}
                title="Close"
              >
                ×
              </button>

            </div>

          </header>

          {/* =================================================
              BODY
          ================================================= */}

          <main className="chatbot-body">

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={`message-row ${
                    message.role === "user"
                      ? "user-row"
                      : "bot-row"
                  }`}
                >

                  {message.role === "user" ? (

                    <div className="user-message">
                      {message.text}
                    </div>

                  ) : (

                    <div className="bot-message">

                      <div className="bot-message-text">
                        {message.text}
                      </div>

                    </div>

                  )}

                </div>

              )
            )}

            {/* =================================================
                ANALYZING
            ================================================= */}

            {loading && (
              <div className="analysis-area">

                <div className="analysis-title">
                  <span className="analysis-chevron">
                    ⌄
                  </span>

                  <span>
                    Analyzing...
                  </span>
                </div>

                <div className="analysis-step">

                  <span className="analysis-check">
                    ✓
                  </span>

                  <span>
                    Understanding your request
                  </span>

                </div>

                <div className="analysis-step">

                  <span className="analysis-spinner">
                    ◌
                  </span>

                  <span>
                    Checking AstaWashe information
                  </span>

                </div>

              </div>
            )}

            {/* =================================================
                VOICE STATUS
            ================================================= */}

            {voiceState !== "IDLE" &&
              !loading && (

                <div className="voice-status">

                  {voiceState ===
                    "LISTENING" && (
                    <>
                      <span className="voice-dot listening-dot" />
                      Listening...
                    </>
                  )}

                  {voiceState ===
                    "THINKING" && (
                    <>
                      <span>✨</span>
                      Thinking...
                    </>
                  )}

                  {voiceState ===
                    "SPEAKING" && (
                    <>
                      <span>🔊</span>
                      Speaking...

                      <button
                        onClick={() =>
                          stopSpeaking(
                            setVoiceState
                          )
                        }
                      >
                        Stop
                      </button>
                    </>
                  )}

                </div>
              )}

            {/* =================================================
                SUGGESTIONS
            ================================================= */}

            {messages.length === 1 &&
              !loading && (

                <div className="suggested-area">

                  <div className="suggested-title">
                    Try asking
                  </div>

                  {SUGGESTED_QUESTIONS
                    .slice(0, 3)
                    .map(
                      (
                        question,
                        index
                      ) => (

                        <button
                          key={index}
                          className="suggested-question"
                          onClick={() =>
                            sendMessage(
                              question
                            )
                          }
                        >
                          {question}
                        </button>

                      )
                    )}

                </div>
              )}

            <div
              ref={messagesEndRef}
            />

          </main>

          {/* =================================================
              VOICE NOTICE
          ================================================= */}

          {voiceNotice && (

            <div className="voice-notice">
              {voiceNotice}
            </div>

          )}

          {/* =================================================
              SCROLL TO BOTTOM
          ================================================= */}

          <button
            className="scroll-bottom-btn"
            onClick={() =>
              messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            ↓
          </button>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="chatbot-footer">

            <div className="input-container">

              <input
                className="chatbot-input"
                type="text"
                placeholder="Type your message..."
                value={input}
                disabled={loading}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    sendMessage();
                  }

                }}
              />

              {/* ============================================
                  RIGHT ACTION
              ============================================ */}

              {loading ? (

                <button
                  className="chatbot-stop-btn"
                  onClick={() => {
                    stopSpeaking(
                      setVoiceState
                    );
                  }}
                  title="Stop"
                >
                  ■
                </button>

              ) : input.trim() ? (

                <button
                  className="chatbot-send-round"
                  onClick={() =>
                    sendMessage()
                  }
                  title="Send"
                >
                  ↑
                </button>

              ) : (

                <button
                  className={`chatbot-mic-round ${
                    voiceState ===
                    "LISTENING"
                      ? "active"
                      : ""
                  }`}
                  onClick={
                    handleMicClick
                  }
                  title={
                    voiceState ===
                    "LISTENING"
                      ? "Stop listening"
                      : "Voice assistant"
                  }
                >
                  {voiceIcon}
                </button>

              )}

            </div>

            {/* LANGUAGE */}

            <div className="assistant-bottom-info">

              <span>
                AstaWashe Assistant
              </span>

              <select
                value={voiceLang}
                onChange={(event) =>
                  setVoiceLang(
                    event.target
                      .value as VoiceLang
                  )
                }
              >
                <option value="en-US">
                  English
                </option>

                <option value="am-ET">
                  አማርኛ
                </option>
              </select>

            </div>

          </footer>

        </div>
      )}
    </>
  );
}
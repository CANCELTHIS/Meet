import React, { useState, useRef, useCallback } from "react";
import {
  MeetingDetails,
  MeetingSummary,
  AppStep,
  CalendarEvent,
} from "./types";
import {
  transcribeAudio,
  summarizeTranscriptStream,
} from "./services/geminiService";
import { ICONS, MOCK_CALENDAR_EVENTS } from "./constants";
import Card from "./components/Card";
import Button from "./components/Button";
import Icon from "./components/Icon";
import SummarizingView from "./components/SummarizingView";
import Auth from "./Auth";
import { fetchCalendarEvents, formatCalendarEvents } from "./calendarService";

// Helper component for the Initial step
const InitialStep: React.FC<{
  onStart: (details: MeetingDetails) => void;
  isCalendarConnected: boolean;
  isConnecting: boolean;
  onConnectCalendar: () => void;
  meetings: CalendarEvent[];
}> = ({
  onStart,
  isCalendarConnected,
  isConnecting,
  onConnectCalendar,
  meetings,
}) => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );

  const handleProceed = () => {
    const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);
    if (selectedMeeting) {
      onStart({ title: selectedMeeting.title, agenda: selectedMeeting.agenda });
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white">Meeting Summarizer AI</h1>
        <p className="text-gray-400 mt-2">
          {isCalendarConnected
            ? "Select an upcoming meeting to begin."
            : "Connect your calendar to get started."}
        </p>
      </div>
      {!isCalendarConnected ? (
        <div className="text-center py-4">
          <Button
            onClick={onConnectCalendar}
            isLoading={isConnecting}
            className="w-full sm:w-auto px-8"
          >
            <Icon icon={ICONS.GOOGLE} className="mr-3" />
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {meetings.map((meeting) => (
              <label
                key={meeting.id}
                htmlFor={`meeting-${meeting.id}`}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMeetingId === meeting.id
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
                }`}
              >
                <input
                  type="radio"
                  id={`meeting-${meeting.id}`}
                  name="meeting"
                  value={meeting.id}
                  checked={selectedMeetingId === meeting.id}
                  onChange={() => setSelectedMeetingId(meeting.id)}
                  className="hidden"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-white">{meeting.title}</p>
                  <p className="text-sm text-gray-400">{meeting.startTime}</p>
                </div>
                {selectedMeetingId === meeting.id && (
                  <Icon icon={ICONS.CHECK} className="text-blue-400 h-6 w-6" />
                )}
              </label>
            ))}
          </div>
          <Button
            onClick={handleProceed}
            disabled={!selectedMeetingId}
            className="w-full"
          >
            Proceed to Recording
          </Button>
        </div>
      )}
    </Card>
  );
};

// Helper component for the Recording step
const RecordingStep: React.FC<{
  onStop: () => void;
  onStart: () => void;
  isRecording: boolean;
}> = ({ onStop, onStart, isRecording }) => (
  <Card className="w-full max-w-lg mx-auto text-center">
    <h2 className="text-2xl font-bold text-white">Ready to Record</h2>
    <p className="text-gray-400 mt-2 mb-6">
      {isRecording
        ? "Click stop when the meeting concludes."
        : "Click the button to start recording your meeting audio."}
    </p>
    <div className="flex justify-center">
      {isRecording ? (
        <Button
          onClick={onStop}
          variant="danger"
          className="w-32 h-16 rounded-full"
        >
          <Icon icon={ICONS.STOP} />
          <span className="ml-2">Stop</span>
        </Button>
      ) : (
        <Button
          onClick={onStart}
          variant="primary"
          className="w-32 h-16 rounded-full"
        >
          <Icon icon={ICONS.MIC} />
          <span className="ml-2">Start</span>
        </Button>
      )}
    </div>
    {isRecording && (
      <div className="mt-6 flex items-center justify-center text-red-400">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
        <span>Recording in progress...</span>
      </div>
    )}
  </Card>
);

// Helper component for the Results step
const ResultsStep: React.FC<{
  summary: MeetingSummary;
  transcript: string;
  meetingTitle: string;
  onRestart: () => void;
  onSendEmail: () => void;
}> = ({ summary, transcript, meetingTitle, onRestart, onSendEmail }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const summaryText = `Summary:\n${
      summary.summary
    }\n\nKey Decisions:\n${summary.keyDecisions
      .map((d) => `- ${d}`)
      .join("\n")}\n\nAction Items:\n${summary.actionItems
      .map((a) => `- ${a.task} (Owner: ${a.owner}, Deadline: ${a.deadline})`)
      .join("\n")}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto print-section">
      <div className="flex justify-between items-start mb-6 no-print">
        <div>
          <h2 className="text-3xl font-bold text-white">Meeting Summary</h2>
          <p className="text-gray-400 mt-1">
            AI-generated summary and full transcript below.
          </p>
        </div>
        <Button onClick={onRestart} variant="secondary">
          <Icon icon={ICONS.RESTART} className="mr-2" />
          Start Over
        </Button>
      </div>

      {/* Title for printing */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-black">
          Meeting Summary: {meetingTitle}
        </h1>
        <p className="text-gray-600">
          Generated on: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">Summary</h3>
          <p className="text-gray-300 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg">
            {summary.summary || "No summary was generated."}
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Key Decisions
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {summary.keyDecisions.length > 0 ? (
              summary.keyDecisions.map((decision, i) => (
                <li key={i}>{decision}</li>
              ))
            ) : (
              <li>No key decisions identified.</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Action Items
          </h3>
          {summary.actionItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead className="bg-gray-700/50 text-gray-200">
                  <tr>
                    <th className="p-3">Task</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.actionItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      <td className="p-3">{item.task}</td>
                      <td className="p-3">{item.owner}</td>
                      <td className="p-3">{item.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No action items identified.</p>
          )}
        </div>
        <div className="flex items-center space-x-4 pt-4 no-print">
          <Button onClick={handleCopy} variant="primary">
            <Icon icon={copied ? ICONS.CHECK : ICONS.COPY} className="mr-2" />
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button onClick={onSendEmail} variant="secondary">
            <Icon icon={ICONS.EMAIL} className="mr-2" />
            Send as Email
          </Button>
          <Button onClick={() => window.print()} variant="secondary">
            <Icon icon={ICONS.PDF} className="mr-2" />
            Download PDF
          </Button>
        </div>
        <div className="no-print">
          <h3 className="text-xl font-semibold text-white mb-3 pt-4 border-t border-gray-700">
            Full Transcript
          </h3>
          <div className="bg-gray-900/50 p-4 rounded-lg max-h-48 overflow-y-auto text-gray-400 text-sm">
            <p>{transcript || "No transcript available."}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Helper component for Email Modal
const EmailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  summaryText: string;
  meetingTitle: string;
}> = ({ isOpen, onClose, summaryText, meetingTitle }) => {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recipient, setRecipient] = useState("");

  const handleSend = () => {
    if (!recipient.trim() || !recipient.includes("@")) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setEmailSent(true);
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setEmailSent(false);
        setRecipient("");
      }, 2000);
    }, 1500);
  };

  const handleClose = () => {
    if (isSending) return;
    onClose();
    setEmailSent(false);
    setRecipient("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300 no-print"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-2xl relative animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl leading-none"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">
          Send Meeting Summary
        </h2>
        {emailSent ? (
          <div className="text-center py-12 transition-all duration-300">
            <Icon
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              className="mx-auto mb-4"
            />
            <p className="text-xl text-white">Email Sent Successfully!</p>
            <p className="text-gray-400">This is a mock confirmation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="recipient"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Recipient Email
              </label>
              <input
                type="email"
                name="recipient"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., team@example.com"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                readOnly
                value={`Summary: ${meetingTitle}`}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="body"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Body
              </label>
              <textarea
                name="body"
                id="body"
                readOnly
                rows={10}
                value={summaryText}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                onClick={handleClose}
                variant="secondary"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                isLoading={isSending}
                disabled={!recipient.trim() || !recipient.includes("@")}
              >
                Send Mock Email
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Helper component for when API key is missing
const ApiKeyMissingView = () => (
  <Card className="w-full max-w-lg mx-auto text-center">
    <h2 className="text-2xl font-bold text-yellow-400">API Key Required</h2>
    <p className="text-gray-300 mt-4">
      This application requires a Google Gemini API key to function.
    </p>
    <p className="text-gray-400 mt-2">
      For security, please provide your key as an environment variable named{" "}
      <code>API_KEY</code>.
    </p>
    <div className="mt-6 bg-gray-900 p-4 rounded-lg text-left text-sm font-mono">
      <span className="text-gray-500"># In your environment setup:</span>
      <br />
      <span className="text-red-400">export</span>{" "}
      <span className="text-green-400">API_KEY</span>=
      <span className="text-yellow-400">"your_api_key_here"</span>
    </div>
  </Card>
);

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.Initial);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(
    null
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [error, setError] = useState<string>("");

  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const apiKey = process.env.API_KEY;

  // Only allow calendar connection after authentication
  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    setError("");
    try {
      // Get the user's OAuth access token from Firebase
      const token =
        user.stsTokenManager?.accessToken || (await user.getIdToken());
      const googleEvents = await fetchCalendarEvents(token);
      const formattedEvents = formatCalendarEvents(googleEvents);
      setMeetings(formattedEvents);
      setIsCalendarConnected(true);
    } catch (err) {
      console.error("Error connecting to calendar:", err);
      setError("Failed to connect to Google Calendar. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartFlow = (details: MeetingDetails) => {
    setMeetingDetails(details);
    setStep(AppStep.Recording);
    setError("");
  };

  const handleStartRecording = useCallback(async () => {
    setError("");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          processAudio(audioBlob);
          stream.getTracks().forEach((track) => track.stop()); // Clean up media stream
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError(
          "Could not access microphone. Please check your browser permissions."
        );
      }
    } else {
      setError("Audio recording is not supported by your browser.");
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setStep(AppStep.Summarizing);
    setError("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        const transcriptText = await transcribeAudio(
          base64Audio,
          audioBlob.type
        );
        setTranscript(transcriptText);

        // The on-stream callback is now empty as we show a skeleton loader instead of streaming text to the UI.
        const fullJson = await summarizeTranscriptStream(
          transcriptText,
          () => {}
        );

        const summaryData = JSON.parse(fullJson) as MeetingSummary;
        setSummary(summaryData);

        setStep(AppStep.Result);
      };
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during processing.");
      setStep(AppStep.Recording);
    }
  }, []);

  const handleRestart = () => {
    setStep(AppStep.Initial);
    setMeetingDetails(null);
    setIsRecording(false);
    setTranscript("");
    setSummary(null);
    setError("");
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsCalendarConnected(false);
    setIsConnecting(false);
    setMeetings([]);
    setIsEmailModalOpen(false);
  };

  const renderContent = () => {
    if (!user) {
      return <Auth onAuthSuccess={setUser} />;
    }

    if (error) {
      return (
        <Card className="w-full max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-500">An Error Occurred</h2>
          <p className="text-gray-300 mt-2 mb-4">{error}</p>
          <Button onClick={handleRestart} variant="secondary">
            Try Again
          </Button>
        </Card>
      );
    }

    switch (step) {
      case AppStep.Initial:
        return (
          <InitialStep
            onStart={handleStartFlow}
            isCalendarConnected={isCalendarConnected}
            isConnecting={isConnecting}
            onConnectCalendar={handleConnectCalendar}
            meetings={meetings}
          />
        );
      case AppStep.Recording:
        return (
          <RecordingStep
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            isRecording={isRecording}
          />
        );
      case AppStep.Summarizing:
        return <SummarizingView />;
      case AppStep.Result:
        return (
          summary &&
          meetingDetails && (
            <ResultsStep
              summary={summary}
              transcript={transcript}
              meetingTitle={meetingDetails.title}
              onRestart={handleRestart}
              onSendEmail={() => setIsEmailModalOpen(true)}
            />
          )
        );
      default:
        return (
          <InitialStep
            onStart={handleStartFlow}
            isCalendarConnected={isCalendarConnected}
            isConnecting={isConnecting}
            onConnectCalendar={handleConnectCalendar}
            meetings={meetings}
          />
        );
    }
  };

  const summaryText = summary
    ? `Summary:\n${summary.summary}\n\nKey Decisions:\n${summary.keyDecisions
        .map((d) => `- ${d}`)
        .join("\n")}\n\nAction Items:\n${summary.actionItems
        .map((a) => `- ${a.task} (Owner: ${a.owner}, Deadline: ${a.deadline})`)
        .join("\n")}`
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans printable-area">
      <div className="w-full no-print">
        {!apiKey ? <ApiKeyMissingView /> : renderContent()}
      </div>
      {summary && meetingDetails && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          summaryText={summaryText}
          meetingTitle={meetingDetails.title}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import styles from "./ReportModal.module.css";
import axios from "axios";
import { baseURL } from "../../config";

type Props = {
  matchId: number;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void; // optional callback so parent can refresh
};

export default function ReportModal({
  matchId,
  isOpen,
  onClose,
  onReportSubmitted,
}: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${baseURL}/matches/${matchId}/reports`, { message });
      setMessage("");
      if (onReportSubmitted) onReportSubmitted();
      onClose();
    } catch (err: any) {
      console.error("[Frontend] Failed to submit report:", err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Submit Report</h2>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your report message..."
          className={styles.textarea}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={styles.cancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

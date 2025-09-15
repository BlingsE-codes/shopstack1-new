import { useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/networkerror.css";

export default function NetworkErrorFallback({ retry }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => {
      // Automatically retry when back online
      if (typeof retry === "function") {
        retry();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [retry]);

  return (
    <div className="network-error-state">
      <WifiOff size={60} className="empty-icon" />
      <h2>No Internet Connection</h2>
      <p>Please check your network and try again.</p>
      <div className="actions">
        <button className="btn-primary" onClick={retry}>
          <RefreshCw size={18} /> Retry
        </button>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    </div>
  );
}

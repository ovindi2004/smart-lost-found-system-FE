import { useAuth } from "../context/AuthContext";

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const { notifications, unreadCount, deleteNotification } = useAuth();

  return (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel-header">
        <div>
          <h3>Notifications</h3>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
        </div>
        <button
          className="close-button"
          onClick={onClose}
          style={{ width: "30px", height: "30px", fontSize: "12px" }}
          title="Close notifications"
        >
          ✕
        </button>
      </div>

      <div className="notification-list" style={{ marginTop: "10px" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "24px 10px", textAlign: "center", color: "var(--muted)" }}>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>🔔</span>
            <p style={{ fontSize: "13px", fontWeight: 600 }}>No notifications yet</p>
            <p style={{ fontSize: "11px" }}>Claim requests and updates will appear here.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className="notification-item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div>
                <p>{notif.message}</p>
                <small>
                  {notif.type === "CLAIM_REQUEST" && "📋 Claim Requested"}
                  {notif.type === "CLAIM_APPROVED" && "✅ Claim Approved"}
                  {notif.type === "CLAIM_REJECTED" && "❌ Claim Rejected"}
                  {notif.createdAt && ` · ${new Date(notif.createdAt).toLocaleDateString()}`}
                </small>
              </div>
              <button
                onClick={() => void deleteNotification(notif._id)}
                title="Dismiss notification"
                style={{
                  color: "var(--muted)",
                  padding: "4px",
                  fontSize: "13px",
                  lineHeight: 1,
                  borderRadius: "6px",
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;

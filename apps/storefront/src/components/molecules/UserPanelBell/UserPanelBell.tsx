import { NotificationsButton } from "@/components/molecules/NotificationsButton/NotificationsButton"

/**
 * Notification bell for the account-panel header (dark icon for light
 * surfaces). The navbar icons were removed — the bell lives here, next to
 * each page title, per the account-panel design.
 */
export const UserPanelBell = () => (
  <span className="shrink-0" data-testid="user-panel-bell">
    <NotificationsButton iconColor="#1f2937" />
  </span>
)

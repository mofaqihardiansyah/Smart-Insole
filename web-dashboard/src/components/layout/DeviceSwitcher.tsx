import React from "react";
import { useInsole } from "../../context/InsoleContext";
import { t } from "../../utils/i18n";

/**
 * Which insole the dashboard is reading.
 *
 * A patient now wears two boards, one per foot, so more than one device can be
 * paired to the account. When only one is paired there is nothing to choose and
 * the control renders nothing: a disabled select would be decoration.
 *
 * The labels come from the flashing convention (`insole-01` left, `insole-02`
 * right). An id outside that convention is shown as-is rather than guessed at.
 */
export interface DeviceSwitcherProps {
  deviceIds: string[];
  deviceId: string | null;
  onSelectDevice: (id: string) => void;
  className?: string;
}

const DeviceSwitcher = ({
  deviceIds,
  deviceId,
  onSelectDevice,
  className = "",
}: DeviceSwitcherProps) => {
  const { language } = useInsole();

  if (deviceIds.length < 2) return null;

  const labelFor = (id: string) => {
    if (id === "insole-01") return t("device.switcher.left", language);
    if (id === "insole-02") return t("device.switcher.right", language);
    return id;
  };

  return (
    <div className={`flex min-w-0 items-center ${className}`}>
      <label htmlFor="device-switcher" className="sr-only">
        {t("device.switcher.label", language)}
      </label>
      <select
        id="device-switcher"
        value={deviceId ?? ""}
        onChange={(event) => onSelectDevice(event.target.value)}
        className="h-11 w-full max-w-[9rem] rounded-control border border-border bg-surface px-2 text-body-sm font-semibold text-fg shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {deviceIds.map((id) => (
          <option key={id} value={id}>
            {labelFor(id)}
          </option>
        ))}
      </select>
    </div>
  );
};

export { DeviceSwitcher };
export default DeviceSwitcher;

import { InstallPage } from "../../pwa/InstallPage";
import { ResidentPage } from "../components/ResidentPage";

export type SecondaryScreenId = "install";

/** The install guidance root. Every other root now owns a real journey. */
export function SecondaryPage({ id }: { id: SecondaryScreenId }) {
  return (
    <ResidentPage screen={id} footerClearance>
      <InstallPage />
    </ResidentPage>
  );
}

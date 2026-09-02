import type { ReactNode } from 'react';
import { PlanProvider } from '@presentation/state/PlanStore';
import { RoomProvider } from '@presentation/state/RoomStore';
import { NavProvider } from '@presentation/state/NavStore';
import { UiProvider } from '@presentation/state/UiStore';
import { AccountProvider } from '@presentation/state/AccountStore';
import { ToastProvider } from '@presentation/components/ui/Toast';
import { SyncCoordinator } from '@presentation/components/SyncCoordinator';
import { RoomNotices } from '@presentation/components/RoomNotices';

/** Composition root for the app-wide context providers. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <RoomProvider>
      <PlanProvider>
        <AccountProvider>
          <SyncCoordinator />
          <NavProvider>
            <UiProvider>
              <ToastProvider>
                <RoomNotices />
                {children}
              </ToastProvider>
            </UiProvider>
          </NavProvider>
        </AccountProvider>
      </PlanProvider>
    </RoomProvider>
  );
}

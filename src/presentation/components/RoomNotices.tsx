import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@presentation/state/RoomStore';
import { useToast } from '@presentation/components/ui/Toast';

/**
 * Surfaces room-layer notices that originate deep in the sync path (below the
 * ToastProvider) as toasts. Rendered inside ToastProvider so it can reach both
 * `useRoom()` and `useToast()`.
 */
export function RoomNotices() {
  const { t } = useTranslation();
  const { attachmentNotice } = useRoom();
  const toast = useToast();
  const seen = useRef(attachmentNotice);

  useEffect(() => {
    if (attachmentNotice !== seen.current) {
      seen.current = attachmentNotice;
      toast(t('room.attachmentTooLarge'), { icon: 'warning' });
    }
  }, [attachmentNotice, t, toast]);

  return null;
}

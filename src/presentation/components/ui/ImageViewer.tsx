import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useUi } from '@presentation/state/UiStore';
import { dataUrlToBlob } from '@presentation/lib/dataUrl';
import { downloadBlob } from '@presentation/lib/download';

/**
 * Full-screen viewer for an inline image (task attachment, reference photo).
 *
 * Images are stored as `data:` URLs, which browsers refuse to open as a
 * top-level navigation — an `<a href="data:…" target="_blank">` yields a blank
 * tab. Showing the image in-app avoids navigation entirely, and the download
 * button routes through a Blob URL, which is not subject to that block.
 */
export function ImageViewer() {
  const { image, closeImage } = useUi();
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!image) return;
    const shell = document.getElementById('app-shell');
    shell?.setAttribute('inert', '');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImage();
    };
    document.addEventListener('keydown', onKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      shell?.removeAttribute('inert');
    };
  }, [image, closeImage]);

  if (!image) return null;

  const save = () => {
    const blob = dataUrlToBlob(image.src);
    if (blob) downloadBlob(blob, `${image.alt || 'image'}.jpg`, blob.type);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      className="fixed inset-0 z-[110] grid place-items-center bg-ink/80 backdrop-blur-[3px] pt-[calc(4.5rem+var(--sa-top))] pb-[calc(1.25rem+var(--sa-bottom))] pl-[calc(1.25rem+var(--sa-left))] pr-[calc(1.25rem+var(--sa-right))]"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeImage();
      }}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-full max-w-full rounded-[14px] object-contain shadow-lg"
      />
      {/* Offset from the notch and the rounded corner so the controls stay
          tappable on a curved-edge phone. */}
      <div className="absolute right-[calc(1.25rem+var(--sa-right))] top-[calc(1.25rem+var(--sa-top))] flex gap-2">
        <button
          type="button"
          onClick={save}
          title={t('account.download')}
          aria-label={t('account.download')}
          className="grid h-10 w-10 place-items-center rounded-full bg-app/90 text-ink transition-colors hover:bg-app"
        >
          <Icon name="download" size={20} />
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={closeImage}
          title={t('common.close')}
          aria-label={t('common.close')}
          className="grid h-10 w-10 place-items-center rounded-full bg-app/90 text-ink transition-colors hover:bg-app"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
    </div>
  );
}

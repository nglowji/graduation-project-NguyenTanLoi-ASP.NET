export type AppToastType = 'success' | 'error' | 'info';

export type AppToastPayload = {
  message: string;
  type?: AppToastType;
};

export const APP_TOAST_EVENT = 'smartsport:app-toast';

export const showAppToast = (message: string, type: AppToastType = 'info') => {
  window.dispatchEvent(
    new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, {
      detail: { message, type },
    }),
  );
};

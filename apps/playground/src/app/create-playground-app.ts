import { createCodeExample, createDetectionSummary, createResultCards } from './playground-view-model';
import { createCurrentDetectionEffect } from './current-detection-effect';
import { createManualDetectionEffect } from './manual-detection-effect';
import { createPlaygroundStore } from './playground-store';
import type { PlaygroundMode, PlaygroundNotification } from './playground-state';
import { createAppHeader } from '../components/app-header';
import { createCodeExample as createCodeExampleComponent } from '../components/code-example';
import { createCurrentBrowserPanel } from '../components/current-browser-panel';
import { createDetectionSummary as createDetectionSummaryComponent } from '../components/detection-summary';
import { createJsonViewer } from '../components/json-viewer';
import { createManualUserAgentPanel } from '../components/manual-user-agent-panel';
import { createModeSelector } from '../components/mode-selector';
import { createPrivacyNotice } from '../components/privacy-notice';
import { createResultDetails } from '../components/result-details';
import { createStatusMessage } from '../components/status-message';
import {
  createClipboardService,
  type ClipboardService,
} from '../services/clipboard-service';
import { parseClientHintsInput } from '../services/client-hints-input';
import {
  createUADetectionService,
  type UADetectionService,
  type UAResult,
} from '../services/ua-detection-service';

export interface PlaygroundApp {
  readonly element: HTMLElement;
  start(): void;
  selectMode(mode: PlaygroundMode): void;
  destroy(): void;
}

export function createPlaygroundApp(
  options: {
    readonly detectionService?: UADetectionService;
    readonly clipboardService?: ClipboardService;
  } = {},
): PlaygroundApp {
  const detectionService = options.detectionService ?? createUADetectionService();
  const clipboardService = options.clipboardService ?? createClipboardService();
  const store = createPlaygroundStore();
  const currentEffect = createCurrentDetectionEffect({ store, detectionService });
  const manualEffect = createManualDetectionEffect({ store, detectionService });
  let started = false;
  let destroyed = false;
  let notificationTimer: ReturnType<typeof setTimeout> | null = null;

  const element = document.createElement('main');
  element.className = 'ua-playground-shell';
  const header = createAppHeader();
  const modeSelector = createModeSelector({
    onModeSelected: (mode) => store.dispatch({ type: 'mode-selected', mode }),
  });
  const globalStatus = createStatusMessage();

  const workspace = document.createElement('div');
  workspace.className = 'ua-playground-workspace';
  const inputColumn = document.createElement('div');
  inputColumn.className = 'ua-playground-input-column';
  const resultColumn = document.createElement('section');
  resultColumn.className = 'ua-playground-result-column';
  resultColumn.setAttribute('aria-label', 'Detection result');

  const currentPanel = createCurrentBrowserPanel({
    onRetry: () => {
      void currentEffect.detect();
    },
  });

  let manualPanel!: ReturnType<typeof createManualUserAgentPanel>;
  manualPanel = createManualUserAgentPanel({
    onUserAgentChanged: manualEffect.changeUserAgent,
    onSampleSelected: manualEffect.selectSample,
    onParseNow: () => {
      void manualEffect.parseNow();
    },
    onReset: () => {
      manualEffect.reset();
      manualPanel.focusInput();
    },
    onClientHintsExpandedChanged: manualEffect.setClientHintsExpanded,
    onClientHintsChanged: manualEffect.changeClientHints,
    onClientHintsReset: () => manualEffect.changeClientHints(''),
  });

  const emptyResult = document.createElement('div');
  emptyResult.className = 'ua-playground-empty-result';
  const summary = createDetectionSummaryComponent();
  const details = createResultDetails();

  const showNotification = (notification: PlaygroundNotification): void => {
    if (notificationTimer !== null) clearTimeout(notificationTimer);
    store.dispatch({ type: 'notification-shown', notification });
    notificationTimer = setTimeout(() => {
      notificationTimer = null;
      store.dispatch({ type: 'notification-cleared' });
    }, 2500);
  };

  const copyText = async (value: string, successMessage: string): Promise<void> => {
    try {
      await clipboardService.writeText(value);
      showNotification({ kind: 'success', message: successMessage });
    } catch {
      showNotification({
        kind: 'error',
        message: 'Unable to copy. Select the text manually.',
      });
    }
  };

  const jsonViewer = createJsonViewer({
    onCopy: (value) => {
      void copyText(value, 'JSON copied.');
    },
  });
  const codeExample = createCodeExampleComponent({
    onCopy: (value) => {
      void copyText(value, 'API example copied.');
    },
  });
  const privacy = createPrivacyNotice();

  inputColumn.append(currentPanel.element, manualPanel.element);
  resultColumn.append(
    emptyResult,
    summary.element,
    details.element,
    jsonViewer.element,
    codeExample.element,
  );
  workspace.append(inputColumn, resultColumn);
  element.append(
    header.element,
    modeSelector.element,
    globalStatus.element,
    workspace,
    privacy.element,
  );

  const activeResult = (): UAResult | null => {
    const state = store.getState();
    if (state.mode === 'current') {
      return state.current.status === 'success' ? state.current.result : null;
    }
    return state.manual.result;
  };

  const render = (): void => {
    const state = store.getState();
    modeSelector.update({ mode: state.mode });
    currentPanel.element.hidden = state.mode !== 'current';
    manualPanel.element.hidden = state.mode !== 'manual';
    currentPanel.update(state.current);
    manualPanel.update(state.manual);
    globalStatus.update({ notification: state.notification });

    const result = activeResult();
    const hasResult = result !== null;
    emptyResult.hidden = hasResult;
    summary.element.hidden = !hasResult;
    details.element.hidden = !hasResult;
    jsonViewer.element.hidden = !hasResult;
    codeExample.element.hidden = !hasResult;
    if (!result) {
      emptyResult.textContent =
        state.mode === 'current'
          ? 'Current-browser results will appear here after detection.'
          : 'Paste a User-Agent or choose a sample to see the normalized result.';
      return;
    }

    summary.update(createDetectionSummary(result));
    details.update(createResultCards(result));
    jsonViewer.update({ json: JSON.stringify(result, null, 2) });
    const parsedHints = parseClientHintsInput(state.manual.clientHints.text);
    codeExample.update({
      code: createCodeExample({
        mode: state.mode,
        userAgent: state.manual.userAgent,
        hasClientHints:
          state.mode === 'manual' && parsedHints.ok && parsedHints.headers !== null,
      }),
    });
  };

  const unsubscribe = store.subscribe(render);
  render();

  return {
    element,
    start() {
      if (started || destroyed) return;
      started = true;
      void currentEffect.detect();
    },
    selectMode: (mode) => store.dispatch({ type: 'mode-selected', mode }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (notificationTimer !== null) clearTimeout(notificationTimer);
      unsubscribe();
      currentEffect.destroy();
      manualEffect.destroy();
      currentPanel.destroy();
      manualPanel.destroy();
      modeSelector.destroy();
      summary.destroy();
      details.destroy();
      jsonViewer.destroy();
      codeExample.destroy();
      globalStatus.destroy();
      header.destroy();
      privacy.destroy();
    },
  };
}

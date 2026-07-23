import { type Component } from './component';

export function createAppHeader(): Component<void> {
  const element = document.createElement('header');
  element.className = 'ua-playground-header';

  const identity = document.createElement('div');
  identity.className = 'ua-playground-header__identity';

  const title = document.createElement('h1');
  title.textContent = 'UA Info';
  const version = document.createElement('span');
  version.className = 'ua-playground-version';
  version.textContent = `v${__UA_INFO_VERSION__}`;
  title.append(' ', version);

  const description = document.createElement('p');
  description.textContent =
    'Inspect normalized browser, context, client, operating-system, device, and CPU information.';
  identity.append(title, description);

  const navigation = document.createElement('nav');
  navigation.setAttribute('aria-label', 'Project links');
  for (const [label, href] of [
    ['GitHub', 'https://github.com/petechatchawan/ua-info'],
    ['npm', 'https://www.npmjs.com/package/ua-info'],
  ] as const) {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    navigation.append(link);
  }

  element.append(identity, navigation);
  return { element, update: () => undefined, destroy: () => undefined };
}

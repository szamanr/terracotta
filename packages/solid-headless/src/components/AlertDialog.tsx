import {
  createContext,
  createEffect,
  createUniqueId,
  useContext,
  Show,
  onCleanup,
  createSignal,
} from 'solid-js';
import {
  JSX,
} from 'solid-js/jsx-runtime';
import {
  Dynamic,
} from 'solid-js/web';
import {
  omitProps,
} from 'solid-use';
import {
  HeadlessDisclosureChild,
  HeadlessDisclosureChildProps,
  HeadlessDisclosureRoot,
  HeadlessDisclosureRootProps,
  useHeadlessDisclosureChild,
} from '../headless/Disclosure';
import {
  createRef,
  DynamicNode,
  DynamicProps,
  ValidConstructor,
  WithRef,
} from '../utils/dynamic-prop';
import getFocusableElements from '../utils/get-focusable-elements';
import useFocusStartPoint from '../utils/use-focus-start-point';

interface AlertDialogContext {
  ownerID: string;
  panelID: string;
  titleID: string;
  descriptionID: string;
}

const AlertDialogContext = createContext<AlertDialogContext>();

function useAlertDialogContext(componentName: string): AlertDialogContext {
  const context = useContext(AlertDialogContext);

  if (context) {
    return context;
  }
  throw new Error(`<${componentName}> must be used inside a <AlertDialog>`);
}

export type AlertDialogProps<T extends ValidConstructor = 'div'> = {
  as?: T;
  unmount?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
} & Omit<HeadlessDisclosureRootProps, 'CONTROLLED'>
  & Omit<DynamicProps<T>, keyof HeadlessDisclosureRootProps | 'unmount'>;

export function AlertDialog<T extends ValidConstructor = 'div'>(
  props: AlertDialogProps<T>,
): JSX.Element {
  const ownerID = createUniqueId();
  const panelID = createUniqueId();
  const titleID = createUniqueId();
  const descriptionID = createUniqueId();

  const fsp = useFocusStartPoint();

  return (
    <AlertDialogContext.Provider
      value={{
        ownerID,
        panelID,
        titleID,
        descriptionID,
      }}
    >
      <HeadlessDisclosureRoot
        CONTROLLED={'isOpen' in props}
        isOpen={props.isOpen}
        onChange={(value) => {
          props.onChange?.(value);
          if (!value) {
            props.onClose?.();
            fsp.load();
          } else {
            fsp.save();
            props.onOpen?.();
          }
        }}
        defaultOpen={props.defaultOpen}
        disabled={props.disabled}
      >
        {({ isOpen }) => (
          <Show
            when={props.unmount ?? true}
            fallback={(
              <Dynamic
                component={props.as ?? 'div'}
                {...omitProps(props, [
                  'as',
                  'children',
                  'defaultOpen',
                  'unmount',
                  'isOpen',
                  'disabled',
                  'onClose',
                  'onChange',
                ])}
                id={ownerID}
                role="alertdialog"
                aria-modal
                aria-labelledby={titleID}
                aria-describedby={descriptionID}
                data-sh-alert-dialog={ownerID}
              >
                <HeadlessDisclosureChild>
                  {props.children}
                </HeadlessDisclosureChild>
              </Dynamic>
            )}
          >
            <Show when={isOpen()}>
              <Dynamic
                component={props.as ?? 'div'}
                {...omitProps(props, [
                  'as',
                  'children',
                  'defaultOpen',
                  'unmount',
                  'isOpen',
                  'disabled',
                  'onClose',
                  'onChange',
                ])}
                id={ownerID}
                role="alertdialog"
                aria-modal
                aria-labelledby={titleID}
                aria-describedby={descriptionID}
                data-sh-alert-dialog={ownerID}
              >
                <HeadlessDisclosureChild>
                  {props.children}
                </HeadlessDisclosureChild>
              </Dynamic>
            </Show>
          </Show>
        )}
      </HeadlessDisclosureRoot>
    </AlertDialogContext.Provider>
  );
}

export type AlertDialogTitleProps<T extends ValidConstructor = 'h2'> = {
  as?: T;
} & HeadlessDisclosureChildProps
  & Omit<DynamicProps<T>, keyof HeadlessDisclosureChildProps>;

export function AlertDialogTitle<T extends ValidConstructor = 'h2'>(
  props: AlertDialogTitleProps<T>,
): JSX.Element {
  const context = useAlertDialogContext('AlertDialogTitle');
  return (
    <Dynamic
      component={(props.as ?? 'h2') as T}
      {...omitProps(props, [
        'as',
        'children',
      ])}
      id={context.titleID}
      data-sh-alert-dialog-title={context.ownerID}
    >
      <HeadlessDisclosureChild>
        {props.children}
      </HeadlessDisclosureChild>
    </Dynamic>
  );
}

export type AlertDialogPanelProps<T extends ValidConstructor = 'div'> = {
  as?: T;
} & HeadlessDisclosureChildProps
  & WithRef<T>
  & Omit<DynamicProps<T>, keyof HeadlessDisclosureChildProps>;

export function AlertDialogPanel<T extends ValidConstructor = 'div'>(
  props: AlertDialogPanelProps<T>,
): JSX.Element {
  const context = useAlertDialogContext('AlertDialogPanel');
  const properties = useHeadlessDisclosureChild();

  const [internalRef, setInternalRef] = createSignal<DynamicNode<T>>();

  createEffect(() => {
    const ref = internalRef();
    if (ref instanceof HTMLElement) {
      if (properties.isOpen()) {
        const initialNodes = getFocusableElements(ref);
        if (initialNodes.length) {
          initialNodes[0].focus();
        }

        const onKeyDown = (e: KeyboardEvent) => {
          if (!props.disabled) {
            if (e.key === 'Tab') {
              e.preventDefault();

              const nodes = getFocusableElements(ref);
              if (e.shiftKey) {
                if (!document.activeElement || !ref.contains(document.activeElement)) {
                  nodes[nodes.length - 1].focus();
                } else {
                  for (let i = 0, len = nodes.length; i < len; i += 1) {
                    if (document.activeElement === nodes[i]) {
                      if (i === 0) {
                        nodes[len - 1].focus();
                      } else {
                        nodes[i - 1].focus();
                      }
                      break;
                    }
                  }
                }
              } else if (!document.activeElement || !ref.contains(document.activeElement)) {
                nodes[0].focus();
              } else {
                for (let i = 0, len = nodes.length; i < len; i += 1) {
                  if (document.activeElement === nodes[i]) {
                    if (i === len - 1) {
                      nodes[0].focus();
                    } else {
                      nodes[i + 1].focus();
                    }
                    break;
                  }
                }
              }
            } else if (e.key === 'Escape') {
              properties.setState(false);
            }
          }
        };

        ref.addEventListener('keydown', onKeyDown);
        onCleanup(() => {
          ref.removeEventListener('keydown', onKeyDown);
        });
      }
    }
  });

  return (
    <Dynamic
      component={(props.as ?? 'div') as T}
      {...omitProps(props, [
        'as',
        'children',
        'ref',
      ])}
      id={context.panelID}
      data-sh-alert-dialog-panel={context.ownerID}
      ref={createRef(props, (e) => {
        setInternalRef(() => e);
      })}
    >
      <HeadlessDisclosureChild>
        {props.children}
      </HeadlessDisclosureChild>
    </Dynamic>
  );
}

export type AlertDialogOverlayProps<T extends ValidConstructor = 'div'> = {
  as?: T;
} & HeadlessDisclosureChildProps
  & WithRef<T>
  & Omit<DynamicProps<T>, keyof HeadlessDisclosureChildProps>;

export function AlertDialogOverlay<T extends ValidConstructor = 'div'>(
  props: AlertDialogOverlayProps<T>,
): JSX.Element {
  const context = useAlertDialogContext('AlertDialogOverlay');
  const properties = useHeadlessDisclosureChild();

  const [internalRef, setInternalRef] = createSignal<DynamicNode<T>>();

  createEffect(() => {
    const ref = internalRef();

    if (ref instanceof HTMLElement) {
      const onClick = () => {
        properties.setState(false);
      };

      ref.addEventListener('click', onClick);

      onCleanup(() => {
        ref.removeEventListener('click', onClick);
      });
    }
  });

  return (
    <Dynamic
      component={(props.as ?? 'div') as T}
      {...omitProps(props, [
        'as',
        'children',
        'ref',
      ])}
      data-sh-alert-dialog-overlay={context.ownerID}
      ref={createRef(props, (e) => {
        setInternalRef(() => e);
      })}
    >
      <HeadlessDisclosureChild>
        {props.children}
      </HeadlessDisclosureChild>
    </Dynamic>
  );
}

export type AlertDialogDescriptionProps<T extends ValidConstructor = 'p'> = {
  as?: T;
} & HeadlessDisclosureChildProps
  & Omit<DynamicProps<T>, keyof HeadlessDisclosureChildProps>;

export function AlertDialogDescription<T extends ValidConstructor = 'p'>(
  props: AlertDialogDescriptionProps<T>,
): JSX.Element {
  const context = useAlertDialogContext('AlertDialogDescription');

  return (
    <Dynamic
      component={(props.as ?? 'p') as T}
      {...omitProps(props, [
        'as',
        'children',
      ])}
      id={context.descriptionID}
      data-sh-alert-dialog-description={context.ownerID}
    >
      <HeadlessDisclosureChild>
        {props.children}
      </HeadlessDisclosureChild>
    </Dynamic>
  );
}

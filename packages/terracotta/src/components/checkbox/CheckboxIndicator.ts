import {
  createEffect,
  onCleanup,
  JSX,
  createComponent,
  mergeProps,
} from 'solid-js';
import {
  omitProps,
} from 'solid-use/props';
import {
  HeadlessPropsWithRef,
  ValidConstructor,
  createForwardRef,
} from '../../utils/dynamic-prop';
import {
  createARIADisabledState,
  createCheckedState,
  createDisabledState,
} from '../../utils/state-props';
import {
  Button,
  ButtonProps,
} from '../button';
import {
  useCheckboxContext,
} from './CheckboxContext';
import { CHECKBOX_INDICATOR } from './tags';
import {
  CheckStateChild,
  CheckStateRenderProps,
  useCheckState,
} from '../../states/create-check-state';

export type CheckboxIndicatorProps<T extends ValidConstructor = 'button'> =
  HeadlessPropsWithRef<T, CheckStateRenderProps>;

export function CheckboxIndicator<T extends ValidConstructor = 'button'>(
  props: CheckboxIndicatorProps<T>,
): JSX.Element {
  const context = useCheckboxContext('CheckboxIndicator');
  const state = useCheckState();

  const [internalRef, setInternalRef] = createForwardRef(props);

  createEffect(() => {
    const ref = internalRef();

    if (ref instanceof HTMLElement) {
      const toggle = () => {
        state.toggle();
      };

      ref.addEventListener('click', toggle);
      onCleanup(() => {
        ref.removeEventListener('click', toggle);
      });
    }
  });

  return createComponent(Button, mergeProps(
    omitProps(props, [
      'children',
      'ref',
    ]),
    CHECKBOX_INDICATOR,
    {
      id: context.indicatorID,
      role: 'checkbox',
      'aria-labelledby': context.labelID,
      'aria-describedby': context.descriptionID,
      ref: setInternalRef,
    },
    createDisabledState(() => state.disabled()),
    createARIADisabledState(() => state.disabled()),
    createCheckedState(() => state.checked()),
    {
      get children() {
        return createComponent(CheckStateChild, {
          get children() {
            return props.children;
          },
        });
      },
    },
  ) as ButtonProps<T>);
}

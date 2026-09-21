import { codegenNativeComponent, type HostComponent, type ViewProps } from 'react-native';

export interface NativeProps extends ViewProps {}

/**
 * A pane whose frame is owned by the native layout engine rather than Yoga.
 * `interfaceOnly` because the iOS view ships a custom shadow node.
 */
export default codegenNativeComponent<NativeProps>('RNFoldablePane', {
  interfaceOnly: true,
}) as HostComponent<NativeProps>;

import { type CodegenTypes, codegenNativeComponent, type ViewProps } from 'react-native';

type HingeEvent = Readonly<{
  available: boolean;
  angle: CodegenTypes.Double;
  posture: string;
}>;

export interface NativeProps extends ViewProps {
  mode?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  axis?: CodegenTypes.WithDefault<'any' | 'horizontal' | 'vertical', 'any'>;
  trackHinge?: CodegenTypes.WithDefault<boolean, true>;
  onHingeUpdate?: CodegenTypes.DirectEventHandler<HingeEvent>;
}

export default codegenNativeComponent<NativeProps>('RNFoldableLayout');

import {
  type CodegenTypes,
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

type HingeEvent = Readonly<{
  available: boolean;
  angle: CodegenTypes.Double;
  posture: string;
}>;

export interface NativeProps extends ViewProps {
  mode?: CodegenTypes.WithDefault<'split' | 'overlay', 'split'>;
  axis?: CodegenTypes.WithDefault<'any' | 'horizontal' | 'vertical', 'any'>;
  trackHinge?: CodegenTypes.WithDefault<boolean, true>;
  primaryOverlayEdge?: CodegenTypes.WithDefault<'none' | 'leading' | 'trailing', 'none'>;
  secondaryOverlayEdge?: CodegenTypes.WithDefault<'none' | 'leading' | 'trailing', 'none'>;
  onHingeUpdate?: CodegenTypes.DirectEventHandler<HingeEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'RNFoldableLayout',
) as HostComponent<NativeProps>;

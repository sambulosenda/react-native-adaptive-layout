import {
  type CodegenTypes,
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
} from 'react-native';

/**
 * Pane visibility and frames in layout coordinates. Hidden panes carry a stale
 * frame. Object types are inlined because codegen cannot resolve nested aliases
 * in event payloads.
 */
type ArrangementEvent = Readonly<{
  width: CodegenTypes.Double;
  height: CodegenTypes.Double;
  primary: Readonly<{
    visible: boolean;
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
  secondary: Readonly<{
    visible: boolean;
    x: CodegenTypes.Double;
    y: CodegenTypes.Double;
    width: CodegenTypes.Double;
    height: CodegenTypes.Double;
  }>;
}>;

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
  onArrangementUpdate?: CodegenTypes.DirectEventHandler<ArrangementEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'RNFoldableLayout',
) as HostComponent<NativeProps>;

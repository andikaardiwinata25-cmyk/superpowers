import React from 'react';
import {Composition} from 'remotion';
import {AzharVox, DURATION} from './Video';
import {FPS, H, W} from './kit';
export const Root: React.FC = () => (
	<Composition id="AzharVox" component={AzharVox} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
);

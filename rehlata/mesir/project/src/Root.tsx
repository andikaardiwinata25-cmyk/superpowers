import React from 'react';
import {Composition} from 'remotion';
import {DURATION, MesirVox} from './Video';
import {FPS, H, W} from './kit';
export const Root: React.FC = () => (
	<>
		<Composition id="MesirVox" component={MesirVox} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} defaultProps={{guide: false}} />
		<Composition id="MesirVoxGuide" component={MesirVox} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} defaultProps={{guide: true}} />
	</>
);

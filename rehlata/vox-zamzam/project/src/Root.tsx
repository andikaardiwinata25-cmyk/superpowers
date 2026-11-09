import React from 'react';
import {Composition} from 'remotion';
import {DURATION, VoxZamzam} from './Video';
import {FPS, H, W} from './kit';
export const Root: React.FC = () => (
	<Composition id="VoxZamzam" component={VoxZamzam} durationInFrames={DURATION * FPS} fps={FPS} width={W} height={H} />
);

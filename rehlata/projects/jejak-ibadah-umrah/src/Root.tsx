import React from 'react';
import {Composition} from 'remotion';
import {JejakIbadah, TOTAL_FRAMES} from './Video';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="JejakIbadah"
		component={JejakIbadah}
		durationInFrames={TOTAL_FRAMES}
		fps={30}
		width={1080}
		height={1920}
	/>
);

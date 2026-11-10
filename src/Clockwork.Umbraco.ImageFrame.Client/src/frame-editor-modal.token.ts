import { UmbModalToken } from '@umbraco-cms/backoffice/modal';
import type { ImageFrameConfig, ImageFrameValue } from './frame-math.js';

export interface ImageFrameEditorModalData {
	url: string;
	name?: string;
	config: ImageFrameConfig;
}

export type ImageFrameEditorModalValue = ImageFrameValue;

export const CLOCKWORK_IMAGE_FRAME_EDITOR_MODAL = new UmbModalToken<ImageFrameEditorModalData, ImageFrameEditorModalValue>(
	'Clockwork.Modal.ImageFrameEditor',
	{ modal: { type: 'sidebar', size: 'large' } },
);

/**
 * Frame model shared by the editor and the server (see ImageFrameTransform.cs):
 * - zoom 1 = the whole image fits inside the frame ("contain")
 * - x/y = position of the image centre inside the frame, 0..1
 * - rotation in degrees clockwise around the image centre; flips are applied before rotating.
 */
export interface ImageFrameValue {
	mediaKey: string;
	imageWidth?: number;
	imageHeight?: number;
	zoom: number;
	x: number;
	y: number;
	rotation: number;
	flipX: boolean;
	flipY: boolean;
}

export interface ImageFrameConfig {
	width: number;
	height: number;
	minZoom: number;
	maxZoom: number;
	allowRotate: boolean;
	allowFlip: boolean;
	background: string | null;
}

export const DEFAULT_CONFIG: ImageFrameConfig = {
	width: 300,
	height: 150,
	minZoom: 0.2,
	maxZoom: 4,
	allowRotate: true,
	allowFlip: true,
	background: null,
};

export function createValue(mediaKey: string, imageWidth?: number, imageHeight?: number): ImageFrameValue {
	return { mediaKey, imageWidth, imageHeight, zoom: 1, x: 0.5, y: 0.5, rotation: 0, flipX: false, flipY: false };
}

const GUID = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})$/i;

function toGuid(input: unknown): string | undefined {
	if (typeof input !== 'string') return undefined;
	const match = GUID.exec(input.trim());
	if (!match) return undefined;
	const hex = match[1].replace(/-/g, '').toLowerCase();
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Reads this editor's value, or a value left behind by Umbraco's Media Picker (v3 array or UDI string). */
export function parseValue(raw: unknown): ImageFrameValue | undefined {
	if (raw == null || raw === '') return undefined;
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				return parseValue(JSON.parse(trimmed));
			} catch {
				return undefined;
			}
		}
		const key = toGuid(trimmed.split(',')[0]);
		return key ? createValue(key) : undefined;
	}
	if (Array.isArray(raw)) {
		for (const item of raw) {
			const parsed = parseValue(item);
			if (parsed) return parsed;
		}
		return undefined;
	}
	if (typeof raw === 'object') {
		const o = raw as Record<string, unknown>;
		const key = toGuid(o.mediaKey) ?? toGuid(o.udi);
		if (!key) return undefined;
		const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
		const optional = (v: unknown) => (typeof v === 'number' && v > 0 ? Math.round(v) : undefined);
		return {
			mediaKey: key,
			imageWidth: optional(o.imageWidth),
			imageHeight: optional(o.imageHeight),
			zoom: num(o.zoom, 1),
			x: num(o.x, 0.5),
			y: num(o.y, 0.5),
			rotation: num(o.rotation, 0),
			flipX: o.flipX === true,
			flipY: o.flipY === true,
		};
	}
	return undefined;
}

export function baseScale(imageWidth: number, imageHeight: number, config: ImageFrameConfig): number {
	if (!imageWidth || !imageHeight) return 1;
	return Math.min(config.width / imageWidth, config.height / imageHeight);
}

/** Zoom at which the image covers the whole frame (ignoring rotation). */
export function coverZoom(imageWidth: number, imageHeight: number, config: ImageFrameConfig): number {
	if (!imageWidth || !imageHeight) return 1;
	const cover = Math.max(config.width / imageWidth, config.height / imageHeight);
	return cover / baseScale(imageWidth, imageHeight, config);
}

const r = (n: number) => Math.round(n * 10000) / 10000;

/** Inline style for an <img> placed inside a positioned frame box; mirrors ImageFrameValue.GetCssStyles() on the server. */
export function imageStyle(value: ImageFrameValue, config: ImageFrameConfig, imageWidth?: number, imageHeight?: number): string {
	const w = imageWidth || value.imageWidth || config.width;
	const h = imageHeight || value.imageHeight || config.height;
	const scale = baseScale(w, h, config) * value.zoom;
	const widthPercent = ((scale * w) / config.width) * 100;
	const heightPercent = ((scale * h) / config.height) * 100;
	return [
		'position:absolute',
		`left:${r(value.x * 100)}%`,
		`top:${r(value.y * 100)}%`,
		`width:${r(widthPercent)}%`,
		`height:${r(heightPercent)}%`,
		'max-width:none',
		'max-height:none',
		`transform:translate(-50%,-50%) rotate(${r(value.rotation)}deg) scale(${value.flipX ? -1 : 1},${value.flipY ? -1 : 1})`,
	].join(';');
}

export function normalizeHex(input: unknown): string | null {
	if (typeof input !== 'string') return null;
	const m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
	if (!m) return null;
	const hex = m[1].toLowerCase();
	return '#' + (hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex);
}

export function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

export function loadImageSize(url: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => resolve({ width: 0, height: 0 });
		img.src = url;
	});
}

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'tif', 'tiff'];

export function isImageUrl(url: string | undefined): boolean {
	if (!url) return false;
	const ext = url.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
	return IMAGE_EXTENSIONS.includes(ext);
}

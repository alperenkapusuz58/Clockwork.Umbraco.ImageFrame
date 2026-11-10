import { css, customElement, html, nothing, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { umbOpenModal } from '@umbraco-cms/backoffice/modal';
import { UMB_MEDIA_PICKER_MODAL, UmbMediaItemRepository, UmbMediaUrlRepository } from '@umbraco-cms/backoffice/media';
import type { UmbPropertyEditorConfigCollection, UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/property-editor';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { checkerboard } from './frame-styles.js';
import { CLOCKWORK_IMAGE_FRAME_EDITOR_MODAL } from './frame-editor-modal.token.js';
import {
	DEFAULT_CONFIG,
	createValue,
	imageStyle,
	isImageUrl,
	loadImageSize,
	normalizeHex,
	parseValue,
	type ImageFrameConfig,
	type ImageFrameValue,
} from './frame-math.js';

const PREVIEW_MAX_WIDTH = 320;
const PREVIEW_MAX_HEIGHT = 200;

@customElement('clockwork-property-editor-ui-image-frame')
export class ClockworkPropertyEditorUiImageFrameElement extends UmbLitElement implements UmbPropertyEditorUiElement {
	#value?: ImageFrameValue;
	#mediaUrlRepository = new UmbMediaUrlRepository(this);
	#mediaItemRepository = new UmbMediaItemRepository(this);

	@state() private _config: ImageFrameConfig = { ...DEFAULT_CONFIG };
	@state() private _url?: string;
	@state() private _name?: string;
	@state() private _imageWidth = 0;
	@state() private _imageHeight = 0;
	@state() private _error?: string;
	@state() private _loading = false;

	@property({ type: Boolean, reflect: true }) readonly = false;

	@property({ attribute: false })
	public set value(raw: unknown) {
		const parsed = parseValue(raw);
		const keyChanged = parsed?.mediaKey !== this.#value?.mediaKey;
		this.#value = parsed;
		if (keyChanged) this.#loadMedia();
		this.requestUpdate();
	}
	public get value(): ImageFrameValue | undefined {
		return this.#value;
	}

	@property({ attribute: false })
	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		const num = (alias: string, fallback: number) => {
			const v = Number(config?.getValueByAlias(alias));
			return Number.isFinite(v) && v > 0 ? v : fallback;
		};
		const bool = (alias: string, fallback: boolean) => {
			const v = config?.getValueByAlias<unknown>(alias);
			return v === undefined || v === null || v === '' ? fallback : v === true || v === 'true' || v === 1 || v === '1';
		};
		const minZoom = num('minZoom', DEFAULT_CONFIG.minZoom);
		this._config = {
			width: Math.round(num('width', DEFAULT_CONFIG.width)),
			height: Math.round(num('height', DEFAULT_CONFIG.height)),
			minZoom,
			maxZoom: Math.max(minZoom, num('maxZoom', DEFAULT_CONFIG.maxZoom)),
			allowRotate: bool('allowRotate', DEFAULT_CONFIG.allowRotate),
			allowFlip: bool('allowFlip', DEFAULT_CONFIG.allowFlip),
			background: normalizeHex(config?.getValueByAlias<string>('background')),
		};
	}

	async #loadMedia() {
		const key = this.#value?.mediaKey;
		this._error = undefined;
		if (!key) {
			this._url = this._name = undefined;
			return;
		}
		this._loading = true;
		const [{ data: urls }, { data: items }] = await Promise.all([
			this.#mediaUrlRepository.requestItems([key]),
			this.#mediaItemRepository.requestItems([key]),
		]);
		if (this.#value?.mediaKey !== key) return;
		this._url = urls?.[0]?.url;
		this._name = items?.[0]?.name;
		if (this._url) {
			const size = await loadImageSize(this._url);
			this._imageWidth = size.width;
			this._imageHeight = size.height;
		} else {
			this._error = this.localize.term('clockworkImageFrame_missingMedia');
		}
		this._loading = false;
	}

	#emit(value: ImageFrameValue | undefined) {
		this.#value = value;
		this.requestUpdate();
		this.dispatchEvent(new UmbChangeEvent());
	}

	async #pick() {
		const result = await umbOpenModal(this, UMB_MEDIA_PICKER_MODAL, {
			data: { multiple: false },
			value: { selection: this.#value ? [this.#value.mediaKey] : [] },
		}).catch(() => undefined);
		const key = result?.selection?.find((x): x is string => !!x);
		if (!key) return;

		const { data } = await this.#mediaUrlRepository.requestItems([key]);
		const url = data?.[0]?.url;
		if (!isImageUrl(url)) {
			this._error = this.localize.term('clockworkImageFrame_notAnImage');
			return;
		}
		const size = await loadImageSize(url!);
		this._error = undefined;
		this.#emit(createValue(key, size.width || undefined, size.height || undefined));
	}

	async #edit() {
		if (!this.#value || !this._url) return;
		const result = await umbOpenModal(this, CLOCKWORK_IMAGE_FRAME_EDITOR_MODAL, {
			data: { url: this._url, name: this._name, config: this._config },
			value: { ...this.#value },
		}).catch(() => undefined);
		if (result) this.#emit({ ...result, mediaKey: this.#value.mediaKey });
	}

	#remove() {
		this._url = this._name = undefined;
		this.#emit(undefined);
	}

	#renderPreview(value: ImageFrameValue) {
		const cfg = this._config;
		const k = Math.min(PREVIEW_MAX_WIDTH / cfg.width, PREVIEW_MAX_HEIGHT / cfg.height, 1);
		const background = normalizeHex(cfg.background);
		return html`
			<button
				type="button"
				id="preview"
				class=${background ? '' : 'cw-checker'}
				style="width:${cfg.width * k}px;height:${cfg.height * k}px;${background ? `background:${background};` : ''}"
				?disabled=${this.readonly || !this._url}
				title=${this.localize.term('clockworkImageFrame_edit')}
				@click=${this.#edit}>
				${this._url
					? html`<img src=${this._url} alt=${this._name ?? ''} style=${imageStyle(value, cfg, this._imageWidth, this._imageHeight)} />`
					: this._loading
						? html`<uui-loader-circle></uui-loader-circle>`
						: html`<uui-icon name="icon-alert"></uui-icon>`}
			</button>
		`;
	}

	override render() {
		const value = this.#value;
		const cfg = this._config;
		return html`
			${value
				? html`<div id="selected">
						${this.#renderPreview(value)}
						<div id="meta">
							<strong>${this._name ?? ''}</strong>
							<small>${this.localize.term('clockworkImageFrame_frameSize')}: ${cfg.width} × ${cfg.height} px · ${Math.round(value.zoom * 100)}%</small>
							${this.readonly
								? nothing
								: html`<div id="actions">
										<uui-button look="primary" label=${this.localize.term('clockworkImageFrame_edit')} ?disabled=${!this._url} @click=${this.#edit}>
											<uui-icon name="icon-crop"></uui-icon> ${this.localize.term('clockworkImageFrame_edit')}
										</uui-button>
										<uui-button look="secondary" label=${this.localize.term('clockworkImageFrame_replace')} @click=${this.#pick}></uui-button>
										<uui-button look="secondary" color="danger" label=${this.localize.term('general_remove')} @click=${this.#remove}></uui-button>
									</div>`}
						</div>
					</div>`
				: html`<uui-button
						id="add"
						look="placeholder"
						label=${this.localize.term('clockworkImageFrame_choose')}
						?disabled=${this.readonly}
						@click=${this.#pick}>
						<uui-icon name="icon-add"></uui-icon>
						${this.localize.term('clockworkImageFrame_choose')}
						<small>${cfg.width} × ${cfg.height} px</small>
					</uui-button>`}
			${this._error ? html`<div id="error">${this._error}</div>` : nothing}
		`;
	}

	static override styles = [
		UmbTextStyles,
		checkerboard,
		css`
			#selected {
				display: flex;
				gap: var(--uui-size-space-5);
				align-items: flex-start;
				flex-wrap: wrap;
			}
			#preview {
				position: relative;
				overflow: hidden;
				padding: 0;
				border: 1px solid var(--uui-color-border);
				border-radius: var(--uui-border-radius);
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				flex: none;
			}
			#preview:disabled {
				cursor: default;
			}
			#preview:not(:disabled):hover {
				border-color: var(--uui-color-interactive-emphasis);
			}
			#meta {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-2);
				min-width: 200px;
			}
			#meta small {
				color: var(--uui-color-text-alt);
			}
			#actions {
				display: flex;
				flex-wrap: wrap;
				gap: var(--uui-size-space-2);
				margin-top: var(--uui-size-space-2);
			}
			#add {
				width: 100%;
				max-width: 320px;
				min-height: 100px;
			}
			#add small {
				display: block;
				color: var(--uui-color-text-alt);
			}
			#error {
				margin-top: var(--uui-size-space-3);
				color: var(--uui-color-danger);
			}
		`,
	];
}

export default ClockworkPropertyEditorUiImageFrameElement;

declare global {
	interface HTMLElementTagNameMap {
		'clockwork-property-editor-ui-image-frame': ClockworkPropertyEditorUiImageFrameElement;
	}
}

import { css, customElement, html, nothing, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { checkerboard } from './frame-styles.js';
import { clamp, coverZoom, imageStyle, loadImageSize, normalizeHex, type ImageFrameValue } from './frame-math.js';
import type { ImageFrameEditorModalData, ImageFrameEditorModalValue } from './frame-editor-modal.token.js';

const STAGE_PADDING = 48;

@customElement('clockwork-image-frame-editor-modal')
export class ClockworkImageFrameEditorModalElement extends UmbModalBaseElement<ImageFrameEditorModalData, ImageFrameEditorModalValue> {
	@state() private _imageWidth = 0;
	@state() private _imageHeight = 0;
	@state() private _stageWidth = 640;
	@state() private _stageHeight = 420;

	#drag?: { pointerId: number; startX: number; startY: number; x: number; y: number };
	#resizeObserver = new ResizeObserver((entries) => {
		const rect = entries[0]?.contentRect;
		if (rect && rect.width > 0) {
			this._stageWidth = rect.width;
			this._stageHeight = rect.height;
		}
	});

	override async firstUpdated() {
		const stage = this.shadowRoot?.querySelector('#stage');
		if (stage) this.#resizeObserver.observe(stage);
		if (this.data?.url) {
			const size = await loadImageSize(this.data.url);
			this._imageWidth = size.width;
			this._imageHeight = size.height;
			if (size.width && size.height) this.#update({ imageWidth: size.width, imageHeight: size.height });
		}
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.#resizeObserver.disconnect();
	}

	get #config() {
		return this.data!.config;
	}

	#update(partial: Partial<ImageFrameValue>) {
		this.updateValue(partial);
		this.requestUpdate();
	}

	/** Pixels per frame pixel on screen. */
	get #displayScale() {
		const cfg = this.#config;
		return Math.min((this._stageWidth - STAGE_PADDING * 2) / cfg.width, (this._stageHeight - STAGE_PADDING * 2) / cfg.height, 4);
	}

	#setZoom(zoom: number) {
		this.#update({ zoom: clamp(zoom, this.#config.minZoom, this.#config.maxZoom) });
	}

	#onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		this.#drag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, x: this.value.x, y: this.value.y };
	}

	#onPointerMove(e: PointerEvent) {
		if (!this.#drag || this.#drag.pointerId !== e.pointerId) return;
		const k = this.#displayScale;
		const cfg = this.#config;
		this.#update({
			x: clamp(this.#drag.x + (e.clientX - this.#drag.startX) / (cfg.width * k), -1, 2),
			y: clamp(this.#drag.y + (e.clientY - this.#drag.startY) / (cfg.height * k), -1, 2),
		});
	}

	#onPointerUp(e: PointerEvent) {
		if (this.#drag?.pointerId === e.pointerId) this.#drag = undefined;
	}

	#onWheel(e: WheelEvent) {
		e.preventDefault();
		this.#setZoom(this.value.zoom * Math.exp(-e.deltaY * 0.0015));
	}

	#onKeyDown(e: KeyboardEvent) {
		const step = e.shiftKey ? 0.05 : 0.005;
		const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
		const move = moves[e.key];
		if (move) {
			e.preventDefault();
			this.#update({ x: this.value.x + move[0], y: this.value.y + move[1] });
		} else if (e.key === '+' || e.key === '=') {
			this.#setZoom(this.value.zoom * 1.05);
		} else if (e.key === '-') {
			this.#setZoom(this.value.zoom / 1.05);
		}
	}

	#fit() {
		this.#update({ zoom: clamp(1, this.#config.minZoom, this.#config.maxZoom), x: 0.5, y: 0.5 });
	}

	#fill() {
		this.#update({ zoom: clamp(coverZoom(this._imageWidth, this._imageHeight, this.#config), this.#config.minZoom, this.#config.maxZoom), x: 0.5, y: 0.5 });
	}

	#reset() {
		this.#update({ zoom: 1, x: 0.5, y: 0.5, rotation: 0, flipX: false, flipY: false });
	}

	#rotateBy(delta: number) {
		const next = Math.round((this.value.rotation + delta) * 100) / 100;
		this.#update({ rotation: ((next % 360) + 540) % 360 - 180 });
	}

	get #quarterTurn() {
		return Math.round(this.value.rotation / 90) * 90;
	}

	override render() {
		if (!this.data) return nothing;
		const cfg = this.#config;
		const value = this.value;
		const k = this.#displayScale;
		const frameW = cfg.width * k;
		const frameH = cfg.height * k;
		const background = normalizeHex(cfg.background);
		const fine = value.rotation - this.#quarterTurn;

		return html`
			<umb-body-layout headline=${this.localize.term('clockworkImageFrame_editHeadline')}>
				<div id="layout">
					<div
						id="stage"
						tabindex="0"
						aria-label=${this.localize.term('clockworkImageFrame_stageLabel')}
						@pointerdown=${this.#onPointerDown}
						@pointermove=${this.#onPointerMove}
						@pointerup=${this.#onPointerUp}
						@pointercancel=${this.#onPointerUp}
						@wheel=${this.#onWheel}
						@keydown=${this.#onKeyDown}>
						<div
							id="frame"
							class=${background ? '' : 'cw-checker'}
							style="width:${frameW}px;height:${frameH}px;${background ? `background:${background};` : ''}">
							<img src=${this.data.url} alt="" draggable="false" style=${imageStyle(value, cfg, this._imageWidth, this._imageHeight)} />
						</div>
						<div id="mask" style="width:${frameW}px;height:${frameH}px;"></div>
					</div>

					<div id="controls">
						<div class="group">
							<div class="label-row">
								<strong>${this.localize.term('clockworkImageFrame_zoom')}</strong>
								<span>${Math.round(value.zoom * 100)}%</span>
							</div>
							<div class="slider-row">
								<uui-button compact look="secondary" label=${this.localize.term('clockworkImageFrame_zoomOut')} @click=${() => this.#setZoom(value.zoom / 1.1)}>
									<span class="glyph" aria-hidden="true">−</span>
								</uui-button>
								<input
									type="range"
									min=${Math.log(cfg.minZoom)}
									max=${Math.log(cfg.maxZoom)}
									step="0.001"
									.value=${String(Math.log(value.zoom))}
									@input=${(e: Event) => this.#setZoom(Math.exp(Number((e.target as HTMLInputElement).value)))}
									aria-label=${this.localize.term('clockworkImageFrame_zoom')} />
								<uui-button compact look="secondary" label=${this.localize.term('clockworkImageFrame_zoomIn')} @click=${() => this.#setZoom(value.zoom * 1.1)}>
									<span class="glyph" aria-hidden="true">+</span>
								</uui-button>
							</div>
							<div class="button-row">
								<uui-button look="secondary" label=${this.localize.term('clockworkImageFrame_fit')} @click=${this.#fit}></uui-button>
								<uui-button look="secondary" label=${this.localize.term('clockworkImageFrame_fill')} @click=${this.#fill}></uui-button>
								<uui-button look="secondary" label=${this.localize.term('clockworkImageFrame_center')} @click=${() => this.#update({ x: 0.5, y: 0.5 })}></uui-button>
							</div>
						</div>

						${cfg.allowRotate
							? html`<div class="group">
									<div class="label-row">
										<strong>${this.localize.term('clockworkImageFrame_rotate')}</strong>
										<span>${Math.round(value.rotation * 10) / 10}°</span>
									</div>
									<div class="slider-row">
										<uui-button compact look="secondary" label=${this.localize.term('clockworkImageFrame_rotateLeft')} @click=${() => this.#rotateBy(-90)}>
											<uui-icon name="icon-undo"></uui-icon>
										</uui-button>
										<input
											type="range"
											min="-45"
											max="45"
											step="0.5"
											.value=${String(fine)}
											@input=${(e: Event) => this.#update({ rotation: this.#quarterTurn + Number((e.target as HTMLInputElement).value) })}
											aria-label=${this.localize.term('clockworkImageFrame_rotate')} />
										<uui-button compact look="secondary" label=${this.localize.term('clockworkImageFrame_rotateRight')} @click=${() => this.#rotateBy(90)}>
											<uui-icon name="icon-redo"></uui-icon>
										</uui-button>
									</div>
								</div>`
							: nothing}
						${cfg.allowFlip
							? html`<div class="group">
									<strong>${this.localize.term('clockworkImageFrame_flip')}</strong>
									<div class="button-row">
										<uui-button
											look=${value.flipX ? 'primary' : 'secondary'}
											label=${this.localize.term('clockworkImageFrame_flipHorizontal')}
											@click=${() => this.#update({ flipX: !value.flipX })}></uui-button>
										<uui-button
											look=${value.flipY ? 'primary' : 'secondary'}
											label=${this.localize.term('clockworkImageFrame_flipVertical')}
											@click=${() => this.#update({ flipY: !value.flipY })}></uui-button>
									</div>
								</div>`
							: nothing}

						<div class="group info">
							<span>${this.localize.term('clockworkImageFrame_outputSize')}: <strong>${cfg.width} × ${cfg.height} px</strong></span>
							${this._imageWidth ? html`<span>${this.localize.term('clockworkImageFrame_sourceSize')}: ${this._imageWidth} × ${this._imageHeight} px</span>` : nothing}
							<small>${this.localize.term('clockworkImageFrame_hint')}</small>
							<uui-button look="outline" color="danger" label=${this.localize.term('clockworkImageFrame_reset')} @click=${this.#reset}></uui-button>
						</div>
					</div>
				</div>

				<uui-button slot="actions" label=${this.localize.term('general_close')} @click=${this._rejectModal}></uui-button>
				<uui-button slot="actions" look="primary" color="positive" label=${this.localize.term('general_submit')} @click=${this._submitModal}></uui-button>
			</umb-body-layout>
		`;
	}

	static override styles = [
		UmbTextStyles,
		checkerboard,
		css`
			#layout {
				display: grid;
				grid-template-columns: minmax(0, 1fr) 280px;
				gap: var(--uui-size-space-5);
				height: 100%;
				min-height: 460px;
			}
			@media (max-width: 900px) {
				#layout {
					grid-template-columns: 1fr;
				}
			}
			#stage {
				position: relative;
				overflow: hidden;
				min-height: 420px;
				background: #3b3d45;
				border-radius: var(--uui-border-radius);
				cursor: grab;
				touch-action: none;
				user-select: none;
				outline: none;
			}
			#stage:focus-visible {
				box-shadow: 0 0 0 2px var(--uui-color-focus);
			}
			#stage:active {
				cursor: grabbing;
			}
			#frame,
			#mask {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
			#frame img {
				pointer-events: none;
			}
			#mask {
				pointer-events: none;
				outline: 2px solid #fff;
				box-shadow: 0 0 0 9999px rgba(20, 20, 26, 0.62);
			}
			#controls {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-5);
			}
			.group {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-3);
			}
			.label-row {
				display: flex;
				justify-content: space-between;
			}
			.slider-row {
				display: flex;
				align-items: center;
				gap: var(--uui-size-space-2);
			}
			.slider-row input {
				flex: 1;
				accent-color: var(--uui-color-interactive-emphasis);
			}
			.glyph {
				display: inline-block;
				width: 1em;
				font-size: 1.1rem;
				font-weight: 700;
				line-height: 1;
			}
			.button-row {
				display: flex;
				flex-wrap: wrap;
				gap: var(--uui-size-space-2);
			}
			.info {
				margin-top: auto;
				color: var(--uui-color-text-alt);
			}
		`,
	];
}

export default ClockworkImageFrameEditorModalElement;

declare global {
	interface HTMLElementTagNameMap {
		'clockwork-image-frame-editor-modal': ClockworkImageFrameEditorModalElement;
	}
}

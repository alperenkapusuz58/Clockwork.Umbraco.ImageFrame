import { nothing as v, html as k, css as X, state as w, customElement as A } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement as O } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles as R } from "@umbraco-cms/backoffice/style";
import { l as U, n as T, a as q, d as g, e as G, b as L } from "./frame-math-BoLC1tYc.js";
var N = Object.defineProperty, B = Object.getOwnPropertyDescriptor, W = (t) => {
  throw TypeError(t);
}, f = (t, i, a, l) => {
  for (var h = l > 1 ? void 0 : l ? B(i, a) : i, m = t.length - 1, p; m >= 0; m--)
    (p = t[m]) && (h = (l ? p(i, a, h) : p(h)) || h);
  return l && h && N(i, a, h), h;
}, I = (t, i, a) => i.has(t) || W("Cannot " + a), s = (t, i, a) => (I(t, i, "read from private field"), a ? a.call(t) : i.get(t)), $ = (t, i, a) => i.has(t) ? W("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, a), H = (t, i, a, l) => (I(t, i, "write to private field"), i.set(t, a), a), o = (t, i, a) => (I(t, i, "access private method"), a), n, _, e, c, r, F, d, S, E, y, C, Z, D, P, Y, x, z;
const M = 48;
let u = class extends O {
  constructor() {
    super(...arguments), $(this, e), this._imageWidth = 0, this._imageHeight = 0, this._stageWidth = 640, this._stageHeight = 420, $(this, n), $(this, _, new ResizeObserver((t) => {
      var a;
      const i = (a = t[0]) == null ? void 0 : a.contentRect;
      i && i.width > 0 && (this._stageWidth = i.width, this._stageHeight = i.height);
    }));
  }
  async firstUpdated() {
    var i, a;
    const t = (i = this.shadowRoot) == null ? void 0 : i.querySelector("#stage");
    if (t && s(this, _).observe(t), (a = this.data) != null && a.url) {
      const l = await U(this.data.url);
      this._imageWidth = l.width, this._imageHeight = l.height, l.width && l.height && o(this, e, r).call(this, { imageWidth: l.width, imageHeight: l.height });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback(), s(this, _).disconnect();
  }
  render() {
    if (!this.data) return v;
    const t = s(this, e, c), i = this.value, a = s(this, e, F), l = t.width * a, h = t.height * a, m = T(t.background), p = i.rotation - s(this, e, z);
    return k`
			<umb-body-layout headline=${this.localize.term("clockworkImageFrame_editHeadline")}>
				<div id="layout">
					<div
						id="stage"
						tabindex="0"
						aria-label=${this.localize.term("clockworkImageFrame_stageLabel")}
						@pointerdown=${o(this, e, S)}
						@pointermove=${o(this, e, E)}
						@pointerup=${o(this, e, y)}
						@pointercancel=${o(this, e, y)}
						@wheel=${o(this, e, C)}
						@keydown=${o(this, e, Z)}>
						<div
							id="frame"
							class=${m ? "" : "cw-checker"}
							style="width:${l}px;height:${h}px;${m ? `background:${m};` : ""}">
							<img src=${this.data.url} alt="" draggable="false" style=${q(i, t, this._imageWidth, this._imageHeight)} />
						</div>
						<div id="mask" style="width:${l}px;height:${h}px;"></div>
					</div>

					<div id="controls">
						<div class="group">
							<div class="label-row">
								<strong>${this.localize.term("clockworkImageFrame_zoom")}</strong>
								<span>${Math.round(i.zoom * 100)}%</span>
							</div>
							<div class="slider-row">
								<uui-button compact look="secondary" label=${this.localize.term("clockworkImageFrame_zoomOut")} @click=${() => o(this, e, d).call(this, i.zoom / 1.1)}>
									<span class="glyph" aria-hidden="true">−</span>
								</uui-button>
								<input
									type="range"
									min=${Math.log(t.minZoom)}
									max=${Math.log(t.maxZoom)}
									step="0.001"
									.value=${String(Math.log(i.zoom))}
									@input=${(b) => o(this, e, d).call(this, Math.exp(Number(b.target.value)))}
									aria-label=${this.localize.term("clockworkImageFrame_zoom")} />
								<uui-button compact look="secondary" label=${this.localize.term("clockworkImageFrame_zoomIn")} @click=${() => o(this, e, d).call(this, i.zoom * 1.1)}>
									<span class="glyph" aria-hidden="true">+</span>
								</uui-button>
							</div>
							<div class="button-row">
								<uui-button look="secondary" label=${this.localize.term("clockworkImageFrame_fit")} @click=${o(this, e, D)}></uui-button>
								<uui-button look="secondary" label=${this.localize.term("clockworkImageFrame_fill")} @click=${o(this, e, P)}></uui-button>
								<uui-button look="secondary" label=${this.localize.term("clockworkImageFrame_center")} @click=${() => o(this, e, r).call(this, { x: 0.5, y: 0.5 })}></uui-button>
							</div>
						</div>

						${t.allowRotate ? k`<div class="group">
									<div class="label-row">
										<strong>${this.localize.term("clockworkImageFrame_rotate")}</strong>
										<span>${Math.round(i.rotation * 10) / 10}°</span>
									</div>
									<div class="slider-row">
										<uui-button compact look="secondary" label=${this.localize.term("clockworkImageFrame_rotateLeft")} @click=${() => o(this, e, x).call(this, -90)}>
											<uui-icon name="icon-undo"></uui-icon>
										</uui-button>
										<input
											type="range"
											min="-45"
											max="45"
											step="0.5"
											.value=${String(p)}
											@input=${(b) => o(this, e, r).call(this, { rotation: s(this, e, z) + Number(b.target.value) })}
											aria-label=${this.localize.term("clockworkImageFrame_rotate")} />
										<uui-button compact look="secondary" label=${this.localize.term("clockworkImageFrame_rotateRight")} @click=${() => o(this, e, x).call(this, 90)}>
											<uui-icon name="icon-redo"></uui-icon>
										</uui-button>
									</div>
								</div>` : v}
						${t.allowFlip ? k`<div class="group">
									<strong>${this.localize.term("clockworkImageFrame_flip")}</strong>
									<div class="button-row">
										<uui-button
											look=${i.flipX ? "primary" : "secondary"}
											label=${this.localize.term("clockworkImageFrame_flipHorizontal")}
											@click=${() => o(this, e, r).call(this, { flipX: !i.flipX })}></uui-button>
										<uui-button
											look=${i.flipY ? "primary" : "secondary"}
											label=${this.localize.term("clockworkImageFrame_flipVertical")}
											@click=${() => o(this, e, r).call(this, { flipY: !i.flipY })}></uui-button>
									</div>
								</div>` : v}

						<div class="group info">
							<span>${this.localize.term("clockworkImageFrame_outputSize")}: <strong>${t.width} × ${t.height} px</strong></span>
							${this._imageWidth ? k`<span>${this.localize.term("clockworkImageFrame_sourceSize")}: ${this._imageWidth} × ${this._imageHeight} px</span>` : v}
							<small>${this.localize.term("clockworkImageFrame_hint")}</small>
							<uui-button look="outline" color="danger" label=${this.localize.term("clockworkImageFrame_reset")} @click=${o(this, e, Y)}></uui-button>
						</div>
					</div>
				</div>

				<uui-button slot="actions" label=${this.localize.term("general_close")} @click=${this._rejectModal}></uui-button>
				<uui-button slot="actions" look="primary" color="positive" label=${this.localize.term("general_submit")} @click=${this._submitModal}></uui-button>
			</umb-body-layout>
		`;
  }
};
n = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
e = /* @__PURE__ */ new WeakSet();
c = function() {
  return this.data.config;
};
r = function(t) {
  this.updateValue(t), this.requestUpdate();
};
F = function() {
  const t = s(this, e, c);
  return Math.min((this._stageWidth - M * 2) / t.width, (this._stageHeight - M * 2) / t.height, 4);
};
d = function(t) {
  o(this, e, r).call(this, { zoom: g(t, s(this, e, c).minZoom, s(this, e, c).maxZoom) });
};
S = function(t) {
  t.button === 0 && (t.currentTarget.setPointerCapture(t.pointerId), H(this, n, { pointerId: t.pointerId, startX: t.clientX, startY: t.clientY, x: this.value.x, y: this.value.y }));
};
E = function(t) {
  if (!s(this, n) || s(this, n).pointerId !== t.pointerId) return;
  const i = s(this, e, F), a = s(this, e, c);
  o(this, e, r).call(this, {
    x: g(s(this, n).x + (t.clientX - s(this, n).startX) / (a.width * i), -1, 2),
    y: g(s(this, n).y + (t.clientY - s(this, n).startY) / (a.height * i), -1, 2)
  });
};
y = function(t) {
  var i;
  ((i = s(this, n)) == null ? void 0 : i.pointerId) === t.pointerId && H(this, n, void 0);
};
C = function(t) {
  t.preventDefault(), o(this, e, d).call(this, this.value.zoom * Math.exp(-t.deltaY * 15e-4));
};
Z = function(t) {
  const i = t.shiftKey ? 0.05 : 5e-3, l = { ArrowLeft: [-i, 0], ArrowRight: [i, 0], ArrowUp: [0, -i], ArrowDown: [0, i] }[t.key];
  l ? (t.preventDefault(), o(this, e, r).call(this, { x: this.value.x + l[0], y: this.value.y + l[1] })) : t.key === "+" || t.key === "=" ? o(this, e, d).call(this, this.value.zoom * 1.05) : t.key === "-" && o(this, e, d).call(this, this.value.zoom / 1.05);
};
D = function() {
  o(this, e, r).call(this, { zoom: g(1, s(this, e, c).minZoom, s(this, e, c).maxZoom), x: 0.5, y: 0.5 });
};
P = function() {
  o(this, e, r).call(this, { zoom: g(G(this._imageWidth, this._imageHeight, s(this, e, c)), s(this, e, c).minZoom, s(this, e, c).maxZoom), x: 0.5, y: 0.5 });
};
Y = function() {
  o(this, e, r).call(this, { zoom: 1, x: 0.5, y: 0.5, rotation: 0, flipX: !1, flipY: !1 });
};
x = function(t) {
  const i = Math.round((this.value.rotation + t) * 100) / 100;
  o(this, e, r).call(this, { rotation: (i % 360 + 540) % 360 - 180 });
};
z = function() {
  return Math.round(this.value.rotation / 90) * 90;
};
u.styles = [
  R,
  L,
  X`
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
		`
];
f([
  w()
], u.prototype, "_imageWidth", 2);
f([
  w()
], u.prototype, "_imageHeight", 2);
f([
  w()
], u.prototype, "_stageWidth", 2);
f([
  w()
], u.prototype, "_stageHeight", 2);
u = f([
  A("clockwork-image-frame-editor-modal")
], u);
const j = u;
export {
  u as ClockworkImageFrameEditorModalElement,
  j as default
};

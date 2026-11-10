import { nothing as x, html as m, css as W, state as _, property as k, customElement as P } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as O } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent as K } from "@umbraco-cms/backoffice/event";
import { UmbModalToken as D, umbOpenModal as E } from "@umbraco-cms/backoffice/modal";
import { UmbMediaUrlRepository as H, UmbMediaItemRepository as S, UMB_MEDIA_PICKER_MODAL as T } from "@umbraco-cms/backoffice/media";
import { UmbTextStyles as V } from "@umbraco-cms/backoffice/style";
import { D as p, p as Z, n as M, l as z, i as q, c as B, a as L, b as G } from "./frame-math-BoLC1tYc.js";
const N = new D(
  "Clockwork.Modal.ImageFrameEditor",
  { modal: { type: "sidebar", size: "large" } }
);
var X = Object.defineProperty, J = Object.getOwnPropertyDescriptor, F = (e) => {
  throw TypeError(e);
}, d = (e, t, i, a) => {
  for (var o = a > 1 ? void 0 : a ? J(t, i) : t, n = e.length - 1, r; n >= 0; n--)
    (r = e[n]) && (o = (a ? r(t, i, o) : r(o)) || o);
  return a && o && X(t, i, o), o;
}, b = (e, t, i) => t.has(e) || F("Cannot " + i), c = (e, t, i) => (b(e, t, "read from private field"), i ? i.call(e) : t.get(e)), v = (e, t, i) => t.has(e) ? F("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), U = (e, t, i, a) => (b(e, t, "write to private field"), t.set(e, i), i), u = (e, t, i) => (b(e, t, "access private method"), i), s, w, $, h, C, y, f, I, A, R;
const Q = 320, Y = 200;
let l = class extends O {
  constructor() {
    super(...arguments), v(this, h), v(this, s), v(this, w, new H(this)), v(this, $, new S(this)), this._config = { ...p }, this._imageWidth = 0, this._imageHeight = 0, this._loading = !1, this.readonly = !1;
  }
  set value(e) {
    var a;
    const t = Z(e), i = (t == null ? void 0 : t.mediaKey) !== ((a = c(this, s)) == null ? void 0 : a.mediaKey);
    U(this, s, t), i && u(this, h, C).call(this), this.requestUpdate();
  }
  get value() {
    return c(this, s);
  }
  set config(e) {
    const t = (o, n) => {
      const r = Number(e == null ? void 0 : e.getValueByAlias(o));
      return Number.isFinite(r) && r > 0 ? r : n;
    }, i = (o, n) => {
      const r = e == null ? void 0 : e.getValueByAlias(o);
      return r == null || r === "" ? n : r === !0 || r === "true" || r === 1 || r === "1";
    }, a = t("minZoom", p.minZoom);
    this._config = {
      width: Math.round(t("width", p.width)),
      height: Math.round(t("height", p.height)),
      minZoom: a,
      maxZoom: Math.max(a, t("maxZoom", p.maxZoom)),
      allowRotate: i("allowRotate", p.allowRotate),
      allowFlip: i("allowFlip", p.allowFlip),
      background: M(e == null ? void 0 : e.getValueByAlias("background"))
    };
  }
  render() {
    const e = c(this, s), t = this._config;
    return m`
			${e ? m`<div id="selected">
						${u(this, h, R).call(this, e)}
						<div id="meta">
							<strong>${this._name ?? ""}</strong>
							<small>${this.localize.term("clockworkImageFrame_frameSize")}: ${t.width} × ${t.height} px · ${Math.round(e.zoom * 100)}%</small>
							${this.readonly ? x : m`<div id="actions">
										<uui-button look="primary" label=${this.localize.term("clockworkImageFrame_edit")} ?disabled=${!this._url} @click=${u(this, h, I)}>
											<uui-icon name="icon-crop"></uui-icon> ${this.localize.term("clockworkImageFrame_edit")}
										</uui-button>
										<uui-button look="secondary" label=${this.localize.term("clockworkImageFrame_replace")} @click=${u(this, h, f)}></uui-button>
										<uui-button look="secondary" color="danger" label=${this.localize.term("general_remove")} @click=${u(this, h, A)}></uui-button>
									</div>`}
						</div>
					</div>` : m`<uui-button
						id="add"
						look="placeholder"
						label=${this.localize.term("clockworkImageFrame_choose")}
						?disabled=${this.readonly}
						@click=${u(this, h, f)}>
						<uui-icon name="icon-add"></uui-icon>
						${this.localize.term("clockworkImageFrame_choose")}
						<small>${t.width} × ${t.height} px</small>
					</uui-button>`}
			${this._error ? m`<div id="error">${this._error}</div>` : x}
		`;
  }
};
s = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
$ = /* @__PURE__ */ new WeakMap();
h = /* @__PURE__ */ new WeakSet();
C = async function() {
  var a, o, n, r;
  const e = (a = c(this, s)) == null ? void 0 : a.mediaKey;
  if (this._error = void 0, !e) {
    this._url = this._name = void 0;
    return;
  }
  this._loading = !0;
  const [{ data: t }, { data: i }] = await Promise.all([
    c(this, w).requestItems([e]),
    c(this, $).requestItems([e])
  ]);
  if (((o = c(this, s)) == null ? void 0 : o.mediaKey) === e) {
    if (this._url = (n = t == null ? void 0 : t[0]) == null ? void 0 : n.url, this._name = (r = i == null ? void 0 : i[0]) == null ? void 0 : r.name, this._url) {
      const g = await z(this._url);
      this._imageWidth = g.width, this._imageHeight = g.height;
    } else
      this._error = this.localize.term("clockworkImageFrame_missingMedia");
    this._loading = !1;
  }
};
y = function(e) {
  U(this, s, e), this.requestUpdate(), this.dispatchEvent(new K());
};
f = async function() {
  var n, r;
  const e = await E(this, T, {
    data: { multiple: !1 },
    value: { selection: c(this, s) ? [c(this, s).mediaKey] : [] }
  }).catch(() => {
  }), t = (n = e == null ? void 0 : e.selection) == null ? void 0 : n.find((g) => !!g);
  if (!t) return;
  const { data: i } = await c(this, w).requestItems([t]), a = (r = i == null ? void 0 : i[0]) == null ? void 0 : r.url;
  if (!q(a)) {
    this._error = this.localize.term("clockworkImageFrame_notAnImage");
    return;
  }
  const o = await z(a);
  this._error = void 0, u(this, h, y).call(this, B(t, o.width || void 0, o.height || void 0));
};
I = async function() {
  if (!c(this, s) || !this._url) return;
  const e = await E(this, N, {
    data: { url: this._url, name: this._name, config: this._config },
    value: { ...c(this, s) }
  }).catch(() => {
  });
  e && u(this, h, y).call(this, { ...e, mediaKey: c(this, s).mediaKey });
};
A = function() {
  this._url = this._name = void 0, u(this, h, y).call(this, void 0);
};
R = function(e) {
  const t = this._config, i = Math.min(Q / t.width, Y / t.height, 1), a = M(t.background);
  return m`
			<button
				type="button"
				id="preview"
				class=${a ? "" : "cw-checker"}
				style="width:${t.width * i}px;height:${t.height * i}px;${a ? `background:${a};` : ""}"
				?disabled=${this.readonly || !this._url}
				title=${this.localize.term("clockworkImageFrame_edit")}
				@click=${u(this, h, I)}>
				${this._url ? m`<img src=${this._url} alt=${this._name ?? ""} style=${L(e, t, this._imageWidth, this._imageHeight)} />` : this._loading ? m`<uui-loader-circle></uui-loader-circle>` : m`<uui-icon name="icon-alert"></uui-icon>`}
			</button>
		`;
};
l.styles = [
  V,
  G,
  W`
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
		`
];
d([
  _()
], l.prototype, "_config", 2);
d([
  _()
], l.prototype, "_url", 2);
d([
  _()
], l.prototype, "_name", 2);
d([
  _()
], l.prototype, "_imageWidth", 2);
d([
  _()
], l.prototype, "_imageHeight", 2);
d([
  _()
], l.prototype, "_error", 2);
d([
  _()
], l.prototype, "_loading", 2);
d([
  k({ type: Boolean, reflect: !0 })
], l.prototype, "readonly", 2);
d([
  k({ attribute: !1 })
], l.prototype, "value", 1);
d([
  k({ attribute: !1 })
], l.prototype, "config", 1);
l = d([
  P("clockwork-property-editor-ui-image-frame")
], l);
const se = l;
export {
  l as ClockworkPropertyEditorUiImageFrameElement,
  se as default
};

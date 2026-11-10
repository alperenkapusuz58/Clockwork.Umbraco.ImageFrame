import { css as d } from "@umbraco-cms/backoffice/external/lit";
const b = d`
	.cw-checker {
		background-color: #fff;
		background-image: linear-gradient(45deg, #e9e9eb 25%, transparent 25%), linear-gradient(-45deg, #e9e9eb 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #e9e9eb 75%), linear-gradient(-45deg, transparent 75%, #e9e9eb 75%);
		background-size: 16px 16px;
		background-position: 0 0, 0 8px, 8px -8px, -8px 0;
	}
`, y = {
  width: 300,
  height: 150,
  minZoom: 0.2,
  maxZoom: 4,
  allowRotate: !0,
  allowFlip: !0,
  background: null
};
function p(e, t, n) {
  return { mediaKey: e, imageWidth: t, imageHeight: n, zoom: 1, x: 0.5, y: 0.5, rotation: 0, flipX: !1, flipY: !1 };
}
const m = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})$/i;
function c(e) {
  if (typeof e != "string") return;
  const t = m.exec(e.trim());
  if (!t) return;
  const n = t[1].replace(/-/g, "").toLowerCase();
  return `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20)}`;
}
function f(e) {
  if (!(e == null || e === "")) {
    if (typeof e == "string") {
      const t = e.trim();
      if (t.startsWith("{") || t.startsWith("["))
        try {
          return f(JSON.parse(t));
        } catch {
          return;
        }
      const n = c(t.split(",")[0]);
      return n ? p(n) : void 0;
    }
    if (Array.isArray(e)) {
      for (const t of e) {
        const n = f(t);
        if (n) return n;
      }
      return;
    }
    if (typeof e == "object") {
      const t = e, n = c(t.mediaKey) ?? c(t.udi);
      if (!n) return;
      const r = (i, s) => typeof i == "number" && Number.isFinite(i) ? i : s, o = (i) => typeof i == "number" && i > 0 ? Math.round(i) : void 0;
      return {
        mediaKey: n,
        imageWidth: o(t.imageWidth),
        imageHeight: o(t.imageHeight),
        zoom: r(t.zoom, 1),
        x: r(t.x, 0.5),
        y: r(t.y, 0.5),
        rotation: r(t.rotation, 0),
        flipX: t.flipX === !0,
        flipY: t.flipY === !0
      };
    }
  }
}
function u(e, t, n) {
  return !e || !t ? 1 : Math.min(n.width / e, n.height / t);
}
function $(e, t, n) {
  return !e || !t ? 1 : Math.max(n.width / e, n.height / t) / u(e, t, n);
}
const a = (e) => Math.round(e * 1e4) / 1e4;
function w(e, t, n, r) {
  const o = n || e.imageWidth || t.width, i = r || e.imageHeight || t.height, s = u(o, i, t) * e.zoom, l = s * o / t.width * 100, h = s * i / t.height * 100;
  return [
    "position:absolute",
    `left:${a(e.x * 100)}%`,
    `top:${a(e.y * 100)}%`,
    `width:${a(l)}%`,
    `height:${a(h)}%`,
    "max-width:none",
    "max-height:none",
    `transform:translate(-50%,-50%) rotate(${a(e.rotation)}deg) scale(${e.flipX ? -1 : 1},${e.flipY ? -1 : 1})`
  ].join(";");
}
function k(e) {
  if (typeof e != "string") return null;
  const t = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(e.trim());
  if (!t) return null;
  const n = t[1].toLowerCase();
  return "#" + (n.length === 3 ? n.split("").map((r) => r + r).join("") : n);
}
function z(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function I(e) {
  return new Promise((t) => {
    const n = new Image();
    n.onload = () => t({ width: n.naturalWidth, height: n.naturalHeight }), n.onerror = () => t({ width: 0, height: 0 }), n.src = e;
  });
}
const g = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "tif", "tiff"];
function M(e) {
  var n;
  if (!e) return !1;
  const t = ((n = e.split(/[?#]/)[0].split(".").pop()) == null ? void 0 : n.toLowerCase()) ?? "";
  return g.includes(t);
}
export {
  y as D,
  w as a,
  b,
  p as c,
  z as d,
  $ as e,
  M as i,
  I as l,
  k as n,
  f as p
};

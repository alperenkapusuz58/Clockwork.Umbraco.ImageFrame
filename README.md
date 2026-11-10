# Clockwork Image Frame for Umbraco

A media picker that places every image inside a **fixed frame** (for example 300 × 150 px) where editors can **zoom in and out, pan, rotate and flip**, much like the profile picture editor on social networks.

It was built for a problem every agency knows: a "References" or "Partners" strip where wide logos look huge, tall logos look tiny, and every fix makes another logo look wrong. With Image Frame, every logo comes out at exactly the same pixel size, and editors balance each one visually inside that frame.

| | Umbraco 13 | Umbraco 17 | Umbraco 18 |
|---|---|---|---|
| Supported | ✅ (.NET 8) | ✅ (.NET 10) | ✅ (.NET 10) |

![Image Frame editor](https://raw.githubusercontent.com/alperenkapusuz58/Clockwork.Umbraco.ImageFrame/master/assets/screenshots/frame-editor.png)

## Why not the built-in Image Cropper?

Umbraco's cropper only lets you zoom **in**: the image must always cover the crop area. Image Frame also lets you zoom **out**. Zooming out leaves (transparent or coloured) space around the image, which is exactly what you need to balance logos with different aspect ratios.

## Features

- Fixed output size per data type (width × height in px)
- Zoom in/out (configurable min/max), drag to position, mouse wheel and keyboard support
- *Fit*, *Fill* and *Center* shortcuts, 90° rotation plus fine rotation (±45°), horizontal/vertical flip
- Transparent or solid background, WebP/PNG/JPG output, quality setting
- Server-side rendering through ImageSharp, so the browser downloads one optimised file at the exact size (1x and 2x)
- SVG logos are framed with CSS, so you get the same result without rasterising them
- **Reads existing Media Picker values.** Switch an existing property to Image Frame and its images keep working, centred in the frame.
- Media references tracking ("Referenced by", delete warnings)
- Content Delivery API support
- English and Turkish back-office translations

## Installation

```bash
dotnet add package Clockwork.Umbraco.ImageFrame
```

No further setup is required.

## Setting up a data type

1. **Settings → Data Types → Create**, then choose **Clockwork Image Frame** (Umbraco 13: property editor; Umbraco 17/18: *Image Frame* in the *Media* group).
2. Configure:

| Setting | Default | Notes |
|---|---|---|
| Frame width / height (px) | 300 × 150 | The size of the rendered image (CSS pixels; a 2x version is generated automatically). |
| Minimum zoom | 0.2 | `1` = the image just fits inside the frame. Lower values allow zooming out. |
| Maximum zoom | 4 | |
| Allow rotate / flip | on | |
| Background colour | transparent | Leave empty for transparency (requires WebP or PNG output). |
| Output format | webp | `webp`, `png`, `jpg` or `auto` (keep source format; PNG when transparency is needed). |
| Quality | 90 | WebP/JPG only. |

Typical setups: *Reference logos* 240 × 120, *Partner badges* 200 × 200, *Pop-up icons* 96 × 96, *Video covers* 1280 × 720.

## Rendering

The property returns an `ImageFrameValue`. The simplest option is to write it directly:

```cshtml
@Model.Logo
```

which renders:

```html
<img src="/media/abc/logo.png?cwframe=0.8,0.5,0.5,0,0&cwsize=240,120&format=webp&quality=90"
     srcset="... 1x, ...&cwsize=480,240... 2x" width="240" height="120" alt="Logo" loading="lazy" decoding="async">
```

More control:

```cshtml
@using Clockwork.Umbraco.ImageFrame.Rendering

@Html.ImageFrame(Model.Logo, alt: "Partner name", cssClass: "partner-logo", lazy: false)

@* or build your own markup *@
<img src="@Model.Logo?.Url" srcset="@Model.Logo?.GetUrl(2) 2x" width="@Model.Logo?.Width" height="@Model.Logo?.Height" alt="">

@* background images *@
<div style="background-image:url('@Model.Cover?.GetUrl(2, "jpg")')"></div>
```

Inside a Block List / Block Grid the same applies: `@block.Content.Value<ImageFrameValue>("logo")`.

| Member | Description |
|---|---|
| `Url` | Framed image at 1x (the original file for SVG). |
| `GetUrl(pixelRatio, format)` | Framed image at any pixel ratio, optionally forcing a format. |
| `ToHtml(alt, cssClass, lazy, attributes, forceCss)` | Ready-made markup. |
| `GetCssStyles()` | Inline styles to reproduce the frame with CSS (wrapper + `<img>`). |
| `OriginalUrl`, `Media`, `Name`, `Width`, `Height`, `IsVector`, `Transform` | Raw data. |

### Migrating an existing Media Picker property

1. Create an Image Frame data type with the size you want.
2. Change the property on the document type to use the new data type. Existing values are read as "fit in frame, centred", which is already a big improvement for logos.
3. Update the view: `Model.Logo` is now an `ImageFrameValue` instead of `MediaWithCrops`/`IPublishedContent`. Replace e.g. `@Model.Logo.Url()` with `@Model.Logo?.Url`, or render with `@Model.Logo`.
4. Fine-tune individual images in the back office.

> If you use ModelsBuilder, regenerate models after changing the property.

## Content Delivery API

The property is output as:

```json
{
  "mediaKey": "…", "name": "Logo",
  "url": "/media/…?cwframe=…", "url2x": "/media/…", "originalUrl": "/media/…/logo.png",
  "isVector": false, "width": 240, "height": 120,
  "imageWidth": 1200, "imageHeight": 300,
  "zoom": 0.8, "x": 0.5, "y": 0.5, "rotation": 0, "flipX": false, "flipY": false,
  "background": null
}
```

## How the transform works

The value is resolution independent, so it survives replacing the media file or changing the frame size:

- `zoom = 1`: the whole image fits inside the frame ("contain").
- `x`, `y`: position of the image centre in the frame (0..1, 0.5 = centred).
- `rotation`: degrees clockwise around the image centre. Flips are applied before rotation.

Server side, the image is rendered by an ImageSharp.Web processor (`cwframe`, `cwsize`, `cwbg` commands). Output size is limited by `Umbraco:CMS:Imaging:Resize:MaxWidth/MaxHeight`, and URLs are signed automatically when `Umbraco:CMS:Imaging:HMACSecretKey` is set.

## Requirements and notes

- Uses `Umbraco.Cms.Imaging.ImageSharp` (the default imaging package). Sites on Umbraco 13 that replaced it with `Umbraco.Cms.Imaging.ImageSharp2` are not supported.
- SVG files are framed in the browser with CSS. `Url` returns the original SVG, so use `@Model.Logo` or `ToHtml()` for SVGs.

## Building from source

```bash
cd src/Clockwork.Umbraco.ImageFrame.Client
npm ci
npm run build          # v17/18 back-office bundle + v13 language files
cd ../..
dotnet test
dotnet pack src/Clockwork.Umbraco.ImageFrame -c Release -o artifacts
```

The Umbraco 13 back-office (AngularJS) lives in `wwwroot/App_Plugins/ClockworkImageFrame/v13` and needs no build step.

## License

MIT © Clockwork

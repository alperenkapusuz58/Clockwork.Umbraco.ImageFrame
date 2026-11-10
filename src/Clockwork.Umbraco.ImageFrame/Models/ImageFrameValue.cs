using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using Clockwork.Umbraco.ImageFrame.Rendering;
using Microsoft.AspNetCore.Html;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Clockwork.Umbraco.ImageFrame.Models;

/// <summary>
/// The published value of a Clockwork Image Frame property. Writing it in a Razor view (<c>@Model.Logo</c>)
/// renders the framed image; use <see cref="Url"/> or <see cref="GetUrl"/> for custom markup.
/// </summary>
public sealed class ImageFrameValue : IHtmlContent
{
    private readonly IImageFrameUrlBuilder _urlBuilder;

    internal ImageFrameValue(
        Guid mediaKey,
        IPublishedContent? media,
        string? originalUrl,
        ImageFrameTransform transform,
        ImageFrameConfiguration configuration,
        int? imageWidth,
        int? imageHeight,
        IImageFrameUrlBuilder urlBuilder)
    {
        MediaKey = mediaKey;
        Media = media;
        OriginalUrl = originalUrl;
        Transform = transform;
        Configuration = configuration;
        ImageWidth = imageWidth;
        ImageHeight = imageHeight;
        _urlBuilder = urlBuilder;
    }

    public Guid MediaKey { get; }

    /// <summary>The picked media item, or null when it has been deleted or isn't published.</summary>
    public IPublishedContent? Media { get; }

    /// <summary>URL of the untouched media file.</summary>
    public string? OriginalUrl { get; }

    public ImageFrameTransform Transform { get; }

    public ImageFrameConfiguration Configuration { get; }

    /// <summary>Frame width in CSS pixels (from the data type).</summary>
    public int Width => Configuration.Width;

    /// <summary>Frame height in CSS pixels (from the data type).</summary>
    public int Height => Configuration.Height;

    /// <summary>Natural image size, when known.</summary>
    public int? ImageWidth { get; }

    public int? ImageHeight { get; }

    /// <summary>Media name, handy as alt text.</summary>
    public string? Name => Media?.Name;

    public bool HasImage => !string.IsNullOrEmpty(OriginalUrl);

    /// <summary>
    /// Vector (SVG) files can't be rasterised by ImageSharp, so they're framed with CSS instead;
    /// <see cref="Url"/> then returns the original file.
    /// </summary>
    public bool IsVector => OriginalUrl is not null
        && Path.GetExtension(OriginalUrl.Split('?', '#')[0]).Equals(".svg", StringComparison.OrdinalIgnoreCase);

    /// <summary>URL of the framed image at 1x. For vector images this is the original file.</summary>
    public string? Url => GetUrl();

    /// <summary>URL of the framed image rendered at <paramref name="pixelRatio"/> × the frame size.</summary>
    public string? GetUrl(double pixelRatio = 1, string? format = null)
    {
        if (!HasImage)
        {
            return null;
        }

        if (IsVector)
        {
            return OriginalUrl;
        }

        pixelRatio = Math.Clamp(pixelRatio, 0.1, 4);
        var width = Math.Max(1, (int)Math.Round(Width * pixelRatio));
        var height = Math.Max(1, (int)Math.Round(Height * pixelRatio));
        return _urlBuilder.BuildUrl(OriginalUrl!, Transform, Configuration, width, height, format);
    }

    /// <summary>
    /// Inline styles that reproduce the frame with CSS: one for a positioned wrapper, one for the &lt;img&gt; inside it.
    /// Works for every image type; used automatically for SVG.
    /// </summary>
    public (string Wrapper, string Image) GetCssStyles()
    {
        var w = (double)(ImageWidth ?? Width);
        var h = (double)(ImageHeight ?? Height);
        var scale = Transform.GetScale(w, h, Width, Height);
        var widthPercent = scale * w / Width * 100;
        var heightPercent = scale * h / Height * 100;

        var wrapper = new StringBuilder()
            .Append("display:inline-block;position:relative;overflow:hidden;vertical-align:middle;")
            .Append(CultureInfo.InvariantCulture, $"width:{Width}px;max-width:100%;aspect-ratio:{Width}/{Height};");
        var background = ColorHelper.NormalizeHex(Configuration.Background);
        if (background is not null)
        {
            wrapper.Append("background-color:#").Append(background).Append(';');
        }

        var image = string.Create(
            CultureInfo.InvariantCulture,
            $"position:absolute;left:{F(Transform.X * 100)}%;top:{F(Transform.Y * 100)}%;width:{F(widthPercent)}%;height:{F(heightPercent)}%;max-width:none;max-height:none;margin:0;transform:translate(-50%,-50%) rotate({F(Transform.Rotation)}deg) scale({(Transform.FlipX ? -1 : 1)},{(Transform.FlipY ? -1 : 1)});");

        return (wrapper.ToString(), image);
    }

    /// <summary>Renders the framed image.</summary>
    /// <param name="alt">Alt text; defaults to the media name. Pass an empty string for decorative images.</param>
    /// <param name="cssClass">CSS class for the &lt;img&gt; (or the wrapper for vector images).</param>
    /// <param name="lazy">Adds loading="lazy".</param>
    /// <param name="attributes">Extra HTML attributes.</param>
    /// <param name="forceCss">Always use CSS framing, even for raster images.</param>
    public IHtmlContent ToHtml(string? alt = null, string? cssClass = null, bool lazy = true, IDictionary<string, string?>? attributes = null, bool forceCss = false)
    {
        if (!HasImage)
        {
            return HtmlString.Empty;
        }

        var encoder = HtmlEncoder.Default;
        alt ??= Name ?? string.Empty;
        var sb = new StringBuilder();

        void AppendAttributes()
        {
            if (attributes is null)
            {
                return;
            }

            foreach (var (key, value) in attributes)
            {
                sb.Append(' ').Append(encoder.Encode(key));
                if (value is not null)
                {
                    sb.Append("=\"").Append(encoder.Encode(value)).Append('"');
                }
            }
        }

        if (IsVector || forceCss)
        {
            var (wrapperStyle, imageStyle) = GetCssStyles();
            sb.Append("<span class=\"cw-image-frame");
            if (!string.IsNullOrWhiteSpace(cssClass))
            {
                sb.Append(' ').Append(encoder.Encode(cssClass));
            }

            sb.Append("\" style=\"").Append(wrapperStyle).Append('"');
            AppendAttributes();
            sb.Append("><img src=\"").Append(encoder.Encode(OriginalUrl!)).Append("\" alt=\"").Append(encoder.Encode(alt)).Append('"');
            if (lazy)
            {
                sb.Append(" loading=\"lazy\"");
            }

            sb.Append(" decoding=\"async\" style=\"").Append(imageStyle).Append("\"></span>");
            return new HtmlString(sb.ToString());
        }

        var src1x = GetUrl(1)!;
        var src2x = GetUrl(2)!;
        sb.Append("<img src=\"").Append(encoder.Encode(src1x))
            .Append("\" srcset=\"").Append(encoder.Encode(src1x)).Append(" 1x, ").Append(encoder.Encode(src2x)).Append(" 2x\"")
            .Append(CultureInfo.InvariantCulture, $" width=\"{Width}\" height=\"{Height}\"")
            .Append(" alt=\"").Append(encoder.Encode(alt)).Append('"');
        if (!string.IsNullOrWhiteSpace(cssClass))
        {
            sb.Append(" class=\"").Append(encoder.Encode(cssClass)).Append('"');
        }

        if (lazy)
        {
            sb.Append(" loading=\"lazy\"");
        }

        sb.Append(" decoding=\"async\"");
        AppendAttributes();
        sb.Append('>');
        return new HtmlString(sb.ToString());
    }

    public void WriteTo(TextWriter writer, HtmlEncoder encoder) => ToHtml().WriteTo(writer, encoder);

    public override string ToString() => Url ?? string.Empty;

    private static string F(double value) => ImageFrameTransform.Format(value);
}

using System.Globalization;
using System.Numerics;
using Clockwork.Umbraco.ImageFrame.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Bmp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Web;
using SixLabors.ImageSharp.Web.Commands;
using SixLabors.ImageSharp.Web.Processors;
using Umbraco.Cms.Core.Configuration.Models;

namespace Clockwork.Umbraco.ImageFrame.Imaging;

/// <summary>
/// ImageSharp.Web processor that renders an image inside a fixed frame:
/// <c>?cwframe=zoom,x,y,rotation,flags&amp;cwsize=width,height[&amp;cwbg=ffffff]</c>.
/// </summary>
public sealed class ImageFrameWebProcessor : IImageWebProcessor
{
    private static readonly IEnumerable<string> SupportedCommands =
        [ImageFrameConstants.FrameCommand, ImageFrameConstants.SizeCommand, ImageFrameConstants.BackgroundCommand];

    private readonly IOptionsMonitor<ImagingSettings>? _imagingSettings;

    public ImageFrameWebProcessor(IOptionsMonitor<ImagingSettings>? imagingSettings = null)
        => _imagingSettings = imagingSettings;

    public IEnumerable<string> Commands => SupportedCommands;

    public FormattedImage Process(FormattedImage image, ILogger logger, CommandCollection commands, CommandParser parser, CultureInfo culture)
    {
        var frame = Get(commands, ImageFrameConstants.FrameCommand);
        var size = Get(commands, ImageFrameConstants.SizeCommand);
        if (!ImageFrameTransform.TryParseCommandValue(frame, out var transform) || !TryParseSize(size, out var width, out var height))
        {
            return image;
        }

        var maxWidth = _imagingSettings?.CurrentValue.Resize.MaxWidth ?? 5000;
        var maxHeight = _imagingSettings?.CurrentValue.Resize.MaxHeight ?? 5000;
        if (width > maxWidth || height > maxHeight)
        {
            var ratio = Math.Min((double)maxWidth / width, (double)maxHeight / height);
            width = Math.Max(1, (int)(width * ratio));
            height = Math.Max(1, (int)(height * ratio));
        }

        var background = ColorHelper.NormalizeHex(Get(commands, ImageFrameConstants.BackgroundCommand));
        Render(image.Image, transform, width, height, background);

        // Transparent padding needs an alpha channel: JPEG/BMP sources become PNG unless a format was requested.
        if (background is null && image.Format is JpegFormat or BmpFormat)
        {
            image.Format = PngFormat.Instance;
        }

        return image;
    }

    public bool RequiresTrueColorPixelFormat(CommandCollection commands, CommandParser parser, CultureInfo culture) => true;

    /// <summary>Renders <paramref name="image"/> in place into a <paramref name="width"/>×<paramref name="height"/> frame.</summary>
    public static void Render(Image image, ImageFrameTransform transform, int width, int height, string? backgroundHex)
    {
        image.Mutate(x => x.AutoOrient());

        double sourceWidth = image.Width;
        double sourceHeight = image.Height;
        var scale = transform.GetScale(sourceWidth, sourceHeight, width, height);

        // Downscale with a proper resampler first; the affine pass then only rotates/positions at ~1:1.
        if (scale < 1)
        {
            var resizedWidth = Math.Max(1, (int)Math.Round(sourceWidth * scale));
            var resizedHeight = Math.Max(1, (int)Math.Round(sourceHeight * scale));
            image.Mutate(x => x.Resize(resizedWidth, resizedHeight, KnownResamplers.Bicubic));
            scale = scale * sourceWidth / resizedWidth;
            sourceWidth = resizedWidth;
            sourceHeight = resizedHeight;
        }

        var matrix =
            Matrix3x2.CreateTranslation((float)(-sourceWidth / 2), (float)(-sourceHeight / 2))
            * Matrix3x2.CreateScale((float)(scale * (transform.FlipX ? -1 : 1)), (float)(scale * (transform.FlipY ? -1 : 1)))
            * Matrix3x2.CreateRotation((float)(transform.Rotation * Math.PI / 180))
            * Matrix3x2.CreateTranslation((float)(transform.X * width), (float)(transform.Y * height));

        image.Mutate(x =>
        {
            x.Transform(new Rectangle(0, 0, (int)sourceWidth, (int)sourceHeight), matrix, new Size(width, height), KnownResamplers.Bicubic);
            if (backgroundHex is not null)
            {
                x.BackgroundColor(Color.ParseHex(backgroundHex));
            }
        });
    }

    private static string? Get(CommandCollection commands, string key)
        => commands.Contains(key) ? commands[key] : null;

    private static bool TryParseSize(string? value, out int width, out int height)
    {
        width = height = 0;
        var parts = value?.Split(',');
        return parts is { Length: 2 }
               && int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out width)
               && int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out height)
               && width > 0 && height > 0;
    }
}

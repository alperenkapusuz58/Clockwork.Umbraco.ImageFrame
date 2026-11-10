using System.Globalization;

namespace Clockwork.Umbraco.ImageFrame.Models;

/// <summary>
/// Describes how an image is placed inside its frame. The model is resolution independent:
/// <list type="bullet">
/// <item><c>Zoom = 1</c> means the whole image fits inside the frame ("contain").</item>
/// <item><c>X</c>/<c>Y</c> are the position of the image centre in the frame, 0..1 (0.5 = centred).</item>
/// <item><c>Rotation</c> is in degrees, clockwise, around the image centre. Flips are applied before rotation.</item>
/// </list>
/// </summary>
public sealed record ImageFrameTransform
{
    public static readonly ImageFrameTransform Default = new();

    public double Zoom { get; init; } = 1;
    public double X { get; init; } = 0.5;
    public double Y { get; init; } = 0.5;
    public double Rotation { get; init; }
    public bool FlipX { get; init; }
    public bool FlipY { get; init; }

    /// <summary>Scale from source pixels to frame pixels.</summary>
    public double GetScale(double imageWidth, double imageHeight, double frameWidth, double frameHeight)
    {
        if (imageWidth <= 0 || imageHeight <= 0)
        {
            return 1;
        }

        return Math.Min(frameWidth / imageWidth, frameHeight / imageHeight) * Zoom;
    }

    internal string ToCommandValue()
    {
        var flags = (FlipX ? 1 : 0) | (FlipY ? 2 : 0);
        return string.Join(',', Format(Zoom), Format(X), Format(Y), Format(Rotation), flags.ToString(CultureInfo.InvariantCulture));
    }

    internal static bool TryParseCommandValue(string? value, out ImageFrameTransform transform)
    {
        transform = Default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var parts = value.Split(',');
        if (parts.Length < 5
            || !TryParse(parts[0], out var zoom)
            || !TryParse(parts[1], out var x)
            || !TryParse(parts[2], out var y)
            || !TryParse(parts[3], out var rotation)
            || !int.TryParse(parts[4], NumberStyles.Integer, CultureInfo.InvariantCulture, out var flags))
        {
            return false;
        }

        transform = new ImageFrameTransform
        {
            Zoom = zoom,
            X = x,
            Y = y,
            Rotation = rotation,
            FlipX = (flags & 1) != 0,
            FlipY = (flags & 2) != 0,
        }.Sanitize();
        return true;
    }

    /// <summary>Clamps values so a corrupt or hand-crafted value can't produce absurd output.</summary>
    public ImageFrameTransform Sanitize() => this with
    {
        Zoom = Clamp(Zoom, 0.01, 50, 1),
        X = Clamp(X, -5, 6, 0.5),
        Y = Clamp(Y, -5, 6, 0.5),
        Rotation = double.IsFinite(Rotation) ? Rotation % 360 : 0,
    };

    private static double Clamp(double value, double min, double max, double fallback)
        => double.IsFinite(value) ? Math.Clamp(value, min, max) : fallback;

    internal static string Format(double value)
        => Math.Round(value, 4).ToString("0.####", CultureInfo.InvariantCulture);

    private static bool TryParse(string value, out double result)
        => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out result) && double.IsFinite(result);
}

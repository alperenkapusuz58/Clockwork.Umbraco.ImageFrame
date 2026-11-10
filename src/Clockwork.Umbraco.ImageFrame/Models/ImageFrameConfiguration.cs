using System.Collections;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Clockwork.Umbraco.ImageFrame.Models;

/// <summary>Data type configuration of a Clockwork Image Frame property.</summary>
public sealed record ImageFrameConfiguration
{
    public int Width { get; init; } = 300;
    public int Height { get; init; } = 150;
    public double MinZoom { get; init; } = 0.2;
    public double MaxZoom { get; init; } = 4;
    public bool AllowRotate { get; init; } = true;
    public bool AllowFlip { get; init; } = true;

    /// <summary>"transparent" or a hex colour such as "#ffffff".</summary>
    public string Background { get; init; } = "transparent";

    /// <summary>"webp", "png", "jpg" or "auto" (keep the source format; PNG when the source has no alpha but the frame is transparent).</summary>
    public string OutputFormat { get; init; } = "webp";

    public int Quality { get; init; } = 90;

    public bool IsTransparent => ColorHelper.IsTransparent(Background);

    /// <summary>Reads the configuration object Umbraco hands to value converters (a dictionary on 13, 17 and 18).</summary>
    public static ImageFrameConfiguration From(object? configuration)
    {
        var result = new ImageFrameConfiguration();
        if (configuration is not IDictionary dictionary)
        {
            return result;
        }

        var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (DictionaryEntry entry in dictionary)
        {
            values[entry.Key.ToString() ?? string.Empty] = entry.Value;
        }

        var width = GetInt(values, ImageFrameConstants.Config.Width);
        var height = GetInt(values, ImageFrameConstants.Config.Height);
        var minZoom = GetDouble(values, ImageFrameConstants.Config.MinZoom);
        var maxZoom = GetDouble(values, ImageFrameConstants.Config.MaxZoom);
        var quality = GetInt(values, ImageFrameConstants.Config.Quality);
        var background = GetString(values, ImageFrameConstants.Config.Background);
        var format = GetString(values, ImageFrameConstants.Config.OutputFormat);

        result = result with
        {
            Width = width is > 0 and <= 10000 ? width.Value : result.Width,
            Height = height is > 0 and <= 10000 ? height.Value : result.Height,
            MinZoom = minZoom is > 0 ? minZoom.Value : result.MinZoom,
            MaxZoom = maxZoom is > 0 ? maxZoom.Value : result.MaxZoom,
            AllowRotate = GetBool(values, ImageFrameConstants.Config.AllowRotate) ?? result.AllowRotate,
            AllowFlip = GetBool(values, ImageFrameConstants.Config.AllowFlip) ?? result.AllowFlip,
            Background = string.IsNullOrWhiteSpace(background) ? result.Background : background.Trim(),
            OutputFormat = string.IsNullOrWhiteSpace(format) ? result.OutputFormat : format.Trim().ToLowerInvariant(),
            Quality = quality is > 0 and <= 100 ? quality.Value : result.Quality,
        };

        if (result.MaxZoom < result.MinZoom)
        {
            result = result with { MaxZoom = result.MinZoom };
        }

        return result;
    }

    private static string? GetString(Dictionary<string, object?> values, string key)
    {
        if (!values.TryGetValue(key, out var value) || value is null)
        {
            return null;
        }

        var text = value switch
        {
            string s => s,
            JsonElement { ValueKind: JsonValueKind.String } e => e.GetString(),
            JsonElement { ValueKind: JsonValueKind.Array } e => e.EnumerateArray().Select(x => x.ToString()).FirstOrDefault(),
            JsonElement e => e.ToString(),
            JsonArray a => a.FirstOrDefault()?.ToString(),
            JsonNode n => n.ToString(),
            IEnumerable enumerable => enumerable.Cast<object?>().Select(x => x?.ToString()).FirstOrDefault(),
            IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString(),
        };

        return text?.Trim().Trim('"');
    }

    private static int? GetInt(Dictionary<string, object?> values, string key)
    {
        var d = GetDouble(values, key);
        return d.HasValue ? (int)Math.Round(d.Value) : null;
    }

    private static double? GetDouble(Dictionary<string, object?> values, string key)
    {
        var s = GetString(values, key);
        return double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var d) && double.IsFinite(d) ? d : null;
    }

    private static bool? GetBool(Dictionary<string, object?> values, string key)
    {
        var s = GetString(values, key);
        return s?.ToLowerInvariant() switch
        {
            "true" or "1" => true,
            "false" or "0" => false,
            _ => null,
        };
    }
}

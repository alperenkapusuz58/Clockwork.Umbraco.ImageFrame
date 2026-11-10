using System.Text.Json;
using System.Text.Json.Serialization;

namespace Clockwork.Umbraco.ImageFrame.Models;

/// <summary>The JSON stored in the database for a Clockwork Image Frame property.</summary>
public sealed class ImageFrameStoredValue
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public Guid MediaKey { get; set; }

    /// <summary>Natural width of the image as measured by the editor (used for vector images and CSS rendering).</summary>
    public int? ImageWidth { get; set; }

    /// <summary>Natural height of the image as measured by the editor.</summary>
    public int? ImageHeight { get; set; }

    public double Zoom { get; set; } = 1;
    public double X { get; set; } = 0.5;
    public double Y { get; set; } = 0.5;
    public double Rotation { get; set; }
    public bool FlipX { get; set; }
    public bool FlipY { get; set; }

    /// <summary>True when the value was read from a legacy Media Picker value and has never been framed.</summary>
    [JsonIgnore]
    public bool IsLegacy { get; private set; }

    public ImageFrameTransform ToTransform() => new ImageFrameTransform
    {
        Zoom = Zoom,
        X = X,
        Y = Y,
        Rotation = Rotation,
        FlipX = FlipX,
        FlipY = FlipY,
    }.Sanitize();

    public string Serialize() => JsonSerializer.Serialize(this, SerializerOptions);

    /// <summary>
    /// Parses the stored value. Besides the package's own format it understands values written by
    /// Umbraco's Media Picker (v3 JSON array), the legacy Media Picker (UDI list) and a bare key, so an
    /// existing property can be switched to this editor without losing its images.
    /// </summary>
    public static ImageFrameStoredValue? Parse(object? source)
    {
        var text = source switch
        {
            null => null,
            string s => s,
            JsonElement e => e.ValueKind == JsonValueKind.String ? e.GetString() : e.GetRawText(),
            _ => source.ToString(),
        };

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        text = text.Trim();

        if (text[0] is '{' or '[')
        {
            try
            {
                using var document = JsonDocument.Parse(text);
                return FromJson(document.RootElement);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        // Legacy media picker: "umb://media/{guid},umb://media/{guid}" or a bare guid.
        var first = text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        return TryParseKey(first, out var key) ? new ImageFrameStoredValue { MediaKey = key, IsLegacy = true } : null;
    }

    private static ImageFrameStoredValue? FromJson(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            // Media Picker v3: [{ "key": "...", "mediaKey": "...", "crops": [], "focalPoint": null }]
            foreach (var item in element.EnumerateArray())
            {
                var legacy = FromJson(item);
                if (legacy is not null)
                {
                    legacy.IsLegacy = true;
                    return legacy;
                }
            }

            return null;
        }

        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        Guid key = default;
        if ((!TryGetString(element, "mediaKey", out var mediaKey) || !TryParseKey(mediaKey, out key))
            && (!TryGetString(element, "udi", out var udi) || !TryParseKey(udi, out key)))
        {
            return null;
        }

        var value = new ImageFrameStoredValue
        {
            MediaKey = key,
            ImageWidth = GetInt(element, "imageWidth"),
            ImageHeight = GetInt(element, "imageHeight"),
            Zoom = GetDouble(element, "zoom") ?? 1,
            X = GetDouble(element, "x") ?? 0.5,
            Y = GetDouble(element, "y") ?? 0.5,
            Rotation = GetDouble(element, "rotation") ?? 0,
            FlipX = GetBool(element, "flipX"),
            FlipY = GetBool(element, "flipY"),
        };

        value.IsLegacy = !element.TryGetProperty("zoom", out _);
        return value;
    }

    internal static bool TryParseKey(string? value, out Guid key)
    {
        key = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var lastSlash = value.LastIndexOf('/');
        var candidate = lastSlash >= 0 ? value[(lastSlash + 1)..] : value;
        return Guid.TryParse(candidate, out key) && key != Guid.Empty;
    }

    private static bool TryGetString(JsonElement element, string name, out string? value)
    {
        value = element.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;
        return value is not null;
    }

    private static double? GetDouble(JsonElement element, string name)
        => element.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number && p.TryGetDouble(out var d) && double.IsFinite(d) ? d : null;

    private static int? GetInt(JsonElement element, string name)
    {
        var d = GetDouble(element, name);
        return d is > 0 ? (int)Math.Round(d.Value) : null;
    }

    private static bool GetBool(JsonElement element, string name)
        => element.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.True;
}
